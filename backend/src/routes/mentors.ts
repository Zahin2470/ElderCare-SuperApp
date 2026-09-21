import { Router } from 'express';
import { z } from 'zod';
import { one, query } from '../db.js';
import { HttpError, notFound } from '../lib/errors.js';
import { parse, uuid } from '../lib/http.js';
import { localToUtc } from '../lib/time.js';
import { requireAuth, requireMember, wrap } from '../middleware/auth.js';

export const mentorsRouter = Router();
mentorsRouter.use(requireAuth, requireMember);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

mentorsRouter.get('/', wrap(async (req, res) => {
  const { q, expertise } = parse(z.object({ q: z.string().max(80).optional(), expertise: z.string().max(80).optional() }), req.query);
  res.json({ mentors: await query(`SELECT id, name, expertise, experience, skills, rate_bdt_hour, rating, reviews_count, verified, bio, availability FROM mentors WHERE active
      AND ($1::text IS NULL OR name ILIKE '%'||$1||'%' OR expertise ILIKE '%'||$1||'%' OR EXISTS (SELECT 1 FROM unnest(skills) s WHERE s ILIKE '%'||$1||'%'))
      AND ($2::text IS NULL OR expertise ILIKE '%'||$2||'%') ORDER BY verified DESC, rating DESC`, [q ?? null, expertise ?? null]) });
}));

mentorsRouter.get('/categories', wrap(async (_req, res) =>
  res.json({ categories: await query('SELECT expertise AS name, count(*)::int AS count FROM mentors WHERE active GROUP BY expertise ORDER BY count DESC, expertise') })));

mentorsRouter.get('/sessions', wrap(async (req, res) =>
  res.json({ sessions: await query(`SELECT s.id, s.topic, s.starts_at, s.duration_min, s.type, s.status, m.id AS mentor_id, m.name AS mentor_name
      FROM mentor_sessions s JOIN mentors m ON m.id=s.mentor_id WHERE s.user_id=$1 AND s.status <> 'cancelled' ORDER BY s.starts_at`, [req.user!.id]) })));

mentorsRouter.post('/sessions', wrap(async (req, res) => {
  const b = parse(z.object({ mentorId: uuid, topic: z.string().trim().min(2).max(200), date: z.string().date(), time: hhmm,
    durationMin: z.number().int().min(15).max(240).default(60), type: z.enum(['video', 'chat']).default('video') }), req.body);
  if (!(await one('SELECT 1 FROM mentors WHERE id=$1 AND active', [b.mentorId]))) throw notFound('Mentor not found');
  const at = localToUtc(b.date, b.time);
  if (at.getTime() <= Date.now()) throw new HttpError(400, 'in_the_past', 'Please choose a future time');
  const clash = await one(`SELECT 1 FROM mentor_sessions WHERE mentor_id=$1 AND status='confirmed' AND starts_at < $3 AND starts_at + (duration_min || ' minutes')::interval > $2`,
    [b.mentorId, at, new Date(at.getTime() + b.durationMin * 60_000)]);
  if (clash) throw new HttpError(409, 'unavailable', 'The mentor is not available at that time');
  res.status(201).json({ session: await one(`INSERT INTO mentor_sessions (user_id, mentor_id, topic, starts_at, duration_min, type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, starts_at, duration_min, type, status`,
    [req.user!.id, b.mentorId, b.topic, at, b.durationMin, b.type]) });
}));

mentorsRouter.patch('/sessions/:id', wrap(async (req, res) => {
  const b = parse(z.object({ date: z.string().date(), time: hhmm }), req.body);
  const at = localToUtc(b.date, b.time);
  if (at.getTime() <= Date.now()) throw new HttpError(400, 'in_the_past', 'Please choose a future time');
  const r = await query(`UPDATE mentor_sessions SET starts_at=$3 WHERE id=$1 AND user_id=$2 AND status='confirmed' RETURNING id, starts_at`, [parse(uuid, req.params.id), req.user!.id, at]);
  if (!r.length) throw notFound('No reschedulable session found');
  res.json({ session: r[0] });
}));

mentorsRouter.post('/sessions/:id/cancel', wrap(async (req, res) => {
  const r = await query(`UPDATE mentor_sessions SET status='cancelled' WHERE id=$1 AND user_id=$2 AND status='confirmed' RETURNING id`, [parse(uuid, req.params.id), req.user!.id]);
  if (!r.length) throw notFound();
  res.json({ ok: true });
}));
