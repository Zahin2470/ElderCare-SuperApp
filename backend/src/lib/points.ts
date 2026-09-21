import { one, query, Queryable, pool } from '../db.js';
import { localNow } from './time.js';

/** Actions a senior can earn points for. Awards happen server-side on real events — never on a client request. */
export const EARN_ACTIONS = {
  health_checkin:   { points: 25, title: 'Complete Health Check-in', description: 'Log your daily vitals in Care360' },
  medication_taken: { points: 10, title: 'Take Your Medication', description: 'Mark a scheduled dose as taken in SilverBox' },
  event_rsvp:       { points: 15, title: 'Join a Community Event', description: 'RSVP to an activity or class' },
} as const;
export type EarnKey = keyof typeof EARN_ACTIONS;

/** Once per action per day, enforced by a partial unique index (safe under concurrent requests). Returns points awarded. */
export async function awardDaily(userId: string, key: EarnKey, db: Queryable = pool): Promise<number> {
  const a = EARN_ACTIONS[key];
  const rows = await query(
    `INSERT INTO points_ledger (user_id, delta, reason, action_key, local_day) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (user_id, action_key, local_day) WHERE action_key IS NOT NULL AND delta > 0 DO NOTHING RETURNING id`,
    [userId, a.points, a.title, key, localNow().date], db);
  return rows.length ? a.points : 0;
}

export async function balance(userId: string, db: Queryable = pool): Promise<number> {
  const r = await one<{ b: number }>('SELECT COALESCE(SUM(delta),0)::int AS b FROM points_ledger WHERE user_id=$1', [userId], db);
  return r?.b ?? 0;
}
