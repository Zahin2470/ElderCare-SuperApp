import { Router } from 'express';
import { z } from 'zod';
import { one, query, tx } from '../db.js';
import { HttpError, notFound } from '../lib/errors.js';
import { parse, uuid } from '../lib/http.js';
import { localNow, localToUtc } from '../lib/time.js';
import { requireAuth, requireMember, resolveSubject, wrap } from '../middleware/auth.js';

export const nutritionRouter = Router();
nutritionRouter.use(requireAuth, requireMember);
const subjectQ = z.object({ seniorId: uuid.optional() });
const DAILY_CALORIE_TARGET = 1800;

nutritionRouter.get('/plans', wrap(async (_req, res) =>
  res.json({ plans: await query('SELECT id, name, dietitian, tags, meals, price_per_day_bdt, rating FROM meal_plans WHERE active ORDER BY rating DESC') })));

nutritionRouter.get('/menu', wrap(async (req, res) => {
  const type = parse(z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack']).optional(), req.query.type);
  res.json({ items: await query('SELECT id, name, meal_type, calories, protein_g, tags, price_bdt FROM menu_items WHERE active AND ($1::text IS NULL OR meal_type=$1) ORDER BY meal_type, name', [type ?? null]) });
}));

nutritionRouter.get('/orders', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const rows = await query<any>(`SELECT o.id, o.items, o.total_bdt, o.delivery_at, o.address, o.status, o.rating, o.feedback, o.created_at, p.name AS plan_name
      FROM meal_orders o LEFT JOIN meal_plans p ON p.id=o.plan_id WHERE o.senior_id=$1 ORDER BY o.created_at DESC LIMIT 50`, [seniorId]);
  res.json({ active: rows.filter((o) => ['placed', 'preparing', 'out_for_delivery'].includes(o.status)), history: rows.filter((o) => ['delivered', 'cancelled'].includes(o.status)) });
}));

nutritionRouter.get('/stats', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const day = localNow().date;
  const rows = await query<any>(`SELECT items FROM meal_orders WHERE senior_id=$1 AND status <> 'cancelled' AND delivery_at >= $2 AND delivery_at < $2 + interval '1 day'`, [seniorId, localToUtc(day, '00:00')]);
  let calories = 0, protein = 0;
  const ids = rows.flatMap((r) => (r.items as any[]).map((i) => [i.menuItemId, i.qty] as const));
  if (ids.length) {
    const m = await query<any>('SELECT id, calories, protein_g FROM menu_items WHERE id = ANY($1::uuid[])', [ids.map(([i]) => i)]);
    const by = new Map(m.map((x) => [x.id, x]));
    for (const [id, qty] of ids) { const it = by.get(id); if (it) { calories += (it.calories ?? 0) * qty; protein += (it.proteinG ?? 0) * qty; } }
  }
  res.json({ calories, calorieTarget: DAILY_CALORIE_TARGET, proteinG: protein });
}));

nutritionRouter.post('/orders', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const b = parse(z.object({
    planId: uuid.optional(),
    items: z.array(z.object({ menuItemId: uuid, qty: z.number().int().min(1).max(10) })).max(20).default([]),
    date: z.string().date().optional(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), address: z.string().trim().min(5).max(300),
  }).refine((o) => o.planId || o.items.length, { message: 'Choose a plan or at least one menu item' }), req.body);

  const order = await tx(async (c) => {
    let total = 0; const snapshot: any[] = [];
    if (b.items.length) {
      const menu = await query<any>('SELECT id, name, price_bdt FROM menu_items WHERE id = ANY($1::uuid[]) AND active', [b.items.map((i) => i.menuItemId)], c);
      const by = new Map(menu.map((m) => [m.id, m]));
      for (const it of b.items) {
        const m = by.get(it.menuItemId); if (!m) throw notFound('A menu item is no longer available');
        total += m.priceBdt * it.qty; snapshot.push({ menuItemId: m.id, name: m.name, qty: it.qty, priceBdt: m.priceBdt });
      }
    }
    if (b.planId) {
      const p = await one<any>('SELECT id, price_per_day_bdt FROM meal_plans WHERE id=$1 AND active', [b.planId], c);
      if (!p) throw notFound('Meal plan not found');
      total += p.pricePerDayBdt;
    }
    const at = localToUtc(b.date ?? localNow().date, b.time ?? '18:00');
    return one(`INSERT INTO meal_orders (senior_id, plan_id, items, total_bdt, delivery_at, address) VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id, total_bdt, delivery_at, status`, [seniorId, b.planId ?? null, JSON.stringify(snapshot), total, at, b.address], c);
  });
  res.status(201).json({ order });
}));

nutritionRouter.post('/orders/:id/rate', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const b = parse(z.object({ rating: z.number().int().min(1).max(5), feedback: z.string().trim().max(500).optional() }), req.body);
  const r = await query(`UPDATE meal_orders SET rating=$3, feedback=$4 WHERE id=$1 AND senior_id=$2 AND status='delivered' RETURNING id`, [parse(uuid, req.params.id), seniorId, b.rating, b.feedback ?? null]);
  if (!r.length) throw new HttpError(409, 'not_rateable', 'Only delivered orders can be rated');
  res.json({ ok: true });
}));

nutritionRouter.post('/orders/:id/cancel', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(subjectQ, req.query).seniorId);
  const r = await query(`UPDATE meal_orders SET status='cancelled' WHERE id=$1 AND senior_id=$2 AND status='placed' RETURNING id`, [parse(uuid, req.params.id), seniorId]);
  if (!r.length) throw new HttpError(409, 'not_cancellable', 'This order is already being prepared and can no longer be cancelled');
  res.json({ ok: true });
}));
