import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { pool } from './db.js';
import { HttpError, tooMany } from './lib/errors.js';
import { adminRouter } from './routes/admin.js';
import { agewellRouter } from './routes/agewell.js';
import { aiRouter } from './routes/ai.js';
import { authRouter } from './routes/auth.js';
import { caregiversRouter } from './routes/caregivers.js';
import { communityRouter } from './routes/community.js';
import { dashboardRouter } from './routes/dashboard.js';
import { familyRouter } from './routes/family.js';
import { healthRouter } from './routes/health.js';
import { medicationsRouter } from './routes/medications.js';
import { mentorsRouter } from './routes/mentors.js';
import { nutritionRouter } from './routes/nutrition.js';
import { rewardsRouter } from './routes/rewards.js';
import { telehealthRouter } from './routes/telehealth.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', config.TRUST_PROXY); // set TRUST_PROXY=1 behind nginx/a load balancer so rate limits see real client IPs
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)), credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // One JSON log line per request. Paths only — never query strings, bodies or tokens (they can carry health data).
  app.use((req, res, next) => {
    const id = randomUUID(); const t0 = process.hrtime.bigint();
    res.setHeader('X-Request-Id', id);
    res.on('finish', () => { if (!config.isTest) console.log(JSON.stringify({ t: new Date().toISOString(), id, m: req.method, p: req.path, s: res.statusCode, ms: Number(process.hrtime.bigint() - t0) / 1e6 | 0, u: req.user?.id })); });
    next();
  });

  app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false, skip: () => config.isTest, handler: (_r, _s, next) => next(tooMany()) }));

  app.get('/api/healthz', async (_req, res) => {
    try { await pool.query('SELECT 1'); res.json({ ok: true }); } catch { res.status(503).json({ ok: false }); }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/family', familyRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/medications', medicationsRouter);
  app.use('/api/care360', healthRouter);
  app.use('/api/telehealth', telehealthRouter);
  app.use('/api/caregivers', caregiversRouter);
  app.use('/api/nutrition', nutritionRouter);
  app.use('/api/community', communityRouter);
  app.use('/api/agewell', agewellRouter);
  app.use('/api/mentors', mentorsRouter);
  app.use('/api/rewards', rewardsRouter);
  app.use('/api/ai', aiRouter);

  app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'not_found', message: 'No such endpoint' } }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return void res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    if (err instanceof multer.MulterError) return void res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: { code: 'upload_error', message: err.code === 'LIMIT_FILE_SIZE' ? `File is larger than ${config.MAX_UPLOAD_MB} MB` : err.message } });
    if (err?.type === 'entity.parse.failed') return void res.status(400).json({ error: { code: 'bad_json', message: 'Malformed JSON body' } });
    if (err?.type === 'entity.too.large') return void res.status(413).json({ error: { code: 'too_large', message: 'Request body too large' } });
    if (err?.code === '23505') return void res.status(409).json({ error: { code: 'conflict', message: 'That already exists' } });
    if (err?.code === '22P02') return void res.status(400).json({ error: { code: 'bad_request', message: 'Malformed identifier' } });
    const id = res.getHeader('X-Request-Id');
    console.error(`[error] ${id} ${req.method} ${req.path}`, err); // full detail stays in server logs…
    res.status(500).json({ error: { code: 'internal', message: 'Something went wrong on our side.', requestId: id } }); // …never in the response
  });

  return app;
}
