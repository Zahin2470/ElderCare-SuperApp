import { Router } from 'express';
import { z } from 'zod';
import { one, query } from '../db.js';
import { HttpError, notFound, tooMany, unauthorized } from '../lib/errors.js';
import { intParam, parse, uuid } from '../lib/http.js';
import { audit, auditFromReq } from '../lib/audit.js';
import { ADMIN_ROLES, hasPermission, isAdminRole, ROLE_PERMISSIONS } from '../lib/permissions.js';
import { DUMMY_HASH, signAdminChallenge, totpMatch, verifyAdminChallenge, verifyPassword } from '../lib/security.js';
import { requireAuth, requirePermission, wrap } from '../middleware/auth.js';
import { issueSession } from './auth.js';

export const adminRouter = Router();

// ───────── admin sign-in: password + TOTP (no admin session exists without both) ─────────
adminRouter.post('/auth/login', wrap(async (req, res) => {
  const { email, password } = parse(z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(128) }), req.body);
  const u = await one<any>('SELECT * FROM users WHERE email=$1', [email]);
  if (u?.lockedUntil && u.lockedUntil > new Date()) throw tooMany('Account temporarily locked. Try again later.');
  const ok = await verifyPassword(u?.passwordHash ?? DUMMY_HASH, password);
  if (!u || !ok || !isAdminRole(u.role) || u.status !== 'active') {
    if (u && !ok) {
      const n = u.failedLogins + 1;
      await query('UPDATE users SET failed_logins=$2, locked_until=$3 WHERE id=$1', [u.id, n >= 5 ? 0 : n, n >= 5 ? new Date(Date.now() + 15 * 60_000) : null]);
    }
    await audit({ actorId: u?.id, action: 'admin.login_failed', ip: req.ip, metadata: { email } });
    throw new HttpError(401, 'invalid_credentials', 'Invalid email or password');
  }
  if (!u.totpSecret) throw new HttpError(403, '2fa_not_enrolled', 'This admin account has no 2FA enrolled. Run `npm run totp -- <email>` on the server to enrol.');
  res.json({ challenge: signAdminChallenge(u.id) });
}));

adminRouter.post('/auth/verify-2fa', wrap(async (req, res) => {
  const { challenge, code } = parse(z.object({ challenge: z.string().min(10), code: z.string().regex(/^\d{6}$/) }), req.body);
  let userId: string;
  try { userId = verifyAdminChallenge(challenge); } catch { throw unauthorized('Sign-in expired. Start again.'); }
  const u = await one<any>('SELECT * FROM users WHERE id=$1', [userId]);
  if (!u || !u.totpSecret || u.status !== 'active' || !isAdminRole(u.role)) throw unauthorized();
  const step = totpMatch(u.totpSecret, code);
  // A code is valid once: a window number at or below the last accepted one is a replay.
  if (step == null || (u.totpLastStep != null && step <= Number(u.totpLastStep))) {
    await audit({ actorId: u.id, actorRole: u.role, action: 'admin.2fa_failed', ip: req.ip });
    throw new HttpError(401, 'invalid_code', 'Invalid or already-used code');
  }
  await query('UPDATE users SET totp_last_step=$2 WHERE id=$1', [u.id, step]);
  await audit({ actorId: u.id, actorRole: u.role, action: 'admin.login', ip: req.ip });
  res.json(await issueSession(req, res, u));
}));

// ───────── everything below needs a valid session AND the specific permission ─────────
adminRouter.use(requireAuth);

adminRouter.get('/roles', requirePermission('roles.read'), wrap(async (_req, res) => res.json({ roles: ROLE_PERMISSIONS })));

adminRouter.get('/stats', requirePermission('users.read'), wrap(async (_req, res) => {
  const [u] = await query<any>(`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE role='senior')::int AS seniors, count(*) FILTER (WHERE role='family')::int AS families,
      count(*) FILTER (WHERE status='suspended')::int AS suspended, count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS new_7d,
      count(*) FILTER (WHERE last_login_at > now() - interval '1 day')::int AS active_24h FROM users`);
  const [o] = await query<any>(`SELECT
      (SELECT count(*)::int FROM appointments WHERE status='confirmed' AND starts_at > now()) AS upcoming_appointments,
      (SELECT count(*)::int FROM caregiver_bookings WHERE status='pending') AS pending_caregiver_bookings,
      (SELECT count(*)::int FROM meal_orders WHERE status IN ('placed','preparing','out_for_delivery')) AS open_meal_orders,
      (SELECT count(*)::int FROM ai_messages WHERE role='user' AND created_at > now() - interval '1 day') AS ai_messages_24h,
      (SELECT count(*)::int FROM audit_logs WHERE action LIKE '%failed%' AND created_at > now() - interval '1 day') AS failed_auth_24h`);
  res.json({ users: u, operations: o }); // aggregates only — no personal health data here
}));

adminRouter.get('/users', requirePermission('users.read'), wrap(async (req, res) => {
  const q = parse(z.object({ q: z.string().max(80).optional(), role: z.string().max(30).optional(), status: z.enum(['active', 'suspended']).optional(), page: intParam(1, 10_000, 1) }), req.query);
  const size = 25;
  const where = `($1::text IS NULL OR full_name ILIKE '%'||$1||'%' OR email ILIKE '%'||$1||'%' OR phone LIKE '%'||$1||'%')
                 AND ($2::text IS NULL OR role=$2) AND ($3::text IS NULL OR status=$3)`;
  const args = [q.q ?? null, q.role ?? null, q.status ?? null];
  const rows = await query(`SELECT id, full_name, email, phone, role, status, (phone_verified_at IS NOT NULL OR email_verified_at IS NOT NULL) AS is_verified, last_login_at, created_at
      FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ${size} OFFSET ${(q.page - 1) * size}`, args);
  const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM users WHERE ${where}`, args))!.n;
  res.json({ users: rows, total, page: q.page, pageSize: size });
}));

adminRouter.get('/users/:id', requirePermission('users.read'), wrap(async (req, res) => {
  const u = await one(`SELECT id, full_name, email, phone, role, status, locale, (phone_verified_at IS NOT NULL OR email_verified_at IS NOT NULL) AS is_verified, last_login_at, created_at FROM users WHERE id=$1`, [parse(uuid, req.params.id)]);
  if (!u) throw notFound();
  await auditFromReq(req, 'admin.user_view', { subjectType: 'user', subjectId: req.params.id as string });
  res.json({ user: u });
}));

adminRouter.patch('/users/:id', wrap(async (req, res) => {
  const id = parse(uuid, req.params.id);
  const b = parse(z.object({ status: z.enum(['active', 'suspended']).optional(), role: z.enum(['senior', 'family', ...ADMIN_ROLES]).optional(), reason: z.string().trim().min(5).max(300) }), req.body);
  const actor = req.user!;
  if (id === actor.id) throw new HttpError(400, 'self_change', 'You cannot change your own status or role');
  const target = await one<any>('SELECT id, role, status FROM users WHERE id=$1', [id]);
  if (!target) throw notFound();

  if (b.status && b.status !== target.status) {
    if (!hasPermission(actor.role, 'users.write')) throw new HttpError(403, 'forbidden', 'Missing permission: users.write');
    await query('UPDATE users SET status=$2, updated_at=now() WHERE id=$1', [id, b.status]);
    if (b.status === 'suspended') await query('UPDATE refresh_tokens SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [id]); // kicks them out at the next refresh
    await auditFromReq(req, `admin.user_${b.status === 'suspended' ? 'suspend' : 'reactivate'}`, { subjectType: 'user', subjectId: id, metadata: { reason: b.reason } });
  }
  if (b.role && b.role !== target.role) {
    if (!hasPermission(actor.role, 'roles.write')) throw new HttpError(403, 'forbidden', 'Missing permission: roles.write');
    if ((isAdminRole(b.role) || isAdminRole(target.role)) && actor.role !== 'super_admin') throw new HttpError(403, 'forbidden', 'Only a super admin can grant or remove admin roles');
    if (isAdminRole(b.role)) throw new HttpError(400, 'needs_enrolment', 'Admin roles are granted with `npm run totp` on the server so 2FA is enrolled at the same time');
    await query('UPDATE users SET role=$2, updated_at=now() WHERE id=$1', [id, b.role]);
    await query('UPDATE refresh_tokens SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [id]);
    await auditFromReq(req, 'admin.role_change', { subjectType: 'user', subjectId: id, metadata: { from: target.role, to: b.role, reason: b.reason } });
  }
  res.json({ ok: true });
}));

adminRouter.get('/audit-logs', requirePermission('audit_logs.read'), wrap(async (req, res) => {
  const q = parse(z.object({ action: z.string().max(60).optional(), actorId: uuid.optional(), from: z.string().datetime().optional(), to: z.string().datetime().optional(), page: intParam(1, 10_000, 1) }), req.query);
  const size = 50;
  const where = `($1::text IS NULL OR a.action ILIKE $1||'%') AND ($2::uuid IS NULL OR a.actor_id=$2) AND ($3::timestamptz IS NULL OR a.created_at >= $3) AND ($4::timestamptz IS NULL OR a.created_at <= $4)`;
  const args = [q.action ?? null, q.actorId ?? null, q.from ?? null, q.to ?? null];
  const rows = await query(`SELECT a.id, a.action, a.actor_role, a.subject_type, a.subject_id, a.metadata, a.ip, a.created_at, u.full_name AS actor_name
      FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id WHERE ${where} ORDER BY a.id DESC LIMIT ${size} OFFSET ${(q.page - 1) * size}`, args);
  res.json({ logs: rows, page: q.page, pageSize: size });
}));

// The console's "view as user" banner is recorded here. This endpoint ONLY writes the audit trail:
// it does not issue a token for, or expose any data of, the target user.
adminRouter.post('/impersonation-events', requirePermission('impersonation'), wrap(async (req, res) => {
  const b = parse(z.object({ phase: z.enum(['start', 'end']), targetUserId: uuid, reason: z.string().trim().min(10).max(300).optional() })
    .refine((v) => v.phase === 'end' || v.reason, { message: 'A reason of at least 10 characters is required to start' }), req.body);
  if (!(await one('SELECT 1 FROM users WHERE id=$1', [b.targetUserId]))) throw notFound();
  await auditFromReq(req, `admin.impersonation_${b.phase}`, { subjectType: 'user', subjectId: b.targetUserId, metadata: { reason: b.reason } });
  res.status(201).json({ ok: true });
}));

