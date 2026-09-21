import { z } from 'zod';
import { one, query } from '../db.js';
import { config } from '../config.js';
import { buildContext, CareContext, serializeContext } from './context.js';
import { getLlm } from './client.js';
import { digestSystemPrompt } from './prompts.js';
import { Locale } from './safety.js';
import { adherence } from '../lib/adherence.js';

export type DigestKind = 'daily' | 'family_weekly';

const contentSchema = z.object({
  headline: z.string().min(1).max(120), summary: z.string().min(1).max(500),
  highlights: z.array(z.string().max(180)).max(4).default([]), tip: z.string().max(220).default(''), attention: z.array(z.string().max(180)).max(3).default([]),
});
export type DigestContent = z.infer<typeof contentSchema>;

/** Exact numbers computed by code. The UI renders THESE; the model's prose is decoration around them. */
export function computeFacts(ctx: CareContext) {
  const taken = ctx.medications.filter((m) => m.status === 'taken').length;
  return {
    date: ctx.localDate, dosesToday: ctx.medications.length, dosesTaken: taken,
    dosesMissed: ctx.medications.filter((m) => m.status === 'missed').length,
    nextDose: ctx.medications.find((m) => m.status === 'upcoming' || m.status === 'scheduled') ?? null,
    adherenceThisWeek: ctx.adherence.thisWeek, missedThisWeek: ctx.adherence.missedThisWeek,
    vitals: ctx.vitals, upcoming: ctx.upcoming,
  };
}

const TIPS = {
  en: ['Sip water regularly through the day.', 'A gentle 10-minute walk after a meal is good for the body and mood.', 'Sit by a sunny window for a few minutes this morning.', 'Do a few slow shoulder and neck stretches.', 'Call a friend or relative for a short chat today.'],
  bn: ['সারা দিন অল্প অল্প করে পানি পান করুন।', 'খাবারের পর ১০ মিনিট হালকা হাঁটা শরীর ও মন ভালো রাখে।', 'আজ সকালে কিছুক্ষণ রোদ-আসা জানালার পাশে বসুন।', 'ধীরে ধীরে কাঁধ ও ঘাড়ের কিছু স্ট্রেচ করুন।', 'আজ কোনো বন্ধু বা আত্মীয়ের সঙ্গে একটু কথা বলুন।'],
};

export function templateDigest(ctx: CareContext, kind: DigestKind, locale: Locale): DigestContent {
  const bn = locale === 'bn'; const f = computeFacts(ctx);
  const day = Math.floor(new Date(`${ctx.localDate}T00:00:00Z`).getTime() / 86_400_000);
  const flagged = ctx.vitals.filter((v) => v.status === 'high' || v.status === 'elevated' || v.status === 'low');
  const attention: string[] = [];
  if (f.dosesMissed) attention.push(bn ? `আজ ${f.dosesMissed}টি ডোজ এখনো চিহ্নিত হয়নি।` : `${f.dosesMissed} dose(s) today are not marked as taken yet.`);
  for (const v of flagged.slice(0, 2)) attention.push(bn ? `${v.label}-এর সর্বশেষ রিডিং (${v.value}) স্বাভাবিক সীমার বাইরে — ডাক্তারকে জানান।` : `Latest ${v.label} (${v.value}) is outside the usual range — worth mentioning to a doctor.`);

  if (kind === 'family_weekly') {
    const pct = ctx.adherence.thisWeek;
    return {
      headline: bn ? 'এই সপ্তাহের সারসংক্ষেপ' : 'This week at a glance',
      summary: pct == null ? (bn ? 'এই সপ্তাহে হিসাব করার মতো পর্যাপ্ত ওষুধের তথ্য নেই।' : 'There is not enough medication data yet to summarise this week.')
        : (bn ? `এই সপ্তাহে ওষুধ নেওয়ার হার ${pct}%; ${ctx.adherence.missedThisWeek}টি ডোজ বাদ গেছে।` : `Medication adherence this week was ${pct}%, with ${ctx.adherence.missedThisWeek} missed dose(s).`),
      highlights: ctx.vitals.slice(0, 3).map((v) => `${v.label}: ${v.value}`), tip: '', attention,
    };
  }
  return {
    headline: bn ? 'আজকের দিনের সারসংক্ষেপ' : 'Your day at a glance',
    summary: f.dosesToday ? (bn ? `আজ ${f.dosesToday}টি ওষুধের মধ্যে ${f.dosesTaken}টি নেওয়া হয়েছে।` : `You have ${f.dosesToday} medicine dose(s) today; ${f.dosesTaken} taken so far.`)
                          : (bn ? 'আজ কোনো ওষুধের সময়সূচি নেই।' : 'No medicines are scheduled for today.'),
    highlights: [
      ...(f.nextDose ? [bn ? `পরবর্তী ওষুধ: ${f.nextDose.name}, ${f.nextDose.time}` : `Next medicine: ${f.nextDose.name} at ${f.nextDose.time}`] : []),
      ...ctx.upcoming.slice(0, 2).map((u) => `${u.title} — ${u.when}`),
    ].slice(0, 4),
    tip: TIPS[locale][day % TIPS[locale].length], attention,
  };
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toAscii = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
/** Hallucination guard: every number in generated prose must exist in the facts we supplied (small counts 0–10 are allowed). */
export function numbersGrounded(content: DigestContent, ctx: CareContext): boolean {
  const allowed = new Set((toAscii(JSON.stringify(ctx)).match(/\d+(?:\.\d+)?/g) ?? []).map(Number));
  const text = toAscii([content.headline, content.summary, content.tip, ...content.highlights, ...content.attention].join(' '));
  return (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number).every((n) => n <= 10 || allowed.has(n));
}

function parseJson(text: string): unknown {
  const t = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  const start = t.indexOf('{'), end = t.lastIndexOf('}');
  return JSON.parse(start >= 0 && end > start ? t.slice(start, end + 1) : t);
}

export async function getDigest(o: { userId: string; subjectId: string; audience: 'senior' | 'family'; kind: DigestKind; locale: Locale; refresh?: boolean }) {
  const { userId, subjectId, kind, locale } = o;
  const ctx = await buildContext(subjectId, o.audience);
  if (kind === 'family_weekly') ctx.adherence = await adherence(subjectId); // weekly view leans on the week's numbers
  const facts = computeFacts(ctx);

  if (!o.refresh) {
    const hit = await one<any>('SELECT content, source, model FROM ai_digests WHERE user_id=$1 AND subject_id=$2 AND kind=$3 AND for_date=$4 AND locale=$5', [userId, subjectId, kind, ctx.localDate, locale]);
    // Cached prose is reused, but the numbers always come fresh from `facts`.
    if (hit) return { kind, locale, facts, content: hit.content as DigestContent, source: hit.source as string, cached: true };
  }

  let content = templateDigest(ctx, kind, locale), source = 'fallback', model: string | null = null;
  const llm = getLlm();
  if (llm) {
    try {
      const out = await llm.complete({ system: digestSystemPrompt(kind, locale), messages: [{ role: 'user', content: serializeContext(ctx) }], maxTokens: 600 });
      const parsed = contentSchema.parse(parseJson(out.text));
      if (numbersGrounded(parsed, ctx)) { content = parsed; source = 'claude'; model = out.model; }
      else console.warn('[ai] digest rejected: contained numbers not present in the supplied facts');
    } catch (e) {
      console.error('[ai] digest generation failed, using template:', e instanceof Error ? e.message : 'unknown');
    }
  }
  await query(`INSERT INTO ai_digests (user_id, subject_id, kind, for_date, locale, content, source, model) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
               ON CONFLICT (user_id, subject_id, kind, for_date, locale) DO UPDATE SET content=EXCLUDED.content, source=EXCLUDED.source, model=EXCLUDED.model, created_at=now()`,
    [userId, subjectId, kind, ctx.localDate, locale, JSON.stringify(content), source, model]);
  return { kind, locale, facts, content, source, cached: false };
}

export const digestModelName = () => config.ANTHROPIC_MODEL;
