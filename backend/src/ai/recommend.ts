import { one, query } from '../db.js';
import { latestMetrics } from '../lib/metrics.js';
import { localNow } from '../lib/time.js';
import { getLlm } from './client.js';
import { recommendReasonPrompt } from './prompts.js';
import { Locale } from './safety.js';

/**
 * Recommendations are ranked by a transparent scoring function (so they are explainable, testable and
 * cannot hallucinate an item). Claude is used only to phrase the reason in friendly words — it cannot
 * add items, change the order, or introduce claims beyond the supplied facts.
 */
export interface Recommendation {
  id: string; type: 'meal' | 'plan' | 'event' | 'caregiver'; title: string; subtitle: string; score: number;
  facts: { en: string; bn: string }[]; reason: string;
}
export type RecType = 'meals' | 'events' | 'caregivers';

const L = (locale: Locale, f: { en: string; bn: string }) => f[locale];
/** 'Low-Sodium', 'low sodium' and 'Low Sodium' must all match. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const lower = (a: string[]) => a.map(norm);

// ───────── needs derived from data the person already has in the app ─────────
interface Need { tags: string[]; fact: { en: string; bn: string } }
export async function deriveNeeds(seniorId: string): Promise<Need[]> {
  const [metrics, meds] = await Promise.all([latestMetrics(seniorId), query<{ purpose: string | null }>('SELECT purpose FROM medications WHERE senior_id=$1 AND active', [seniorId])]);
  const purposes = meds.map((m) => m.purpose ?? '').join(' | ');
  const m = (k: string) => metrics.find((x) => x.kind === k);
  const needs: Need[] = [];
  const bp = m('blood_pressure'), sugar = m('blood_sugar');
  if ((bp && (bp.status === 'elevated' || bp.status === 'high')) || /blood pressure|hypertens|প্রেসার/i.test(purposes)) {
    needs.push({ tags: ['Low Sodium', 'Heart Healthy'], fact: bp && bp.status !== 'normal'
      ? { en: 'your latest blood pressure reading was above the usual range', bn: 'আপনার সর্বশেষ রক্তচাপের রিডিং স্বাভাবিকের চেয়ে বেশি ছিল' }
      : { en: 'you take medicine for blood pressure', bn: 'আপনি রক্তচাপের ওষুধ খান' } });
  }
  if ((sugar && (sugar.status === 'elevated' || sugar.status === 'high')) || /diabet|sugar|ডায়াবেটিস|সুগার/i.test(purposes)) {
    needs.push({ tags: ['Diabetic Friendly', 'Blood Sugar Friendly', 'Low Sugar', 'Low Carb', 'High Fiber'], fact: sugar && sugar.status !== 'normal'
      ? { en: 'your latest blood sugar reading was above the usual range', bn: 'আপনার সর্বশেষ ব্লাড সুগারের রিডিং স্বাভাবিকের চেয়ে বেশি ছিল' }
      : { en: 'you take medicine for diabetes', bn: 'আপনি ডায়াবেটিসের ওষুধ খান' } });
  }
  if (/cholesterol|statin|কোলেস্টেরল/i.test(purposes)) needs.push({ tags: ['Heart Healthy', 'Omega-3', 'High Fiber'], fact: { en: 'you take medicine for cholesterol', bn: 'আপনি কোলেস্টেরলের ওষুধ খান' } });
  return needs;
}

const overlap = (have: string[], want: string[]) => { const w = lower(want); return have.filter((t) => w.includes(norm(t))); };

// ───────── meals ─────────
export async function recommendMeals(seniorId: string, locale: Locale): Promise<Recommendation[]> {
  const now = localNow();
  const slot = now.minutes < 11 * 60 ? 'Breakfast' : now.minutes < 16 * 60 ? 'Lunch' : 'Dinner';
  const [needs, items, plans, liked] = await Promise.all([
    deriveNeeds(seniorId),
    query<any>('SELECT id, name, meal_type, calories, tags, price_bdt FROM menu_items WHERE active'),
    query<any>('SELECT id, name, dietitian, tags, price_per_day_bdt, rating FROM meal_plans WHERE active'),
    query<any>(`SELECT p.tags AS plan_tags, o.items FROM meal_orders o LEFT JOIN meal_plans p ON p.id=o.plan_id WHERE o.senior_id=$1 AND o.rating >= 4`, [seniorId]),
  ]);
  const likedIds = new Set(liked.flatMap((o) => (o.items as any[]).map((i) => i.menuItemId)));
  const likedTags = new Set(lower(liked.flatMap((o) => o.planTags ?? [])));
  const likedList = [...likedTags];

  const out: Recommendation[] = [];
  const score = (id: string, tags: string[], mealType: string | null, rating: number) => {
    const facts: Recommendation['facts'] = []; let s = rating / 5;
    for (const n of needs) {
      const hit = overlap(tags, n.tags);
      if (hit.length) { s += 3 * Math.min(hit.length, 2); facts.push({ en: `${hit.join(', ')} — chosen because ${n.fact.en}`, bn: `${hit.join(', ')} — কারণ ${n.fact.bn}` }); }
    }
    if (likedIds.has(id) || overlap(tags, likedList).length) { s += 1; facts.push({ en: 'you rated similar meals highly before', bn: 'আগে একই ধরনের খাবারে আপনি ভালো রেটিং দিয়েছেন' }); }
    if (mealType === slot) { s += 1.5; facts.push({ en: `it suits ${slot.toLowerCase()} time`, bn: `এটি এখনকার খাবারের সময়ের জন্য উপযুক্ত` }); }
    return { s, facts };
  };
  for (const it of items) { const { s, facts } = score(it.id, it.tags, it.mealType, 4); out.push({ id: it.id, type: 'meal', title: it.name, subtitle: `${it.mealType} · ${it.calories ?? '—'} kcal · ৳${it.priceBdt}`, score: s, facts, reason: '' }); }
  for (const p of plans) { const { s, facts } = score(p.id, p.tags, null, p.rating); out.push({ id: p.id, type: 'plan', title: p.name, subtitle: `Plan · ৳${p.pricePerDayBdt}/day · ${p.dietitian ?? ''}`.trim(), score: s, facts, reason: '' }); }
  return finish(out.filter((r) => r.facts.length).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 4), locale);
}

// ───────── community events ─────────
export async function recommendEvents(userId: string, locale: Locale): Promise<Recommendation[]> {
  const [events, past] = await Promise.all([
    query<any>(`SELECT e.id, e.title, e.category, e.starts_at, e.mode, e.capacity, (SELECT count(*)::int FROM event_rsvps r WHERE r.event_id=e.id) AS attendees
                  FROM events e WHERE e.active AND e.starts_at > now() AND e.starts_at < now() + interval '30 days'
                   AND NOT EXISTS (SELECT 1 FROM event_rsvps r WHERE r.event_id=e.id AND r.user_id=$1)`, [userId]),
    query<{ category: string }>('SELECT e.category FROM event_rsvps r JOIN events e ON e.id=r.event_id WHERE r.user_id=$1', [userId]),
  ]);
  const affinity = new Map<string, number>();
  for (const p of past) affinity.set(p.category, (affinity.get(p.category) ?? 0) + 1);
  const out: Recommendation[] = [];
  for (const e of events) {
    if (e.attendees >= e.capacity) continue; // never suggest a full event
    const facts: Recommendation['facts'] = []; let s = 0;
    const a = affinity.get(e.category) ?? 0;
    if (a) { s += Math.min(a, 3) * 2; facts.push({ en: `you have joined ${e.category} activities before`, bn: `আপনি আগে ${e.category} কার্যক্রমে যোগ দিয়েছেন` }); }
    const days = (e.startsAt.getTime() - Date.now()) / 86_400_000;
    if (days <= 3) { s += 2; facts.push({ en: 'it is happening soon', bn: 'এটি খুব শীঘ্রই হচ্ছে' }); } else if (days <= 7) s += 1;
    const left = e.capacity - e.attendees;
    if (left <= 3) facts.push({ en: `only ${left} spots left`, bn: `মাত্র ${left}টি আসন বাকি` });
    s += Math.min(e.attendees / e.capacity, 1); // mild popularity signal
    if (!facts.length) facts.push({ en: 'it is popular with other members', bn: 'এটি অন্য সদস্যদের কাছে জনপ্রিয়' });
    out.push({ id: e.id, type: 'event', title: e.title, subtitle: `${e.category} · ${e.mode}`, score: s, facts, reason: '' });
  }
  return finish(out.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 4), locale);
}

// ───────── caregivers ─────────
export async function recommendCaregivers(seniorId: string, locale: Locale): Promise<Recommendation[]> {
  const [{ n }, cgs] = await Promise.all([
    one<{ n: number }>('SELECT count(*)::int AS n FROM medications WHERE senior_id=$1 AND active', [seniorId]).then((r) => r!),
    query<any>('SELECT id, name, rating, reviews_count, experience_years, specialties, hourly_rate_bdt, area, verified, available_from FROM caregivers WHERE active'),
  ]);
  const wantMedical = n >= 3;
  const soon = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  const out = cgs.map((c) => {
    const facts: Recommendation['facts'] = []; let s = c.rating * 1.5 + Math.min(c.experienceYears, 15) / 5;
    if (c.verified) { s += 2; facts.push({ en: 'identity and background are verified', bn: 'পরিচয় ও ব্যাকগ্রাউন্ড যাচাই করা' }); }
    if (wantMedical && (c.specialties as string[]).some((x) => norm(x).includes('medical'))) { s += 3; facts.push({ en: 'has medical-care experience and you manage several medicines', bn: 'চিকিৎসা-সেবার অভিজ্ঞতা আছে এবং আপনি একাধিক ওষুধ খান' }); }
    if (c.availableFrom <= soon) { s += 1.5; facts.push({ en: 'available within the next two days', bn: 'আগামী দুই দিনের মধ্যে পাওয়া যাবে' }); }
    if (c.rating >= 4.5) facts.push({ en: `rated ${c.rating} by ${c.reviewsCount} families`, bn: `${c.reviewsCount} জন ব্যবহারকারী ${c.rating} রেটিং দিয়েছেন` });
    if (!facts.length) facts.push({ en: `${c.experienceYears} years of experience`, bn: `${c.experienceYears} বছরের অভিজ্ঞতা` });
    return { id: c.id, type: 'caregiver' as const, title: c.name, subtitle: `${(c.specialties as string[]).slice(0, 2).join(', ')} · ৳${c.hourlyRateBdt}/hr`, score: s, facts, reason: '' };
  });
  return finish(out.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 3), locale);
}

// ───────── phrasing ─────────
const cache = new Map<string, { at: number; reasons: Record<string, string> }>();
const TTL = 6 * 3600_000;

async function finish(recs: Recommendation[], locale: Locale): Promise<Recommendation[]> {
  for (const r of recs) r.reason = r.facts.slice(0, 1).map((f) => L(locale, f)).join('; ');
  const llm = getLlm();
  if (!llm || !recs.length) return recs;
  const key = `${locale}|${recs.map((r) => `${r.id}:${r.facts.map((f) => f.en).join('/')}`).join(',')}`;
  const hit = cache.get(key);
  let reasons = hit && Date.now() - hit.at < TTL ? hit.reasons : null;
  if (!reasons) {
    try {
      const input = JSON.stringify(recs.map((r) => ({ id: r.id, title: r.title, facts: r.facts.map((f) => f.en) })));
      const out = await llm.complete({ system: recommendReasonPrompt(locale), messages: [{ role: 'user', content: input }], maxTokens: 400 });
      const parsed = JSON.parse(out.text.replace(/^```(?:json)?|```$/gm, '').trim());
      reasons = {};
      for (const r of recs) { const v = parsed?.[r.id]; if (typeof v === 'string' && v.trim() && v.length <= 200) reasons[r.id] = v.trim(); }
      cache.set(key, { at: Date.now(), reasons });
    } catch (e) {
      console.error('[ai] recommendation phrasing failed, using template reasons:', e instanceof Error ? e.message : 'unknown');
      return recs;
    }
  }
  for (const r of recs) if (reasons[r.id]) r.reason = reasons[r.id];
  return recs;
}

export const clearRecommendationCache = () => cache.clear();
export const aiPhrased = () => Boolean(getLlm());
