import { config } from '../config.js';
import { query } from '../db.js';
import { addDays, localNow, toMinutes } from './time.js';

const GRACE_MIN = 60; // a dose counts as missed one hour after its scheduled time

export interface DoseStatus {
  medicationId: string; name: string; dosage: string; purpose: string | null; reminder: boolean;
  time: string; status: 'taken' | 'skipped' | 'missed' | 'upcoming' | 'scheduled'; takenAt: Date | null;
}

export async function todaysDoses(seniorId: string, now = localNow()): Promise<DoseStatus[]> {
  const meds = await query<any>(`SELECT id, name, dosage, purpose, reminder, schedule_times FROM medications WHERE senior_id=$1 AND active`, [seniorId]);
  const logs = await query<any>(`SELECT medication_id, scheduled_time, status, taken_at FROM medication_logs WHERE senior_id=$1 AND scheduled_date=$2`, [seniorId, now.date]);
  const byKey = new Map(logs.map((l) => [`${l.medicationId}|${l.scheduledTime}`, l]));
  const out: DoseStatus[] = [];
  for (const m of meds) for (const t of m.scheduleTimes as string[]) {
    const log = byKey.get(`${m.id}|${t}`);
    const at = toMinutes(t);
    const status: DoseStatus['status'] = log ? log.status
      : at + GRACE_MIN < now.minutes ? 'missed'
      : at <= now.minutes + 120 ? 'upcoming' : 'scheduled';
    out.push({ medicationId: m.id, name: m.name, dosage: m.dosage, purpose: m.purpose, reminder: m.reminder, time: t, status, takenAt: log?.takenAt ?? null });
  }
  return out.sort((a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name));
}

export interface HistoryEntry { date: string; time: string; name: string; dosage: string; status: 'taken' | 'skipped' | 'missed'; takenAt: Date | null }

/** Every dose that was due in the last `days` days (today included, once its time has passed), with the outcome. Missed = due and never logged. */
export async function doseHistory(seniorId: string, days: number, now = localNow()): Promise<HistoryEntry[]> {
  const from = addDays(now.date, -(days - 1));
  const meds = await query<any>(`SELECT id, name, dosage, schedule_times, (created_at AT TIME ZONE $2)::date::text AS since FROM medications WHERE senior_id=$1 AND active`, [seniorId, config.APP_TIMEZONE]);
  const logs = await query<any>(`SELECT medication_id, scheduled_date, scheduled_time, status, taken_at FROM medication_logs WHERE senior_id=$1 AND scheduled_date >= $2`, [seniorId, from]);
  const byKey = new Map(logs.map((l) => [`${l.medicationId}|${l.scheduledDate}|${l.scheduledTime}`, l]));
  const out: HistoryEntry[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(from, i);
    for (const m of meds) {
      if (day < m.since) continue;
      for (const t of m.scheduleTimes as string[]) {
        const l = byKey.get(`${m.id}|${day}|${t}`);
        if (!l && (day > now.date || (day === now.date && toMinutes(t) + GRACE_MIN > now.minutes))) continue; // not due yet
        out.push({ date: day, time: t, name: m.name, dosage: m.dosage, status: l ? l.status : 'missed', takenAt: l?.takenAt ?? null });
      }
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || a.name.localeCompare(b.name));
}

export interface Adherence { thisWeek: number | null; thisMonth: number | null; onTime: number | null; missedThisWeek: number; dosesThisWeek: number }

/**
 * Adherence = taken / (doses whose time has already passed). Doses before a medication was added
 * are not counted against the person. Returns null (not 0%) when there is nothing to measure yet.
 */
export async function adherence(seniorId: string, now = localNow()): Promise<Adherence> {
  const from = addDays(now.date, -29);
  const meds = await query<any>(`SELECT id, schedule_times, (created_at AT TIME ZONE $2)::date::text AS since FROM medications WHERE senior_id=$1 AND active`, [seniorId, config.APP_TIMEZONE]);
  const logs = await query<any>(`SELECT medication_id, scheduled_date, scheduled_time, status, taken_at FROM medication_logs WHERE senior_id=$1 AND scheduled_date >= $2`, [seniorId, from]);
  const key = (m: string, d: string, t: string) => `${m}|${d}|${t}`;
  const logMap = new Map(logs.map((l) => [key(l.medicationId, l.scheduledDate, l.scheduledTime), l]));
  const weekStart = addDays(now.date, -6);
  let wDue = 0, wTaken = 0, wMissed = 0, mDue = 0, mTaken = 0, onTime = 0, taken = 0;

  for (let i = 0; i < 30; i++) {
    const day = addDays(from, i);
    for (const m of meds) {
      if (day < m.since) continue;
      for (const t of m.scheduleTimes as string[]) {
        const passed = day < now.date || toMinutes(t) + GRACE_MIN <= now.minutes;
        if (!passed) continue;
        const l = logMap.get(key(m.id, day, t));
        const took = l?.status === 'taken';
        mDue++; if (took) mTaken++;
        if (day >= weekStart) { wDue++; if (took) wTaken++; else wMissed++; }
        if (took) {
          taken++;
          if (l.takenAt) { const lt = localNow(l.takenAt); if (lt.date === day && Math.abs(lt.minutes - toMinutes(t)) <= GRACE_MIN) onTime++; }
        }
      }
    }
  }
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : null);
  return { thisWeek: pct(wTaken, wDue), thisMonth: pct(mTaken, mDue), onTime: pct(onTime, taken), missedThisWeek: wMissed, dosesThisWeek: wDue };
}
