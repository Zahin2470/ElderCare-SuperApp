import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { one, query } from '../db.js';
import { HttpError, notFound } from '../lib/errors.js';
import { intParam, parse, uuid } from '../lib/http.js';
import { classify, MetricKind } from '../lib/health.js';
import { KINDS, latestMetrics } from '../lib/metrics.js';
import { awardDaily } from '../lib/points.js';
import { auditFromReq } from '../lib/audit.js';
import { requireAuth, requireMember, resolveSubject, wrap } from '../middleware/auth.js';

export const healthRouter = Router();
healthRouter.use(requireAuth, requireMember);
const subjectQ = z.object({ seniorId: uuid.optional() });
const subject = async (req: any) => resolveSubject(req, parse(subjectQ, req.query).seniorId);

// ───────── vitals ─────────
healthRouter.get('/metrics', wrap(async (req, res) => res.json({ metrics: await latestMetrics(await subject(req)) })));

healthRouter.get('/metrics/history', wrap(async (req, res) => {
  const seniorId = await subject(req);
  const kind = parse(z.enum(KINDS), req.query.kind);
  const days = parse(intParam(1, 365, 30), req.query.days);
  res.json({ points: await query(`SELECT value1, value2, recorded_at FROM health_metrics WHERE senior_id=$1 AND kind=$2 AND recorded_at > now() - ($3 || ' days')::interval ORDER BY recorded_at`, [seniorId, kind, String(days)]) });
}));

healthRouter.post('/metrics', wrap(async (req, res) => {
  const seniorId = await subject(req);
  const b = parse(z.object({
    kind: z.enum(KINDS),
    value1: z.number().positive().max(1000), value2: z.number().positive().max(1000).optional(),
  }).superRefine((v, ctx) => {
    if (v.kind === 'blood_pressure' && v.value2 == null) ctx.addIssue({ code: 'custom', message: 'Blood pressure needs systolic and diastolic values', path: ['value2'] });
    if (v.kind === 'blood_pressure' && v.value2 != null && v.value2 >= v.value1) ctx.addIssue({ code: 'custom', message: 'Systolic must be higher than diastolic', path: ['value1'] });
  }), req.body);
  await query('INSERT INTO health_metrics (senior_id, kind, value1, value2, recorded_by) VALUES ($1,$2,$3,$4,$5)', [seniorId, b.kind, b.value1, b.value2 ?? null, req.user!.id]);
  const pointsAwarded = await awardDaily(seniorId, 'health_checkin');
  res.status(201).json({ status: classify(b.kind as MetricKind, b.value1, b.value2), pointsAwarded });
}));

// ───────── records (upload / download / share) ─────────
const ALLOWED_MIME: Record<string, string> = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' };
const storageDir = path.resolve(config.STORAGE_DIR);
fs.mkdirSync(storageDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: storageDir,
    // The on-disk name is generated; a user-supplied filename never touches the filesystem path.
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${ALLOWED_MIME[file.mimetype] ?? '.bin'}`),
  }),
  limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => (ALLOWED_MIME[file.mimetype] ? cb(null, true) : cb(new HttpError(415, 'unsupported_type', 'Only PDF, JPEG and PNG files are accepted'))),
});

const RECORD_COLS = 'id, type, title, category, provider, record_date, status, file_name, file_mime, file_size, (file_key IS NOT NULL) AS has_file, created_at';

healthRouter.get('/records', wrap(async (req, res) => {
  const seniorId = await subject(req);
  res.json({ records: await query(`SELECT ${RECORD_COLS} FROM health_records WHERE senior_id=$1 ORDER BY record_date DESC, created_at DESC`, [seniorId]) });
}));

/** The declared Content-Type is attacker-controlled; check the file's real signature too. */
const SIGNATURES: Record<string, number[]> = { 'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d], 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] };
export function matchesSignature(filePath: string, mime: string): boolean {
  const sig = SIGNATURES[mime]; if (!sig) return false;
  const fd = fs.openSync(filePath, 'r');
  try { const buf = Buffer.alloc(sig.length); fs.readSync(fd, buf, 0, sig.length, 0); return sig.every((b, i) => buf[i] === b); } finally { fs.closeSync(fd); }
}

healthRouter.post('/records', upload.single('file'), wrap(async (req, res) => {
  const f = req.file;
  try {
    const seniorId = await subject(req);
    const b = parse(z.object({
      title: z.string().trim().min(1).max(200), type: z.string().trim().min(1).max(60).default('Document'),
      category: z.string().trim().max(60).default('General'), provider: z.string().trim().max(200).optional(), recordDate: z.string().date().optional(),
    }), req.body);
    if (f && !matchesSignature(f.path, f.mimetype)) throw new HttpError(415, 'unsupported_type', 'The file content does not match its type. Only real PDF, JPEG and PNG files are accepted.');
    const rec = await one(`INSERT INTO health_records (senior_id,type,title,category,provider,record_date,file_key,file_name,file_mime,file_size)
      VALUES ($1,$2,$3,$4,$5,COALESCE($6::date, current_date),$7,$8,$9,$10) RETURNING ${RECORD_COLS}`,
      [seniorId, b.type, b.title, b.category, b.provider ?? null, b.recordDate ?? null, f?.filename ?? null, f ? path.basename(f.originalname).slice(0, 200) : null, f?.mimetype ?? null, f?.size ?? null]);
    await auditFromReq(req, 'record.upload', { subjectType: 'health_record', subjectId: (rec as any).id, metadata: { seniorId } });
    res.status(201).json({ record: rec });
  } catch (e) {
    if (f) fs.promises.unlink(f.path).catch(() => undefined);   // never leave an orphaned upload on disk
    throw e;
  }
}));

healthRouter.get('/records/:id/file', wrap(async (req, res) => {
  const seniorId = await subject(req);
  const r = await one<any>('SELECT file_key, file_name, file_mime FROM health_records WHERE id=$1 AND senior_id=$2', [parse(uuid, req.params.id), seniorId]);
  if (!r?.fileKey) throw notFound('No file attached');
  await auditFromReq(req, 'record.download', { subjectType: 'health_record', subjectId: req.params.id as string });
  res.setHeader('Content-Type', r.fileMime);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(r.fileName ?? 'record')}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(path.join(storageDir, path.basename(r.fileKey))); // basename() = defence in depth against path traversal
}));

healthRouter.post('/records/:id/share', wrap(async (req, res) => {
  const seniorId = await subject(req);
  const b = parse(z.object({ doctorId: uuid, days: z.number().int().min(1).max(90).default(7) }), req.body);
  const rec = await one('SELECT 1 FROM health_records WHERE id=$1 AND senior_id=$2', [parse(uuid, req.params.id), seniorId]);
  const doc = await one('SELECT 1 FROM doctors WHERE id=$1 AND active', [b.doctorId]);
  if (!rec || !doc) throw notFound();
  const s = await one<any>(`INSERT INTO record_shares (record_id, doctor_id, senior_id, expires_at) VALUES ($1,$2,$3, now() + ($4 || ' days')::interval) RETURNING id, expires_at`, [req.params.id, b.doctorId, seniorId, String(b.days)]);
  await auditFromReq(req, 'record.share', { subjectType: 'health_record', subjectId: req.params.id as string, metadata: { doctorId: b.doctorId, days: b.days } });
  res.status(201).json({ share: s });
}));

// ───────── prescriptions & refills ─────────
healthRouter.get('/prescriptions', wrap(async (req, res) => {
  const seniorId = await subject(req);
  res.json({ prescriptions: await query(`SELECT id, medication, dosage, prescribed_by, start_date, refills_remaining, status FROM prescriptions WHERE senior_id=$1 ORDER BY status, start_date DESC`, [seniorId]) });
}));

healthRouter.post('/prescriptions/:id/refill', wrap(async (req, res) => {
  const seniorId = await subject(req);
  const p = await one<any>(`SELECT id, refills_remaining, status FROM prescriptions WHERE id=$1 AND senior_id=$2`, [parse(uuid, req.params.id), seniorId]);
  if (!p) throw notFound();
  if (p.status !== 'active') throw new HttpError(409, 'not_active', 'This prescription is no longer active');
  if (p.refillsRemaining < 1) throw new HttpError(409, 'no_refills', 'No refills remaining — please book a consultation');
  const open = await one(`SELECT 1 FROM refill_requests WHERE prescription_id=$1 AND status='requested'`, [p.id]);
  if (open) throw new HttpError(409, 'already_requested', 'A refill is already requested');
  const r = await one(`INSERT INTO refill_requests (prescription_id, senior_id) VALUES ($1,$2) RETURNING id, status, created_at`, [p.id, seniorId]);
  res.status(201).json({ refill: r });
}));
