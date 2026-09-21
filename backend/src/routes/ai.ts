import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { query } from '../db.js';
import { tooMany } from '../lib/errors.js';
import { parse, uuid } from '../lib/http.js';
import { requireAuth, requireMember, resolveSubject, wrap } from '../middleware/auth.js';
import { chat, loadConversation } from '../ai/assistant.js';
import { getDigest } from '../ai/digest.js';
import { getLlm } from '../ai/client.js';
import { aiPhrased, recommendCaregivers, recommendEvents, recommendMeals } from '../ai/recommend.js';

export const aiRouter = Router();
aiRouter.use(requireAuth, requireMember);

const perUser = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, skip: () => config.isTest,
  keyGenerator: (req) => req.user!.id, validate: { keyGeneratorIpFallback: false }, handler: (_r, _s, next) => next(tooMany('Slowing down a little — please wait a moment.')) });

const locale = z.enum(['en', 'bn']);
const audience = (req: any) => (req.user.role === 'family' ? 'family' : 'senior') as 'senior' | 'family';

aiRouter.get('/status', wrap(async (_req, res) => res.json({
  mode: getLlm() ? 'ai' : 'basic', // 'basic' = rule-based fallbacks only (no API key configured)
  dailyMessageLimit: config.AI_DAILY_MESSAGE_LIMIT, emergencyNumber: config.EMERGENCY_NUMBER,
})));

aiRouter.post('/chat', perUser, wrap(async (req, res) => {
  const b = parse(z.object({ message: z.string().trim().min(1).max(1000), conversationId: uuid.optional(), seniorId: uuid.optional(), locale: locale.optional() }), req.body);
  const subjectId = await resolveSubject(req, b.seniorId);
  res.json(await chat({ userId: req.user!.id, subjectId, audience: audience(req), message: b.message, conversationId: b.conversationId, locale: b.locale ?? req.user!.locale }));
}));

aiRouter.get('/conversations', wrap(async (req, res) =>
  res.json({ conversations: await query('SELECT id, title, created_at FROM ai_conversations WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [req.user!.id]) })));

aiRouter.get('/conversations/:id', wrap(async (req, res) =>
  res.json({ messages: await loadConversation(req.user!.id, parse(uuid, req.params.id)) })));

aiRouter.get('/recommendations', wrap(async (req, res) => {
  const q = parse(z.object({ type: z.enum(['meals', 'events', 'caregivers']), seniorId: uuid.optional(), locale: locale.optional() }), req.query);
  const subjectId = await resolveSubject(req, q.seniorId);
  const loc = q.locale ?? req.user!.locale;
  const items = q.type === 'meals' ? await recommendMeals(subjectId, loc) : q.type === 'events' ? await recommendEvents(subjectId, loc) : await recommendCaregivers(subjectId, loc);
  res.json({ type: q.type, items: items.map(({ facts: _f, ...r }) => r), phrasedBy: aiPhrased() ? 'ai' : 'template' });
}));

aiRouter.get('/digest', perUser, wrap(async (req, res) => {
  const q = parse(z.object({ kind: z.enum(['daily', 'family_weekly']).default('daily'), seniorId: uuid.optional(), locale: locale.optional() }), req.query);
  const subjectId = await resolveSubject(req, q.seniorId);
  const kind = q.kind === 'family_weekly' && req.user!.role !== 'family' ? 'daily' : q.kind; // the weekly family summary is for family accounts
  res.json(await getDigest({ userId: req.user!.id, subjectId, audience: audience(req), kind, locale: q.locale ?? req.user!.locale }));
}));
