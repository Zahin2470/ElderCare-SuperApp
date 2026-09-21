import { config } from '../config.js';

export interface LocalNow { date: string; minutes: number; hhmm: string }

/** Wall-clock date/time in the app timezone (Asia/Dhaka by default). */
export function localNow(at: Date = new Date(), tz = config.APP_TIMEZONE): LocalNow {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(at).map((x) => [x.type, x.value]),
  );
  const minutes = Number(p.hour) * 60 + Number(p.minute);
  return { date: `${p.year}-${p.month}-${p.day}`, minutes, hhmm: `${p.hour}:${p.minute}` };
}

export const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function tzOffsetMs(tz: string, at: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(at).map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** Convert a wall-clock date + HH:MM in the app timezone to an absolute instant. */
export function localToUtc(date: string, hhmm: string, tz = config.APP_TIMEZONE): Date {
  const [y, m, d] = date.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, Number(hhmm.slice(0, 2)), Number(hhmm.slice(3, 5)));
  const first = guess - tzOffsetMs(tz, new Date(guess));
  return new Date(guess - tzOffsetMs(tz, new Date(first)));
}
