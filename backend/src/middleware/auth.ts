import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { one, query } from '../db.js';
import { forbidden, notFound, unauthorized } from '../lib/errors.js';
import { hasPermission, isAdminRole } from '../lib/permissions.js';
import { verifyAccessToken } from '../lib/security.js';

export interface AuthUser {
  id: string;
  fullName: string;
  role: string;
  locale: 'en' | 'bn';
  email: string | null;
  phone: string | null;
  isVerified: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized();
  let claims;
  try { claims = verifyAccessToken(header.slice(7)); } catch { throw unauthorized('Session expired'); }

  // Loaded fresh on every request so suspensions and role changes apply immediately (no stale claims).
  const u = await one<any>(
    `SELECT id, full_name, role, locale, email, phone, status, (phone_verified_at IS NOT NULL OR email_verified_at IS NOT NULL) AS is_verified
       FROM users WHERE id = $1`, [claims.sub]);
  if (!u || u.status !== 'active') throw unauthorized('Account unavailable');
  req.user = { id: u.id, fullName: u.fullName, role: u.role, locale: u.locale, email: u.email, phone: u.phone, isVerified: u.isVerified };
  next();
};

export const requirePermission = (perm: string): RequestHandler => (req, _res, next) => {
  if (!req.user || !hasPermission(req.user.role, perm)) throw forbidden(`Missing permission: ${perm}`);
  next();
};

/** Personal-data routes are for seniors and their linked family only; admins use /api/admin/*. */
export const requireMember: RequestHandler = (req, _res, next) => {
  if (!req.user || isAdminRole(req.user.role)) throw forbidden('Use the admin console for this account type');
  next();
};

/**
 * Which senior's data is this request about?
 *  - senior → always themselves (a client-supplied id is ignored, so guessing ids gets nothing)
 *  - family → the requested senior, only if an accepted link exists; defaults to their first linked senior
 * This is the single choke-point that prevents cross-user data access (IDOR).
 */
export async function resolveSubject(req: Request, requested?: string | null): Promise<string> {
  const u = req.user!;
  if (u.role === 'senior') return u.id;
  if (u.role !== 'family') throw forbidden();
  if (requested) {
    const link = await one(`SELECT 1 FROM family_links WHERE family_id=$1 AND senior_id=$2 AND status='accepted'`, [u.id, requested]);
    if (!link) throw forbidden('You are not linked to this person');
    return requested;
  }
  const first = await one<{ seniorId: string }>(
    `SELECT senior_id FROM family_links WHERE family_id=$1 AND status='accepted' ORDER BY created_at LIMIT 1`, [u.id]);
  if (!first) throw notFound('No linked senior yet');
  return first.seniorId;
}

export const linkedSeniors = (familyId: string) =>
  query<{ id: string; fullName: string; relation: string | null }>(
    `SELECT u.id, u.full_name, fl.relation FROM family_links fl JOIN users u ON u.id = fl.senior_id
      WHERE fl.family_id=$1 AND fl.status='accepted' ORDER BY fl.created_at`, [familyId]);

export const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { fn(req, res, next).catch(next); };
