import { config } from '../config.js';
import { one, query } from '../db.js';
import { HttpError, notFound, tooMany } from '../lib/errors.js';
import { buildContext, CareContext, serializeContext } from './context.js';
import { getLlm } from './client.js';
import { assistantSystemPrompt } from './prompts.js';
import { Locale, safetyReply, screenMessage } from './safety.js';

export interface ChatResult {
  conversationId: string;
  reply: string;
  source: 'claude' | 'fallback' | 'safety';
  safety: 'medical_emergency' | 'self_harm' | null;
}

const HISTORY_TURNS = 10;

/** Rule-based answers used when no API key is configured or the model call fails. Uses the same allow-listed context. */
export function fallbackReply(message: string, ctx: CareContext, locale: Locale): string {
  const bn = locale === 'bn';
  const m = message.toLowerCase();
  if (/medic|pill|dose|tablet|ওষুধ|ট্যাবলেট|ডোজ/.test(m)) {
    const next = ctx.medications.find((d) => d.status === 'upcoming' || d.status === 'scheduled');
    const missed = ctx.medications.filter((d) => d.status === 'missed');
    const parts: string[] = [];
    if (next) parts.push(bn ? `পরবর্তী ওষুধ: ${next.name} ${next.dosage}, ${next.time}-এ।` : `Your next medicine is ${next.name} ${next.dosage} at ${next.time}.`);
    if (missed.length) parts.push(bn ? `আজ ${missed.map((d) => d.name).join(', ')} নেওয়া বাকি আছে। কী করবেন তা নিশ্চিত না হলে ডাক্তার বা ফার্মাসিস্টকে জিজ্ঞেস করুন।` : `You have not yet marked ${missed.map((d) => d.name).join(', ')} today. If you're unsure what to do about a late dose, please ask your doctor or pharmacist.`);
    if (!parts.length) parts.push(bn ? 'আজকের জন্য কোনো ওষুধ তালিকায় নেই।' : 'There are no medicines listed for you today.');
    return parts.join(' ');
  }
  if (/pressure|bp|sugar|heart|pulse|vital|প্রেসার|সুগার|নাড়ি/.test(m) && ctx.vitals.length) {
    const v = ctx.vitals.map((x) => `${x.label}: ${x.value}`).join('; ');
    return bn ? `আপনার সর্বশেষ রিডিং — ${v}। এই সংখ্যা নিয়ে চিন্তা থাকলে ডাক্তারের সঙ্গে কথা বলুন।` : `Your latest readings — ${v}. If any number worries you, please talk to your doctor.`;
  }
  if (/appointment|doctor|visit|ডাক্তার|অ্যাপয়েন্টমেন্ট/.test(m)) {
    const a = ctx.upcoming[0];
    return a ? (bn ? `আপনার পরবর্তী কর্মসূচি: ${a.title}, ${a.when}।` : `Your next event is ${a.title} on ${a.when}.`)
             : (bn ? 'এখন কোনো অ্যাপয়েন্টমেন্ট নেই। চাইলে TeleHealth থেকে নতুন বুক করতে পারেন।' : 'You have nothing booked right now. You can book a consultation from TeleHealth.');
  }
  return bn
    ? 'আমি এখন সীমিত মোডে আছি, তবু কিছু বিষয়ে সাহায্য করতে পারি — আজকের ওষুধ, সর্বশেষ রিডিং, বা আসন্ন অ্যাপয়েন্টমেন্ট। কোনটি জানতে চান?'
    : "I'm in basic mode right now, but I can still help with today's medicines, your latest readings, or upcoming appointments. Which would you like?";
}

export async function chat(opts: { userId: string; subjectId: string; audience: 'senior' | 'family'; message: string; conversationId?: string; locale: Locale }): Promise<ChatResult> {
  const { userId, subjectId, audience, message, locale } = opts;

  // Cost / abuse cap, enforced from the database so it holds across server instances.
  const used = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM ai_messages WHERE user_id=$1 AND role='user' AND created_at > now() - interval '1 day'`, [userId]))!.n;
  if (used >= config.AI_DAILY_MESSAGE_LIMIT) throw tooMany('You have reached today\'s message limit for the assistant. Please try again tomorrow.');

  let conversationId = opts.conversationId;
  if (conversationId) {
    if (!(await one('SELECT 1 FROM ai_conversations WHERE id=$1 AND user_id=$2', [conversationId, userId]))) throw notFound('Conversation not found');
  } else {
    conversationId = (await one<{ id: string }>('INSERT INTO ai_conversations (user_id, title) VALUES ($1,$2) RETURNING id', [userId, message.slice(0, 60)]))!.id;
  }
  await query(`INSERT INTO ai_messages (conversation_id, user_id, role, content) VALUES ($1,$2,'user',$3)`, [conversationId, userId, message]);

  const store = (content: string, source: ChatResult['source'], flag: string | null, extra: { model?: string; i?: number; o?: number } = {}) =>
    query(`INSERT INTO ai_messages (conversation_id, user_id, role, content, safety_flag, source, model, input_tokens, output_tokens) VALUES ($1,$2,'assistant',$3,$4,$5,$6,$7,$8)`,
      [conversationId, userId, content, flag, source, extra.model ?? null, extra.i ?? null, extra.o ?? null]);

  // 1) Deterministic red-flag screen — the model is never consulted for emergencies.
  const kind = screenMessage(message);
  if (kind) {
    const reply = safetyReply(kind, locale);
    await store(reply, 'safety', kind);
    return { conversationId, reply, source: 'safety', safety: kind };
  }

  const ctx = await buildContext(subjectId, audience);
  const llm = getLlm();
  if (llm) {
    try {
      const history = await query<{ role: 'user' | 'assistant'; content: string }>(
        `SELECT role, content FROM (SELECT id, role, content FROM ai_messages WHERE conversation_id=$1 ORDER BY id DESC LIMIT $2) t ORDER BY id`, [conversationId, HISTORY_TURNS * 2]);
      // The context rides on the latest user turn so it is always fresh; earlier turns stay plain.
      const messages = history.map((h, i) => (i === history.length - 1 && h.role === 'user' ? { role: h.role, content: `${serializeContext(ctx)}\n\n${h.content}` } : h));
      if (messages[0]?.role !== 'user') messages.shift();
      const out = await llm.complete({ system: assistantSystemPrompt(locale, audience), messages, maxTokens: 500 });
      if (out.text) {
        await store(out.text, 'claude', null, { model: out.model, i: out.inputTokens, o: out.outputTokens });
        return { conversationId, reply: out.text, source: 'claude', safety: null };
      }
    } catch (e) {
      console.error('[ai] model call failed, using fallback:', e instanceof Error ? e.message : 'unknown error'); // message only: never log prompts/health data
    }
  }
  const reply = fallbackReply(message, ctx, locale);
  await store(reply, 'fallback', null);
  return { conversationId, reply, source: 'fallback', safety: null };
}

export async function loadConversation(userId: string, conversationId: string) {
  if (!(await one('SELECT 1 FROM ai_conversations WHERE id=$1 AND user_id=$2', [conversationId, userId]))) throw new HttpError(404, 'not_found', 'Conversation not found');
  return query(`SELECT id, role, content, safety_flag, source, created_at FROM ai_messages WHERE conversation_id=$1 ORDER BY id`, [conversationId]);
}
