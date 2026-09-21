import { Router } from 'express';
import { z } from 'zod';
import { one, query } from '../db.js';
import { HttpError, notFound } from '../lib/errors.js';
import { parse, uuid } from '../lib/http.js';
import { localToUtc } from '../lib/time.js';
import { requireAuth, requireMember, wrap } from '../middleware/auth.js';

export const agewellRouter = Router();
agewellRouter.use(requireAuth, requireMember);
export const FACILITIES = ['Community Room', 'Garden Pavilion', 'Activity Hall', 'Library Lounge'] as const;

agewellRouter.get('/rooms', wrap(async (_req, res) =>
  res.json({ rooms: await query('SELECT id, name, type, size_sqft, floor, features, price_month_bdt, available_from FROM living_rooms WHERE active ORDER BY price_month_bdt') })));

agewellRouter.get('/applications', wrap(async (req, res) =>
  res.json({ applications: await query(`SELECT a.id, a.status, a.move_in_on, a.note, a.created_at, r.id AS room_id, r.name AS room_name, r.price_month_bdt
      FROM room_applications a JOIN living_rooms r ON r.id=a.room_id WHERE a.user_id=$1 ORDER BY a.created_at DESC`, [req.user!.id]) })));

agewellRouter.post('/applications', wrap(async (req, res) => {
  const b = parse(z.object({ roomId: uuid, moveInOn: z.string().date().optional(), note: z.string().trim().max(1000).optional() }), req.body);
  if (!(await one('SELECT 1 FROM living_rooms WHERE id=$1 AND active', [b.roomId]))) throw notFound('Room not found');
  try {
    res.status(201).json({ application: await one('INSERT INTO room_applications (user_id, room_id, move_in_on, note) VALUES ($1,$2,$3,$4) RETURNING id, status', [req.user!.id, b.roomId, b.moveInOn ?? null, b.note ?? null]) });
  } catch (e: any) {
    if (e.code === '23505') throw new HttpError(409, 'already_applied', 'You already have an open application for this room');
    throw e;
  }
}));

agewellRouter.patch('/applications/:id', wrap(async (req, res) => {
  const b = parse(z.object({ moveInOn: z.string().date().optional(), note: z.string().trim().max(1000).optional(), withdraw: z.boolean().optional() }), req.body);
  const r = await query(`UPDATE room_applications SET move_in_on = COALESCE($3, move_in_on), note = COALESCE($4, note), status = CASE WHEN $5 THEN 'withdrawn' ELSE status END
      WHERE id=$1 AND user_id=$2 AND status IN ('submitted','under_review') RETURNING id, status`, [parse(uuid, req.params.id), req.user!.id, b.moveInOn ?? null, b.note ?? null, b.withdraw ?? false]);
  if (!r.length) throw notFound('No editable application found');
  res.json({ application: r[0] });
}));

agewellRouter.get('/facility-bookings', wrap(async (req, res) =>
  res.json({ facilities: FACILITIES, bookings: await query(`SELECT id, facility, starts_at, ends_at, purpose, status FROM facility_bookings WHERE user_id=$1 AND status='confirmed' AND ends_at > now() ORDER BY starts_at`, [req.user!.id]) })));

agewellRouter.post('/facility-bookings', wrap(async (req, res) => {
  const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
  const b = parse(z.object({ facility: z.enum(FACILITIES), date: z.string().date(), startTime: hhmm, endTime: hhmm, purpose: z.string().trim().max(200).optional() }), req.body);
  const s = localToUtc(b.date, b.startTime), e = localToUtc(b.date, b.endTime);
  if (e <= s) throw new HttpError(400, 'bad_range', 'End time must be after start time');
  if (s.getTime() <= Date.now()) throw new HttpError(400, 'in_the_past', 'Please choose a future time');
  const clash = await one(`SELECT 1 FROM facility_bookings WHERE facility=$1 AND status='confirmed' AND starts_at < $3 AND ends_at > $2`, [b.facility, s, e]);
  if (clash) throw new HttpError(409, 'unavailable', `${b.facility} is already booked at that time`);
  res.status(201).json({ booking: await one('INSERT INTO facility_bookings (user_id, facility, starts_at, ends_at, purpose) VALUES ($1,$2,$3,$4,$5) RETURNING id, facility, starts_at, ends_at', [req.user!.id, b.facility, s, e, b.purpose ?? null]) });
}));

agewellRouter.post('/facility-bookings/:id/cancel', wrap(async (req, res) => {
  const r = await query(`UPDATE facility_bookings SET status='cancelled' WHERE id=$1 AND user_id=$2 AND status='confirmed' RETURNING id`, [parse(uuid, req.params.id), req.user!.id]);
  if (!r.length) throw notFound();
  res.json({ ok: true });
}));
