import { config } from '../config.js';

export type Locale = 'en' | 'bn';
export type SafetyKind = 'medical_emergency' | 'self_harm';

/**
 * Deterministic red-flag screen. It runs BEFORE any model call and its answer never comes from an LLM,
 * so an outage, a jailbreak or a model mistake cannot suppress an emergency instruction.
 * It errs on the side of firing: a false alarm costs one extra sentence, a miss can cost a life.
 * (Keyword screening is a safety net, not a clinical triage tool — the system prompt also carries the rules.)
 */
const MEDICAL: RegExp[] = [
  /chest\s+(pain|tight|pressure|hurts?)/i, /pain\s+in\s+(my\s+)?chest/i,
  /(can'?t|cannot|unable\s+to|hard\s+to|difficult\w*)\s+(to\s+)?breath/i, /short(ness)?\s+of\s+breath/i, /struggling\s+to\s+breath/i,
  /heart\s*attack/i, /\bstroke\b/i, /face\s+(is\s+)?droop/i, /slurred\s+speech/i, /sudden(ly)?\s+(weak|numb|confus)/i,
  /(passed|black(ed)?)\s+out/i, /\bunconscious\b/i, /\bunresponsive\b/i, /\bfaint(ed|ing)\b/i, /not\s+responding/i,
  /\bfell\b.*(can'?t|cannot)\s+(get\s+up|move)/i, /(bleeding|bleed)\s+(heavily|badly|a\s+lot|won'?t\s+stop|will\s+not\s+stop)/i, /severe\s+bleeding/i,
  /overdos/i, /took\s+too\s+many\s+(pills|tablets|medicine)/i, /swallowed\s+(poison|bleach)/i,
  // Bangla
  /বুক(ে)?\s*(খুব\s*)?(ব্যথা|চাপ|ধড়ফড়)/, /শ্বাস\s*(নিতে|নিতে\s*)?\s*(কষ্ট|পারছি\s*না|পারছে\s*না)/, /দম\s*(বন্ধ|আটকে)/, /হার্ট\s*অ্যাটাক/, /স্ট্রোক/,
  /অজ্ঞান/, /জ্ঞান\s*(নেই|হারা)/, /সাড়া\s*দিচ্ছে\s*না/, /পড়ে\s*(গিয়ে|গেছ)\w*.*(উঠতে\s*পারছি?\s*না|নড়তে\s*পারছি?\s*না)/,
  /প্রচুর\s*রক্ত/, /রক্ত\s*(বন্ধ\s*হচ্ছে\s*না|পড়ছে)/, /বিষ\s*খে/, /অতিরিক্ত\s*(ওষুধ|ট্যাবলেট)\s*খে/,
];
const SELF_HARM: RegExp[] = [
  /kill\s+myself/i, /end\s+(my\s+life|it\s+all)/i, /want\s+to\s+die/i, /suicid/i, /(don'?t|do\s+not)\s+want\s+to\s+live/i, /better\s+off\s+dead/i,
  /আত্মহত্যা/, /মরে\s*যেতে\s*চাই/, /বাঁচতে\s*চাই\s*না/, /নিজেকে\s*শেষ/,
];

export function screenMessage(text: string): SafetyKind | null {
  if (SELF_HARM.some((r) => r.test(text))) return 'self_harm';
  if (MEDICAL.some((r) => r.test(text))) return 'medical_emergency';
  return null;
}

export function safetyReply(kind: SafetyKind, locale: Locale): string {
  const n = config.EMERGENCY_NUMBER;
  if (kind === 'self_harm') {
    return locale === 'bn'
      ? `আপনি যা বলছেন তা আমি গুরুত্ব দিয়ে নিচ্ছি, এবং আপনি একা নন। এখনই আপনার পরিবারের কাউকে বা বিশ্বাসের কোনো মানুষকে ফোন করুন বা তাঁর কাছে যান। বিপদ মনে হলে এই মুহূর্তে ${n} নম্বরে কল করুন। আমি এখানে আছি — কিন্তু এই সময়ে আপনার পাশে একজন মানুষ থাকা সবচেয়ে জরুরি।`
      : `I'm taking what you said seriously, and you are not alone. Please call or go to a family member or someone you trust right now. If you feel you may be in danger, call ${n} immediately. I'm here with you, but right now the most important thing is to have a real person by your side.`;
  }
  return locale === 'bn'
    ? `এটি জরুরি অবস্থা হতে পারে। এখনই ${n} নম্বরে কল করুন এবং আপনার পরিবারের সদস্য বা কেয়ারগিভারকে জানান। একা থাকলে দরজা খুলে রাখুন এবং কাছের কাউকে ডাকুন। অপেক্ষা করবেন না — আমি এখানে চিকিৎসা পরামর্শ দিতে পারি না।`
    : `This could be an emergency. Please call ${n} right now and tell a family member or caregiver. If you are alone, unlock your door and call out to someone nearby. Please don't wait — I can't give medical advice for this.`;
}
