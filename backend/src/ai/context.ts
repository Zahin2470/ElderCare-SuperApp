import { config } from '../config.js';
import { query } from '../db.js';
import { adherence, todaysDoses, Adherence, DoseStatus } from '../lib/adherence.js';
import { latestMetrics } from '../lib/metrics.js';
import { localNow } from '../lib/time.js';

/**
 * What the model is allowed to know. This is an allow-list built field by field — NOT a row dump —
 * so personal identifiers (name, phone, email, address, IDs) cannot reach a third-party API by accident.
 */
export interface CareContext {
  localTime: string;
  localDate: string;
  audience: 'senior' | 'family';
  medications: { name: string; dosage: string; purpose: string | null; time: string; status: DoseStatus['status'] }[];
  adherence: Adherence;
  vitals: { label: string; value: string; status: string; trend: string }[];
  upcoming: { title: string; when: string }[];
}

/** Free text a user/caregiver typed (e.g. a medication name) is untrusted: strip markup/control chars and cap length. */
export const clean = (s: string | null | undefined, max = 80) =>
  (s ?? '').replace(/[<>`{}\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export async function buildContext(seniorId: string, audience: 'senior' | 'family'): Promise<CareContext> {
  const now = localNow();
  const [doses, adh, metrics, appts, events] = await Promise.all([
    todaysDoses(seniorId, now), adherence(seniorId, now), latestMetrics(seniorId),
    query<any>(`SELECT a.starts_at, d.specialty FROM appointments a JOIN doctors d ON d.id=a.doctor_id WHERE a.senior_id=$1 AND a.status='confirmed' AND a.starts_at > now() ORDER BY a.starts_at LIMIT 3`, [seniorId]),
    query<any>(`SELECT e.title, e.starts_at FROM event_rsvps r JOIN events e ON e.id=r.event_id WHERE r.user_id=$1 AND e.starts_at > now() ORDER BY e.starts_at LIMIT 3`, [seniorId]),
  ]);
  const fmt = (d: Date) => d.toLocaleString('en-GB', { timeZone: config.APP_TIMEZONE, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  return {
    localTime: now.hhmm, localDate: now.date, audience,
    medications: doses.map((d) => ({ name: clean(d.name), dosage: clean(d.dosage, 30), purpose: d.purpose ? clean(d.purpose, 40) : null, time: d.time, status: d.status })),
    adherence: adh,
    vitals: metrics.map((m) => ({ label: m.label, value: m.value2 != null ? `${m.value1}/${m.value2} ${m.unit}` : `${m.value1} ${m.unit}`, status: m.status, trend: m.trend })),
    upcoming: [
      ...appts.map((a) => ({ title: `${clean(a.specialty)} appointment`, when: fmt(a.startsAt), at: a.startsAt as Date })),
      ...events.map((e) => ({ title: clean(e.title), when: fmt(e.startsAt), at: e.startsAt as Date })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 5).map(({ title, when }) => ({ title, when })),
  };
}

/** Serialised inside <care_context> tags; the system prompt tells the model this is data, never instructions. */
export const serializeContext = (c: CareContext) => `<care_context>\n${JSON.stringify(c)}\n</care_context>`;
