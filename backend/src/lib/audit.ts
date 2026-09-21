import type { Request } from 'express';
import { query, Queryable, pool } from '../db.js';

interface AuditInput {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  subjectType?: string;
  subjectId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

/** Append to the audit trail. Never put secrets, OTPs or raw tokens in `metadata`. */
export async function audit(a: AuditInput, db: Queryable = pool) {
  await query(
    `INSERT INTO audit_logs (actor_id, actor_role, action, subject_type, subject_id, metadata, ip)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [a.actorId ?? null, a.actorRole ?? null, a.action, a.subjectType ?? null, a.subjectId ?? null, JSON.stringify(a.metadata ?? {}), a.ip ?? null],
    db,
  );
}

export const auditFromReq = (req: Request, action: string, extra: Omit<AuditInput, 'action' | 'actorId' | 'actorRole' | 'ip'> = {}) =>
  audit({ actorId: req.user?.id, actorRole: req.user?.role, action, ip: req.ip, ...extra });
