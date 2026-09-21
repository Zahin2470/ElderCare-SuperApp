import { Router } from 'express';
import { z } from 'zod';
import { one, query, tx } from '../db.js';
import { notFound } from '../lib/errors.js';
import { intParam, parse, uuid } from '../lib/http.js';
import { adherence, doseHistory, todaysDoses } from '../lib/adherence.js';
import { awardDaily } from '../lib/points.js';
import { localNow } from '../lib/time.js';
import { requireAuth, requireMember, resolveSubject, wrap } from '../middleware/auth.js';

export const medicationsRouter = Router();
medicationsRouter.use(requireAuth, requireMember);

const subjectQ = z.object({ seniorId: uuid.optional() });
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:MM');
const medBody = z.object({
  name: z.string().trim().min(1).max(120), dosage: z.string().trim().min(1).max(60), purpose: z.string().trim().max(120).optional(),
  scheduleTimes: z.array(hhmm).min(1).max(8), reminder: z.boolean().default(true),
  stockRemaining: z.number().int().min(0).default(0), stockTotal: z.number().int().min(0).default(0), refillDate: z.string().date().optional(),
});

const stockStatus = (r: number, t: number) => (t === 0 ? 'good' : r / t <= 0.1 ? 'critical' : r / t <= 0.3 ? 'low' : 'good');

medicationsRouter.get('/', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const rows = await query<any>(`SELECT id, name, dosage, purpose, schedule_times, reminder, stock_remaining, stock_total, refill_date FROM medications WHERE senior_id=$1 AND active ORDER BY name`, [seniorId]);
  res.json({ medications: rows.map((m) => ({ ...m, stockStatus: stockStatus(m.stockRemaining, m.stockTotal) })) });
}));

medicationsRouter.post('/', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const b = parse(medBody, req.body);
  const m = await one(`INSERT INTO medications (senior_id,name,dosage,purpose,schedule_times,reminder,stock_remaining,stock_total,refill_date)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, name, dosage, purpose, schedule_times, reminder, stock_remaining, stock_total, refill_date`,
    [seniorId, b.name, b.dosage, b.purpose ?? null, [...new Set(b.scheduleTimes)].sort(), b.reminder, b.stockRemaining, b.stockTotal, b.refillDate ?? null]);
  res.status(201).json({ medication: m });
}));

medicationsRouter.delete('/:id', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const r = await query('UPDATE medications SET active=false WHERE id=$1 AND senior_id=$2 AND active RETURNING id', [parse(uuid, req.params.id), seniorId]);
  if (!r.length) throw notFound();
  res.status(204).end();
}));

medicationsRouter.get('/today', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  res.json({ doses: await todaysDoses(seniorId) });
}));

medicationsRouter.get('/adherence', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  res.json(await adherence(seniorId));
}));

medicationsRouter.get('/history', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  res.json({ history: await doseHistory(seniorId, parse(intParam(1, 90, 14), req.query.days)) });
}));

// Mark a dose taken / skipped. Idempotent: repeating the request changes nothing (and never double-counts stock or points).
const doseBody = z.object({ time: hhmm });
for (const action of ['take', 'skip'] as const) {
  medicationsRouter.post(`/:id/${action}`, wrap(async (req, res) => {
    const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
    const id = parse(uuid, req.params.id);
    const { time } = parse(doseBody, req.body);
    const now = localNow();

    const result = await tx(async (c) => {
      const med = await one<any>('SELECT id, schedule_times FROM medications WHERE id=$1 AND senior_id=$2 AND active FOR UPDATE', [id, seniorId], c);
      if (!med) throw notFound('Medication not found');
      if (!med.scheduleTimes.includes(time)) throw notFound('That dose time is not on this medication\'s schedule');
      const ins = await query(
        `INSERT INTO medication_logs (medication_id, senior_id, scheduled_date, scheduled_time, status, taken_at, logged_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (medication_id, scheduled_date, scheduled_time) DO NOTHING RETURNING id`,
        [id, seniorId, now.date, time, action === 'take' ? 'taken' : 'skipped', action === 'take' ? new Date() : null, req.user!.id], c);
      let points = 0;
      if (ins.length && action === 'take') {
        await query('UPDATE medications SET stock_remaining = GREATEST(stock_remaining - 1, 0) WHERE id=$1', [id], c);
        points = await awardDaily(seniorId, 'medication_taken', c);
      }
      return { alreadyLogged: !ins.length, pointsAwarded: points };
    });
    res.json({ ok: true, ...result });
  }));
}
