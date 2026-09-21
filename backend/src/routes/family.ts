import { Router } from 'express';
import { z } from 'zod';
import { one, query } from '../db.js';
import { forbidden, notFound } from '../lib/errors.js';
import { parse, uuid } from '../lib/http.js';
import { normalizeBdPhone } from '../lib/phone.js';
import { auditFromReq } from '../lib/audit.js';
import { requireAuth, requireMember, wrap } from '../middleware/auth.js';

/** Linking is consent-based: a family member requests, the senior must accept before any data is visible. */
export const familyRouter = Router();
familyRouter.use(requireAuth, requireMember);

familyRouter.post('/invite', wrap(async (req, res) => {
  if (req.user!.role !== 'family') throw forbidden('Only family accounts can request a link');
  const { target, relation } = parse(z.object({ target: z.string().trim().min(3).max(254), relation: z.string().trim().max(40).optional() }), req.body);
  const phone = normalizeBdPhone(target);
  const senior = await one<any>(`SELECT id FROM users WHERE role='senior' AND status='active' AND ${phone ? 'phone=$1' : 'email=$1'}`, [phone ?? target.toLowerCase()]);
  if (senior) {
    await query(`INSERT INTO family_links (senior_id, family_id, relation, status) VALUES ($1,$2,$3,'pending')
                 ON CONFLICT (senior_id, family_id) DO UPDATE SET status = CASE WHEN family_links.status='accepted' THEN 'accepted' ELSE 'pending' END, relation = EXCLUDED.relation`, [senior.id, req.user!.id, relation ?? null]);
    await auditFromReq(req, 'family.invite', { subjectType: 'user', subjectId: senior.id });
  }
  res.status(202).json({ ok: true }); // same answer whether or not that person exists (no account enumeration)
}));

familyRouter.get('/requests', wrap(async (req, res) => {
  if (req.user!.role !== 'senior') return res.json({ requests: [] });
  res.json({ requests: await query(`SELECT u.id AS family_id, u.full_name, fl.relation, fl.created_at FROM family_links fl JOIN users u ON u.id=fl.family_id WHERE fl.senior_id=$1 AND fl.status='pending'`, [req.user!.id]) });
}));

for (const [action, status] of [['accept', 'accepted'], ['reject', 'revoked']] as const) {
  familyRouter.post(`/requests/:familyId/${action}`, wrap(async (req, res) => {
    if (req.user!.role !== 'senior') throw forbidden();
    const r = await query(`UPDATE family_links SET status=$3 WHERE senior_id=$1 AND family_id=$2 AND status='pending' RETURNING family_id`, [req.user!.id, parse(uuid, req.params.familyId), status]);
    if (!r.length) throw notFound();
    await auditFromReq(req, `family.${action}`, { subjectType: 'user', subjectId: req.params.familyId as string });
    res.json({ ok: true });
  }));
}

familyRouter.delete('/links/:otherId', wrap(async (req, res) => {
  const other = parse(uuid, req.params.otherId);
  await query(`UPDATE family_links SET status='revoked' WHERE (senior_id=$1 AND family_id=$2) OR (senior_id=$2 AND family_id=$1)`, [req.user!.id, other]); // either side can revoke
  await auditFromReq(req, 'family.revoke', { subjectType: 'user', subjectId: other });
  res.status(204).end();
}));
