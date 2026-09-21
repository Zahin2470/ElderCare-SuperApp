import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { one, query, tx } from '../db.js';
import { HttpError, notFound } from '../lib/errors.js';
import { parse, uuid } from '../lib/http.js';
import { balance, EARN_ACTIONS } from '../lib/points.js';
import { localNow } from '../lib/time.js';
import { requireAuth, requireMember, wrap } from '../middleware/auth.js';

export const rewardsRouter = Router();
rewardsRouter.use(requireAuth, requireMember);

rewardsRouter.get('/summary', wrap(async (req, res) => {
  const uid = req.user!.id;
  const earnedToday = new Set((await query<{ actionKey: string }>('SELECT action_key FROM points_ledger WHERE user_id=$1 AND local_day=$2 AND delta>0 AND action_key IS NOT NULL', [uid, localNow().date])).map((r) => r.actionKey));
  res.json({
    balance: await balance(uid),
    lifetimeEarned: (await one<{ n: number }>('SELECT COALESCE(SUM(delta),0)::int AS n FROM points_ledger WHERE user_id=$1 AND delta>0', [uid]))!.n,
    recentActivity: await query('SELECT id, delta, reason, created_at FROM points_ledger WHERE user_id=$1 ORDER BY id DESC LIMIT 15', [uid]),
    earnActions: Object.entries(EARN_ACTIONS).map(([key, a]) => ({ key, ...a, available: !earnedToday.has(key) })),
    rewards: await query('SELECT id, title, description, cost, category FROM rewards WHERE active ORDER BY cost'),
  });
}));

rewardsRouter.post('/redeem', wrap(async (req, res) => {
  const { rewardId } = parse(z.object({ rewardId: uuid }), req.body);
  const out = await tx(async (c) => {
    // Serialise this user's redemptions: without the row lock, two parallel requests could both see
    // enough balance and spend the same points twice.
    await query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [req.user!.id], c);
    const reward = await one<any>('SELECT id, title, cost FROM rewards WHERE id=$1 AND active', [rewardId], c);
    if (!reward) throw notFound('Reward not found');
    const bal = await balance(req.user!.id, c);
    if (bal < reward.cost) throw new HttpError(402, 'insufficient_points', `You need ${reward.cost - bal} more points for this reward`);
    await query(`INSERT INTO points_ledger (user_id, delta, reason) VALUES ($1,$2,$3)`, [req.user!.id, -reward.cost, `Redeemed: ${reward.title}`], c);
    const code = `EC-${randomBytes(4).toString('hex').toUpperCase()}`;
    await query('INSERT INTO reward_redemptions (user_id, reward_id, cost, code) VALUES ($1,$2,$3,$4)', [req.user!.id, reward.id, reward.cost, code], c);
    return { code, balance: bal - reward.cost, title: reward.title };
  });
  res.status(201).json(out);
}));
