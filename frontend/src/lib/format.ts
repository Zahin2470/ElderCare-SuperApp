export const TZ = 'Asia/Dhaka';

const d = (v: string | Date) => (v instanceof Date ? v : new Date(v));
export const fmtTime = (v: string | Date) => d(v).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
export const fmtDate = (v: string | Date, o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) => d(v).toLocaleDateString('en-US', { timeZone: TZ, ...o });
export const fmtDateTime = (v: string | Date) => `${fmtDate(v, { month: 'short', day: 'numeric' })}, ${fmtTime(v)}`;
export const fmtLongToday = () => new Date().toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
export const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

/** 'HH:MM' (24 h, local wall clock) → '8:00 AM' */
export const clock = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** 'YYYY-MM-DD' → 'Today' | 'Tomorrow' | 'Sep 25' (no timezone shifting: it's a calendar date). */
export function relativeDay(dateStr: string): string {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const diff = Math.round((Date.parse(`${dateStr}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
}

export const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
export const addDaysISO = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
