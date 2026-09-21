import { Router, Response, Request } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { one, query, tx } from '../db.js';
import { conflict, forbidden, HttpError, tooMany, unauthorized } from '../lib/errors.js';
import { parse } from '../lib/http.js';
import { normalizeBdPhone, maskPhone } from '../lib/phone.js';
import { DUMMY_HASH, generateOtp, hashOtp, hashPassword, randomToken, safeEqual, sha256, signAccessToken, verifyPassword } from '../lib/security.js';
import { notifier, exposeDevOtp } from '../lib/notify.js';
import { audit } from '../lib/audit.js';
import { isAdminRole } from '../lib/permissions.js';
import { linkedSeniors, requireAuth, wrap } from '../middleware/auth.js';
import { randomUUID } from 'node:crypto';

export const authRouter = Router();

const OTP_TTL_MS = 5 * 60_000;
const OTP_MAX_ATTEMPTS = 3;
const OTP_RESEND_COOLDOWN_MS = 60_000;
const OTP_MAX_PER_HOUR = 5;
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60_000;
const REFRESH_GRACE_MS = 10_000; // tolerate two tabs refreshing at the same instant
export const REFRESH_COOKIE = 'ec_rt';

const limiter = (max: number, windowMs = 15 * 60_000) =>
  rateLimit({ windowMs, limit: max, standardHeaders: 'draft-7', legacyHeaders: false, skip: () => config.isTest,
    handler: (_req, _res, next) => next(tooMany()) });
const authLimiter = limiter(30);
const otpLimiter = limiter(10, 60 * 60_000);

// ───────── validation ─────────
const passwordRule = z.string().min(8).max(128)
  .refine((p) => /[a-z]/.test(p), 'must contain a lowercase letter')
  .refine((p) => /[A-Z]/.test(p), 'must contain an uppercase letter')
  .refine((p) => /[0-9]/.test(p), 'must contain a number')
  .refine((p) => /[^A-Za-z0-9]/.test(p), 'must contain a special character');

const phoneField = z.string().transform((v, ctx) => {
  const n = normalizeBdPhone(v);
  if (!n) ctx.addIssue({ code: 'custom', message: 'Enter a valid Bangladesh mobile number' });
  return n as string;
});
const emailField = z.string().trim().toLowerCase().email().max(254);
const targetField = z.string().trim().transform((v, ctx) => {
  if (v.includes('@')) { const r = emailField.safeParse(v); if (r.success) return r.data; }
  else { const p = normalizeBdPhone(v); if (p) return p; }
  ctx.addIssue({ code: 'custom', message: 'Enter a valid email or Bangladesh mobile number' });
  return z.NEVER;
});

// ───────── helpers ─────────
interface DbUser {
  id: string; fullName: string; email: string | null; phone: string | null; passwordHash: string; role: string; locale: 'en' | 'bn';
  status: string; phoneVerifiedAt: Date | null; emailVerifiedAt: Date | null; failedLogins: number; lockedUntil: Date | null;
}
export const publicUser = (u: DbUser) => ({
  id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, role: u.role, locale: u.locale,
  isVerified: Boolean(u.phoneVerifiedAt || u.emailVerifiedAt),
});
const findByTarget = (target: string) =>
  one<DbUser>(`SELECT * FROM users WHERE ${target.includes('@') ? 'email' : 'phone'} = $1`, [target]);

export const refreshTtlMs = (role: string) => (isAdminRole(role) ? 8 * 3600_000 : config.REFRESH_TOKEN_TTL_DAYS * 86_400_000);

function setRefreshCookie(res: Response, raw: string, ttlMs: number) {
  res.cookie(REFRESH_COOKIE, raw, { httpOnly: true, secure: config.isProd, sameSite: 'lax', path: '/api/auth', maxAge: ttlMs });
}

export async function issueSession(req: Request, res: Response, user: DbUser, familyId: string = randomUUID()) {
  const raw = randomToken();
  const ttl = refreshTtlMs(user.role);
  await query(
    `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at, user_agent, ip) VALUES ($1,$2,$3,$4,$5,$6)`,
    [user.id, familyId, sha256(raw), new Date(Date.now() + ttl), (req.headers['user-agent'] ?? '').slice(0, 300), req.ip]);
  setRefreshCookie(res, raw, ttl);
  await query('UPDATE users SET last_login_at = now(), failed_logins = 0, locked_until = NULL WHERE id = $1', [user.id]);
  return { user: publicUser(user), accessToken: signAccessToken({ sub: user.id, role: user.role }) };
}

/** Create + deliver an OTP, enforcing resend cooldown and an hourly cap per target. */
async function sendOtp(target: string, purpose: 'verify' | 'login' | 'reset_password'): Promise<string | undefined> {
  const recent = await query<{ createdAt: Date }>(
    `SELECT created_at FROM otp_codes WHERE target=$1 AND created_at > now() - interval '1 hour' ORDER BY created_at DESC`, [target]);
  if (recent.length >= OTP_MAX_PER_HOUR) throw tooMany('Too many codes requested. Try again in an hour.');
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) throw tooMany('Please wait a minute before requesting another code.');
  const code = generateOtp();
  await query(`INSERT INTO otp_codes (purpose, target, code_hash, expires_at) VALUES ($1,$2,$3,$4)`,
    [purpose, target, hashOtp(target, code), new Date(Date.now() + OTP_TTL_MS)]);
  await notifier.sendOtp(target, code, purpose);
  return exposeDevOtp ? code : undefined;
}

/** Verify the newest live code. 3 wrong guesses burn the code (a new one must be requested). */
async function consumeOtp(target: string, purpose: string, code: string): Promise<boolean> {
  return tx(async (c) => {
    const row = await one<{ id: string; codeHash: string; attempts: number }>(
      `SELECT id, code_hash, attempts FROM otp_codes
        WHERE target=$1 AND purpose=$2 AND consumed_at IS NULL AND expires_at > now()
        ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [target, purpose], c);
    if (!row) return false;
    if (row.attempts >= OTP_MAX_ATTEMPTS) return false;
    if (!safeEqual(row.codeHash, hashOtp(target, code))) {
      await query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id=$1', [row.id], c);
      return false;
    }
    await query('UPDATE otp_codes SET consumed_at = now() WHERE id=$1', [row.id], c);
    return true;
  });
}

// ───────── routes ─────────
authRouter.post('/register', authLimiter, wrap(async (req, res) => {
  const body = parse(z.object({
    fullName: z.string().trim().min(1).max(120),
    email: emailField.optional(),
    phone: phoneField.optional(),
    password: passwordRule,
    role: z.enum(['senior', 'family']).default('senior'), // admin roles can never be self-assigned
  }).refine((b) => b.email || b.phone, { message: 'Provide an email or a phone number' }), req.body);

  const dup = await one('SELECT 1 FROM users WHERE ($1::text IS NOT NULL AND email=$1) OR ($2::text IS NOT NULL AND phone=$2)', [body.email ?? null, body.phone ?? null]);
  if (dup) throw conflict('An account with these details already exists');

  const created = await one<DbUser>(
    `INSERT INTO users (full_name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [body.fullName, body.email ?? null, body.phone ?? null, await hashPassword(body.password), body.role]);
  const target = body.phone ?? body.email!;
  const devOtp = await sendOtp(target, 'verify');
  await audit({ actorId: created!.id, actorRole: created!.role, action: 'auth.register', subjectType: 'user', subjectId: created!.id, ip: req.ip });
  res.status(201).json({
    user: publicUser(created!),
    verification: { method: body.phone ? 'phone' : 'email', target, masked: body.phone ? maskPhone(body.phone) : body.email },
    ...(devOtp ? { devOtp } : {}),
  });
}));

authRouter.post('/request-otp', otpLimiter, wrap(async (req, res) => {
  const { target, purpose } = parse(z.object({ target: targetField, purpose: z.enum(['verify', 'login']) }), req.body);
  const user = await findByTarget(target);
  // Same response whether or not the account exists, so this can't be used to enumerate users.
  let devOtp: string | undefined;
  if (user && user.status === 'active' && !isAdminRole(user.role)) devOtp = await sendOtp(target, purpose);
  res.json({ sent: true, ...(devOtp ? { devOtp } : {}) });
}));

authRouter.post('/verify-otp', authLimiter, wrap(async (req, res) => {
  const { target, code, purpose } = parse(z.object({
    target: targetField, code: z.string().regex(/^\d{6}$/), purpose: z.enum(['verify', 'login']),
  }), req.body);
  const user = await findByTarget(target);
  const ok = user && user.status === 'active' && !isAdminRole(user.role) && (await consumeOtp(target, purpose, code));
  if (!ok || !user) throw new HttpError(400, 'invalid_code', 'That code is incorrect or has expired');
  // Possession of the code proves ownership of this contact point.
  await query(`UPDATE users SET ${target.includes('@') ? 'email_verified_at' : 'phone_verified_at'} = COALESCE(${target.includes('@') ? 'email_verified_at' : 'phone_verified_at'}, now()) WHERE id=$1`, [user.id]);
  const fresh = (await one<DbUser>('SELECT * FROM users WHERE id=$1', [user.id]))!;
  await audit({ actorId: user.id, actorRole: user.role, action: `auth.otp_${purpose}`, ip: req.ip });
  res.json(await issueSession(req, res, fresh));
}));

authRouter.post('/login', authLimiter, wrap(async (req, res) => {
  const { identifier, password } = parse(z.object({ identifier: targetField, password: z.string().min(1).max(128) }), req.body);
  const user = await findByTarget(identifier);
  const generic = () => new HttpError(401, 'invalid_credentials', 'Invalid email/phone or password');

  if (user?.lockedUntil && user.lockedUntil > new Date()) throw tooMany('Account temporarily locked after too many attempts. Try again in 15 minutes.');

  const ok = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, password);
  if (!user || !ok || user.status !== 'active' || isAdminRole(user.role)) {
    if (user && !ok) {
      const n = user.failedLogins + 1;
      await query('UPDATE users SET failed_logins=$2, locked_until=$3 WHERE id=$1', [user.id, n >= MAX_FAILED_LOGINS ? 0 : n, n >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MS) : null]);
      await audit({ actorId: user.id, action: 'auth.login_failed', ip: req.ip, metadata: { attempt: n } });
    }
    throw generic();
  }
  if (!user.phoneVerifiedAt && !user.emailVerifiedAt) {
    throw new HttpError(403, 'not_verified', 'Please verify your phone or email first', { target: user.phone ?? user.email });
  }
  await audit({ actorId: user.id, actorRole: user.role, action: 'auth.login', ip: req.ip });
  res.json(await issueSession(req, res, user));
}));

authRouter.post('/refresh', wrap(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !config.corsOrigins.includes(origin)) throw forbidden('Origin not allowed'); // CSRF guard for the cookie endpoint
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) throw unauthorized();
  const row = await one<{ id: string; userId: string; familyId: string; expiresAt: Date; revokedAt: Date | null; rotatedAt: Date | null }>(
    'SELECT id, user_id, family_id, expires_at, revoked_at, rotated_at FROM refresh_tokens WHERE token_hash=$1', [sha256(raw)]);
  if (!row) throw unauthorized();

  if (row.revokedAt) {
    // Revoked by logout / password reset / suspension / theft response: never usable again, no grace.
    if (!row.rotatedAt) throw unauthorized('Session ended. Please sign in again.');
    const alive = await one('SELECT 1 FROM refresh_tokens WHERE family_id=$1 AND revoked_at IS NULL AND expires_at > now()', [row.familyId]);
    const concurrent = Date.now() - row.rotatedAt.getTime() <= REFRESH_GRACE_MS && alive;   // two tabs refreshed at the same instant
    if (!concurrent) {
      // A rotated-out token is being replayed later → assume theft, kill the whole login session.
      await query('UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, now()) WHERE family_id=$1 AND revoked_at IS NULL', [row.familyId]);
      await audit({ actorId: row.userId, action: 'auth.refresh_reuse_detected', ip: req.ip });
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      throw unauthorized('Session invalidated. Please sign in again.');
    }
  }
  if (row.expiresAt < new Date()) throw unauthorized('Session expired');

  const user = await one<DbUser>('SELECT * FROM users WHERE id=$1', [row.userId]);
  if (!user || user.status !== 'active') throw unauthorized();
  if (!row.revokedAt) await query('UPDATE refresh_tokens SET revoked_at = now(), rotated_at = now() WHERE id=$1', [row.id]);
  res.json(await issueSession(req, res, user, row.familyId));
}));

authRouter.post('/logout', wrap(async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (raw) {
    const row = await one<{ familyId: string }>('SELECT family_id FROM refresh_tokens WHERE token_hash=$1', [sha256(raw)]);
    if (row) await query('UPDATE refresh_tokens SET revoked_at = now() WHERE family_id=$1 AND revoked_at IS NULL', [row.familyId]);
  }
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.status(204).end();
}));

authRouter.post('/forgot-password', otpLimiter, wrap(async (req, res) => {
  const { identifier } = parse(z.object({ identifier: targetField }), req.body);
  const user = await findByTarget(identifier);
  let devOtp: string | undefined;
  if (user && user.status === 'active' && !isAdminRole(user.role)) {
    try { devOtp = await sendOtp(identifier, 'reset_password'); } catch (e) { if (!(e instanceof HttpError)) throw e; }
  }
  res.json({ sent: true, ...(devOtp ? { devOtp } : {}) }); // identical response for unknown accounts
}));

authRouter.post('/reset-password', authLimiter, wrap(async (req, res) => {
  const { identifier, code, newPassword } = parse(z.object({ identifier: targetField, code: z.string().regex(/^\d{6}$/), newPassword: passwordRule }), req.body);
  const user = await findByTarget(identifier);
  const ok = user && !isAdminRole(user.role) && (await consumeOtp(identifier, 'reset_password', code));
  if (!ok || !user) throw new HttpError(400, 'invalid_code', 'That code is incorrect or has expired');
  await query('UPDATE users SET password_hash=$2, failed_logins=0, locked_until=NULL WHERE id=$1', [user.id, await hashPassword(newPassword)]);
  await query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id=$1 AND revoked_at IS NULL', [user.id]); // sign out everywhere
  await audit({ actorId: user.id, actorRole: user.role, action: 'auth.password_reset', ip: req.ip });
  res.json({ ok: true });
}));

authRouter.get('/me', requireAuth, wrap(async (req, res) => {
  const seniors = req.user!.role === 'family' ? await linkedSeniors(req.user!.id) : [];
  const { id, fullName, role, locale, email, phone, isVerified } = req.user!;
  res.json({ user: { id, fullName, role, locale, email, phone, isVerified }, linkedSeniors: seniors });
}));

authRouter.patch('/me', requireAuth, wrap(async (req, res) => {
  const b = parse(z.object({ locale: z.enum(['en', 'bn']).optional(), fullName: z.string().trim().min(1).max(120).optional() }), req.body);
  await query('UPDATE users SET locale = COALESCE($2, locale), full_name = COALESCE($3, full_name), updated_at = now() WHERE id=$1', [req.user!.id, b.locale ?? null, b.fullName ?? null]);
  res.json({ ok: true });
}));
