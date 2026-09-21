import { Router } from 'express';
import { z } from 'zod';
import { one, query, tx } from '../db.js';
import { HttpError, forbidden, notFound } from '../lib/errors.js';
import { parse, uuid } from '../lib/http.js';
import { awardDaily } from '../lib/points.js';
import { requireAuth, requireMember, wrap } from '../middleware/auth.js';

export const communityRouter = Router();
communityRouter.use(requireAuth, requireMember);

const EVENT_SELECT = `SELECT e.id, e.title, e.description, e.category, e.starts_at, e.ends_at, e.location, e.mode, e.capacity,
    (SELECT count(*)::int FROM event_rsvps r WHERE r.event_id=e.id) AS attendees,
    EXISTS (SELECT 1 FROM event_rsvps r WHERE r.event_id=e.id AND r.user_id=$1) AS registered
  FROM events e`;

communityRouter.get('/events', wrap(async (req, res) => {
  const { category, mode } = parse(z.object({ category: z.string().max(40).optional(), mode: z.enum(['in-person', 'virtual']).optional() }), req.query);
  res.json({ events: await query(`${EVENT_SELECT} WHERE e.active AND e.ends_at > now() AND ($2::text IS NULL OR e.category=$2) AND ($3::text IS NULL OR e.mode=$3) ORDER BY e.starts_at LIMIT 100`, [req.user!.id, category ?? null, mode ?? null]) });
}));

communityRouter.get('/events/mine', wrap(async (req, res) =>
  res.json({ events: await query(`${EVENT_SELECT} JOIN event_rsvps mine ON mine.event_id=e.id AND mine.user_id=$1 WHERE e.ends_at > now() ORDER BY e.starts_at`, [req.user!.id]) })));

communityRouter.post('/events/:id/rsvp', wrap(async (req, res) => {
  const id = parse(uuid, req.params.id);
  const out = await tx(async (c) => {
    const ev = await one<any>('SELECT id, capacity FROM events WHERE id=$1 AND active AND ends_at > now() FOR UPDATE', [id], c); // row lock serialises capacity checks
    if (!ev) throw notFound('Event not found');
    const already = await one('SELECT 1 FROM event_rsvps WHERE event_id=$1 AND user_id=$2', [id, req.user!.id], c);
    if (already) return { alreadyRegistered: true, pointsAwarded: 0 };
    const { n } = (await one<{ n: number }>('SELECT count(*)::int AS n FROM event_rsvps WHERE event_id=$1', [id], c))!;
    if (n >= ev.capacity) throw new HttpError(409, 'full', 'This event is full');
    await query('INSERT INTO event_rsvps (event_id, user_id) VALUES ($1,$2)', [id, req.user!.id], c);
    return { alreadyRegistered: false, pointsAwarded: await awardDaily(req.user!.id, 'event_rsvp', c) };
  });
  res.status(out.alreadyRegistered ? 200 : 201).json(out);
}));

communityRouter.delete('/events/:id/rsvp', wrap(async (req, res) => {
  await query('DELETE FROM event_rsvps WHERE event_id=$1 AND user_id=$2', [parse(uuid, req.params.id), req.user!.id]);
  res.status(204).end();
}));

// ───────── group chat (persisted; clients poll — swap for WebSockets when needed) ─────────
communityRouter.get('/groups', wrap(async (req, res) => {
  res.json({ groups: await query(`
    SELECT g.id, g.name,
      (SELECT count(*)::int FROM chat_group_members m WHERE m.group_id=g.id) AS members,
      (SELECT body FROM chat_messages x WHERE x.group_id=g.id ORDER BY id DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM chat_messages x WHERE x.group_id=g.id ORDER BY id DESC LIMIT 1) AS last_message_at,
      (SELECT count(*)::int FROM chat_messages x WHERE x.group_id=g.id AND x.created_at > me.last_read_at AND x.user_id <> $1) AS unread,
      (me.user_id IS NOT NULL) AS joined
    FROM chat_groups g LEFT JOIN chat_group_members me ON me.group_id=g.id AND me.user_id=$1 ORDER BY last_message_at DESC NULLS LAST`, [req.user!.id]) });
}));

communityRouter.post('/groups/:id/join', wrap(async (req, res) => {
  const id = parse(uuid, req.params.id);
  if (!(await one('SELECT 1 FROM chat_groups WHERE id=$1', [id]))) throw notFound();
  await query('INSERT INTO chat_group_members (group_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, req.user!.id]);
  res.status(204).end();
}));

const isMember = (groupId: string, userId: string) => one('SELECT 1 FROM chat_group_members WHERE group_id=$1 AND user_id=$2', [groupId, userId]);

communityRouter.get('/groups/:id/messages', wrap(async (req, res) => {
  const id = parse(uuid, req.params.id);
  if (!(await isMember(id, req.user!.id))) throw forbidden('Join this group to read messages');
  const after = parse(z.coerce.number().int().min(0).default(0), req.query.after ?? 0);
  const rows = await query(`SELECT m.id, m.body, m.created_at, u.full_name AS author, (m.user_id=$3) AS mine FROM chat_messages m JOIN users u ON u.id=m.user_id
      WHERE m.group_id=$1 AND m.id > $2 ORDER BY m.id DESC LIMIT 100`, [id, after, req.user!.id]);
  await query('UPDATE chat_group_members SET last_read_at=now() WHERE group_id=$1 AND user_id=$2', [id, req.user!.id]);
  res.json({ messages: rows.reverse() });
}));

communityRouter.post('/groups/:id/messages', wrap(async (req, res) => {
  const id = parse(uuid, req.params.id);
  if (!(await isMember(id, req.user!.id))) throw forbidden('Join this group to post');
  const { body } = parse(z.object({ body: z.string().trim().min(1).max(2000) }), req.body);
  res.status(201).json({ message: await one('INSERT INTO chat_messages (group_id, user_id, body) VALUES ($1,$2,$3) RETURNING id, body, created_at', [id, req.user!.id, body]) });
}));
