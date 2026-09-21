import { Router } from 'express';
import { z } from 'zod';
import { one, query, tx } from '../db.js';
import { HttpError, notFound } from '../lib/errors.js';
import { parse, uuid } from '../lib/http.js';
import { localToUtc } from '../lib/time.js';
import { requireAuth, requireMember, resolveSubject, wrap } from '../middleware/auth.js';

export const caregiversRouter = Router();
caregiversRouter.use(requireAuth, requireMember);
const subjectQ = z.object({ seniorId: uuid.optional() });
const COLS = 'id, name, rating, reviews_count, experience_years, specialties, hourly_rate_bdt, area, verified, available_from';

caregiversRouter.get('/', wrap(async (req, res) => {
  const { q, specialty } = parse(z.object({ q: z.string().max(80).optional(), specialty: z.string().max(60).optional() }), req.query);
  res.json({ caregivers: await query(`SELECT ${COLS} FROM caregivers WHERE active
      AND ($1::text IS NULL OR name ILIKE '%'||$1||'%' OR area ILIKE '%'||$1||'%' OR EXISTS (SELECT 1 FROM unnest(specialties) s WHERE s ILIKE '%'||$1||'%'))
      AND ($2::text IS NULL OR $2 = ANY(specialties)) ORDER BY verified DESC, rating DESC, reviews_count DESC`, [q ?? null, specialty ?? null]) });
}));

caregiversRouter.get('/bookings', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const rows = await query(`SELECT b.id, b.starts_at, b.ends_at, b.services, b.notes, b.total_bdt, b.status, c.id AS caregiver_id, c.name AS caregiver_name
      FROM caregiver_bookings b JOIN caregivers c ON c.id=b.caregiver_id WHERE b.senior_id=$1 ORDER BY b.starts_at DESC`, [seniorId]);
  res.json({ bookings: rows });
}));

caregiversRouter.post('/bookings', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
  const b = parse(z.object({ caregiverId: uuid, date: z.string().date(), startTime: hhmm, endTime: hhmm,
    services: z.array(z.string().trim().max(60)).max(10).default([]), notes: z.string().trim().max(500).optional() }), req.body);
  const startsAt = localToUtc(b.date, b.startTime), endsAt = localToUtc(b.date, b.endTime);
  const hours = (endsAt.getTime() - startsAt.getTime()) / 3600_000;
  if (hours <= 0 || hours > 12) throw new HttpError(400, 'bad_duration', 'A visit must be between 30 minutes and 12 hours');
  if (startsAt.getTime() <= Date.now()) throw new HttpError(400, 'in_the_past', 'Please choose a future time');

  const booking = await tx(async (c) => {
    // Lock the caregiver row so two simultaneous requests cannot both pass the overlap check.
    const cg = await one<any>('SELECT id, hourly_rate_bdt FROM caregivers WHERE id=$1 AND active FOR UPDATE', [b.caregiverId], c);
    if (!cg) throw notFound('Caregiver not found');
    const clash = await one(`SELECT 1 FROM caregiver_bookings WHERE caregiver_id=$1 AND status IN ('pending','confirmed') AND starts_at < $3 AND ends_at > $2`, [b.caregiverId, startsAt, endsAt], c);
    if (clash) throw new HttpError(409, 'unavailable', 'This caregiver is already booked for that time');
    // The price is computed here from the database rate — a client-supplied total is never trusted.
    return one(`INSERT INTO caregiver_bookings (senior_id, caregiver_id, starts_at, ends_at, services, notes, total_bdt)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, starts_at, ends_at, services, total_bdt, status`,
      [seniorId, b.caregiverId, startsAt, endsAt, b.services, b.notes ?? null, Math.round(hours * cg.hourlyRateBdt)], c);
  });
  res.status(201).json({ booking });
}));

caregiversRouter.post('/bookings/:id/cancel', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const r = await query(`UPDATE caregiver_bookings SET status='cancelled' WHERE id=$1 AND senior_id=$2 AND status IN ('pending','confirmed') RETURNING id`, [parse(uuid, req.params.id), seniorId]);
  if (!r.length) throw notFound('No cancellable booking found');
  res.json({ ok: true });
}));
