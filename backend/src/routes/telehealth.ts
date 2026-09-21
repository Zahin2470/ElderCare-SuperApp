import { Router } from 'express';
import { createHmac } from 'node:crypto';
import { config } from '../config.js';
import { z } from 'zod';
import { one, query } from '../db.js';
import { HttpError, notFound } from '../lib/errors.js';
import { parse, uuid } from '../lib/http.js';
import { localNow, localToUtc, toMinutes } from '../lib/time.js';
import { requireAuth, requireMember, resolveSubject, wrap } from '../middleware/auth.js';

export const telehealthRouter = Router();
telehealthRouter.use(requireAuth, requireMember);

export const SLOT_TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
const subjectQ = z.object({ seniorId: uuid.optional() });
const DOCTOR_COLS = 'id, name, specialty, designation, hospital, rating, reviews_count, experience_years, fee_bdt, about';

telehealthRouter.get('/doctors', wrap(async (req, res) => {
  const { specialty, q } = parse(z.object({ specialty: z.string().max(60).optional(), q: z.string().max(80).optional() }), req.query);
  res.json({ doctors: await query(`SELECT ${DOCTOR_COLS} FROM doctors WHERE active
      AND ($1::text IS NULL OR specialty = $1) AND ($2::text IS NULL OR name ILIKE '%'||$2||'%' OR hospital ILIKE '%'||$2||'%')
      ORDER BY rating DESC, name`, [specialty ?? null, q ?? null]) });
}));

telehealthRouter.get('/doctors/:id/slots', wrap(async (req, res) => {
  const id = parse(uuid, req.params.id);
  const date = parse(z.string().date(), req.query.date ?? localNow().date);
  const booked = await query<{ startsAt: Date }>(`SELECT starts_at FROM appointments WHERE doctor_id=$1 AND status <> 'cancelled' AND starts_at >= $2 AND starts_at < $2 + interval '1 day'`, [id, localToUtc(date, '00:00')]);
  const taken = new Set(booked.map((b) => b.startsAt.getTime()));
  const now = localNow();
  res.json({ date, slots: SLOT_TIMES.map((t) => ({
    time: t, available: !taken.has(localToUtc(date, t).getTime()) && (date > now.date || (date === now.date && toMinutes(t) > now.minutes)),
  })) });
}));

telehealthRouter.get('/appointments', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const rows = await query<any>(`SELECT a.id, a.starts_at, a.type, a.reason, a.location, a.status, a.diagnosis, a.consult_notes, d.id AS doctor_id, d.name AS doctor_name, d.specialty, d.hospital
      FROM appointments a JOIN doctors d ON d.id=a.doctor_id WHERE a.senior_id=$1 ORDER BY a.starts_at DESC`, [seniorId]);
  const now = Date.now();
  res.json({
    upcoming: rows.filter((a) => a.status === 'confirmed' && a.startsAt.getTime() >= now - 3600_000).reverse(),
    past: rows.filter((a) => a.status === 'completed'),
  });
}));

telehealthRouter.post('/appointments', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const b = parse(z.object({ doctorId: uuid, date: z.string().date(), time: z.enum(SLOT_TIMES as [string, ...string[]]),
    type: z.enum(['video', 'in_person', 'chat']).default('video'), reason: z.string().trim().max(500).optional() }), req.body);
  const doc = await one<any>('SELECT id, hospital FROM doctors WHERE id=$1 AND active', [b.doctorId]);
  if (!doc) throw notFound('Doctor not found');
  const startsAt = localToUtc(b.date, b.time);
  if (startsAt.getTime() <= Date.now()) throw new HttpError(400, 'in_the_past', 'Please choose a future time');
  try {
    const a = await one(`INSERT INTO appointments (senior_id, doctor_id, starts_at, type, reason, location) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, starts_at, type, status`,
      [seniorId, b.doctorId, startsAt, b.type, b.reason ?? null, b.type === 'in_person' ? doc.hospital : null]);
    res.status(201).json({ appointment: a });
  } catch (e: any) {
    if (e.code === '23505') throw new HttpError(409, 'slot_taken', 'That time was just booked. Please pick another slot.');
    throw e;
  }
}));

/**
 * Join link for a video visit. Unguessable room name (HMAC of the appointment id), issued only to the
 * appointment's owner and only from 15 minutes before to 90 minutes after the start time.
 */
telehealthRouter.get('/appointments/:id/join', wrap(async (req, res) => {
  if (!config.VIDEO_BASE_URL) throw new HttpError(501, 'video_not_configured', 'Video visits are not set up yet. Your doctor will contact you at the scheduled time.');
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const a = await one<any>(`SELECT id, starts_at, type, status FROM appointments WHERE id=$1 AND senior_id=$2`, [parse(uuid, req.params.id), seniorId]);
  if (!a || a.status !== 'confirmed') throw notFound('Appointment not found');
  if (a.type !== 'video') throw new HttpError(409, 'not_video', 'This is not a video appointment');
  const mins = (a.startsAt.getTime() - Date.now()) / 60_000;
  if (mins > 15) throw new HttpError(409, 'too_early', `You can join 15 minutes before the appointment (in ${Math.ceil(mins - 15)} min).`);
  if (mins < -90) throw new HttpError(409, 'ended', 'This appointment time has passed.');
  const room = `eldercare-${createHmac('sha256', config.OTP_HMAC_SECRET).update(`room:${a.id}`).digest('base64url').slice(0, 24)}`;
  res.json({ url: `${config.VIDEO_BASE_URL.replace(/\/$/, '')}/${room}` });
}));

telehealthRouter.post('/appointments/:id/cancel', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const r = await query(`UPDATE appointments SET status='cancelled' WHERE id=$1 AND senior_id=$2 AND status='confirmed' RETURNING id`, [parse(uuid, req.params.id), seniorId]);
  if (!r.length) throw notFound('No cancellable appointment found');
  res.json({ ok: true });
}));
