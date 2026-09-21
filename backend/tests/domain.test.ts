import fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { one, query } from '../src/db.js';
import { addDays, localNow } from '../src/lib/time.js';
import { signAccessToken } from '../src/lib/security.js';
import { api, asFamily, asOther, asSenior, auth, DEMO_PASSWORD, login, seed } from './helpers.js';

let ids: Awaited<ReturnType<typeof seed>>;
beforeEach(async () => { ids = await seed({ quiet: true }); });
const tomorrow = () => addDays(localNow().date, 1);

describe('SilverBox medications', () => {
  it('marking a dose taken is idempotent: stock drops once, points are awarded once', async () => {
    const t = await asSenior(); const med = ids.meds[0]; const before = med.stockRemaining;
    const first = await api().post(`/api/medications/${med.id}/take`).set(auth(t)).send({ time: '08:00' });
    const second = await api().post(`/api/medications/${med.id}/take`).set(auth(t)).send({ time: '08:00' });
    expect(first.body).toMatchObject({ alreadyLogged: false, pointsAwarded: 10 });
    expect(second.body).toMatchObject({ alreadyLogged: true, pointsAwarded: 0 });
    expect((await one<any>('SELECT stock_remaining FROM medications WHERE id=$1', [med.id])).stockRemaining).toBe(before - 1);
  });
  it('survives a burst of simultaneous taps (double-tap / retry storms)', async () => {
    const t = await asSenior(); const med = ids.meds[1];
    await Promise.all(Array.from({ length: 8 }, () => api().post(`/api/medications/${med.id}/take`).set(auth(t)).send({ time: '12:00' })));
    expect((await one<any>('SELECT count(*)::int AS n FROM medication_logs WHERE medication_id=$1 AND scheduled_date=$2', [med.id, localNow().date])).n).toBe(1);
    expect((await one<any>('SELECT stock_remaining FROM medications WHERE id=$1', [med.id])).stockRemaining).toBe(med.stockRemaining - 1);
  });
  it('only accepts times that are on the schedule', async () => {
    const t = await asSenior();
    expect((await api().post(`/api/medications/${ids.meds[0].id}/take`).set(auth(t)).send({ time: '03:33' })).status).toBe(404);
    expect((await api().post(`/api/medications/${ids.meds[0].id}/take`).set(auth(t)).send({ time: '8am' })).status).toBe(400);
  });
  it('stock never goes negative', async () => {
    const t = await asSenior(); await query('UPDATE medications SET stock_remaining=0 WHERE id=$1', [ids.meds[3].id]);
    await api().post(`/api/medications/${ids.meds[3].id}/take`).set(auth(t)).send({ time: '21:00' });
    expect((await one<any>('SELECT stock_remaining FROM medications WHERE id=$1', [ids.meds[3].id])).stockRemaining).toBe(0);
  });
  it('a family member can log a dose for their senior, and it is recorded who did it', async () => {
    const t = await asFamily();
    expect((await api().post(`/api/medications/${ids.meds[1].id}/take`).set(auth(t)).send({ time: '12:00' })).status).toBe(200);
    const log = await one<any>('SELECT logged_by, senior_id FROM medication_logs WHERE medication_id=$1 AND scheduled_date=$2', [ids.meds[1].id, localNow().date]);
    expect(log.loggedBy).toBe(ids.family.id); expect(log.seniorId).toBe(ids.senior.id);
  });
  it('adherence is computed from real logs and is null (not 0%) when there is nothing to measure', async () => {
    const t = await asSenior();
    const a = (await api().get('/api/medications/adherence').set(auth(t))).body;
    expect(a.thisWeek).toBeGreaterThan(70); expect(a.thisWeek).toBeLessThanOrEqual(100); expect(a.thisMonth).toBeGreaterThan(70);
    const empty = (await api().get('/api/medications/adherence').set(auth(await asOther()))).body;
    expect(empty).toMatchObject({ thisWeek: null, thisMonth: null, onTime: null, missedThisWeek: 0 });
  });
  it('validates a new medication', async () => {
    const t = await asSenior();
    expect((await api().post('/api/medications').set(auth(t)).send({ name: 'X', dosage: '5mg', scheduleTimes: [] })).status).toBe(400);
    const ok = await api().post('/api/medications').set(auth(t)).send({ name: 'Vitamin D', dosage: '1000IU', scheduleTimes: ['09:00', '09:00', '20:00'] });
    expect(ok.status).toBe(201); expect(ok.body.medication.scheduleTimes).toEqual(['09:00', '20:00']);
  });
});

describe('vitals & rewards', () => {
  it('validates readings and awards the check-in bonus only once a day', async () => {
    const t = await asSenior();
    expect((await api().post('/api/care360/metrics').set(auth(t)).send({ kind: 'blood_pressure', value1: 120 })).status).toBe(400);
    expect((await api().post('/api/care360/metrics').set(auth(t)).send({ kind: 'blood_pressure', value1: 80, value2: 120 })).status).toBe(400);
    const a = await api().post('/api/care360/metrics').set(auth(t)).send({ kind: 'blood_pressure', value1: 150, value2: 95 });
    const b = await api().post('/api/care360/metrics').set(auth(t)).send({ kind: 'heart_rate', value1: 72 });
    expect(a.body).toMatchObject({ status: 'high', pointsAwarded: 25 });
    expect(b.body.pointsAwarded).toBe(0);
  });
  it('cannot overspend: 8 parallel redemptions with 1250 points and a 500-point reward → exactly 2 succeed', async () => {
    const t = await asSenior(); const reward = await one<any>(`SELECT id FROM rewards WHERE cost=500`);
    const results = await Promise.all(Array.from({ length: 8 }, () => api().post('/api/rewards/redeem').set(auth(t)).send({ rewardId: reward.id })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(2);
    expect(results.filter((r) => r.status === 402)).toHaveLength(6);
    expect((await api().get('/api/rewards/summary').set(auth(t))).body.balance).toBe(250);
    expect((await one<any>('SELECT count(DISTINCT code)::int AS n FROM reward_redemptions')).n).toBe(2);
  });
  it('refuses when the balance is short and explains by how much', async () => {
    const r = await api().post('/api/rewards/redeem').set(auth(await asOther())).send({ rewardId: (await one<any>(`SELECT id FROM rewards WHERE cost=250`)).id });
    expect(r.status).toBe(402); expect(r.body.error.message).toMatch(/250 more/);
  });
  it('the ledger cannot record a zero or duplicate same-day earn', async () => {
    await expect(query(`INSERT INTO points_ledger (user_id, delta, reason) VALUES ($1, 0, 'x')`, [ids.senior.id])).rejects.toThrow();
    await query(`INSERT INTO points_ledger (user_id, delta, reason, action_key) VALUES ($1, 5, 'a', 'k')`, [ids.senior.id]);
    await expect(query(`INSERT INTO points_ledger (user_id, delta, reason, action_key) VALUES ($1, 5, 'a', 'k')`, [ids.senior.id])).rejects.toThrow(/duplicate/);
  });
});

describe('bookings cannot conflict', () => {
  it('a caregiver cannot be double-booked, even by simultaneous requests', async () => {
    const t = await asSenior(); const o = await asOther(); const cg = ids.cgs[2];
    const body = { caregiverId: cg.id, date: addDays(localNow().date, 5), startTime: '10:00', endTime: '12:00' };
    const rs = await Promise.all([api().post('/api/caregivers/bookings').set(auth(t)).send(body), api().post('/api/caregivers/bookings').set(auth(o)).send(body)]);
    expect(rs.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it('the price is computed on the server from the caregiver rate; a client-sent total is ignored', async () => {
    const t = await asSenior();
    const r = await api().post('/api/caregivers/bookings').set(auth(t)).send({ caregiverId: ids.cgs[2].id, date: addDays(localNow().date, 6), startTime: '09:00', endTime: '12:30', totalBdt: 1, total: 1, price: 1 });
    expect(r.body.booking.totalBdt).toBe(Math.round(3.5 * 2950));
  });
  it('rejects past times, inverted ranges and absurd durations', async () => {
    const t = await asSenior();
    const base = { caregiverId: ids.cgs[0].id, date: addDays(localNow().date, 4) };
    expect((await api().post('/api/caregivers/bookings').set(auth(t)).send({ ...base, startTime: '12:00', endTime: '10:00' })).status).toBe(400);
    expect((await api().post('/api/caregivers/bookings').set(auth(t)).send({ ...base, startTime: '00:00', endTime: '23:00' })).status).toBe(400);
    expect((await api().post('/api/caregivers/bookings').set(auth(t)).send({ ...base, date: addDays(localNow().date, -3), startTime: '10:00', endTime: '11:00' })).status).toBe(400);
  });
  it('a doctor slot can only be booked once (database-enforced)', async () => {
    const t = await asSenior(); const o = await asOther(); const body = { doctorId: ids.docs[1].id, date: tomorrow(), time: '10:00' };
    const rs = await Promise.all([api().post('/api/telehealth/appointments').set(auth(t)).send(body), api().post('/api/telehealth/appointments').set(auth(o)).send(body)]);
    expect(rs.map((r) => r.status).sort()).toEqual([201, 409]);
    const slots = (await api().get(`/api/telehealth/doctors/${ids.docs[1].id}/slots?date=${tomorrow()}`).set(auth(t))).body.slots;
    expect(slots.find((s: any) => s.time === '10:00').available).toBe(false);
  });
  it('a cancelled appointment frees the slot', async () => {
    const t = await asSenior(); const body = { doctorId: ids.docs[1].id, date: tomorrow(), time: '11:00' };
    const a = await api().post('/api/telehealth/appointments').set(auth(t)).send(body);
    await api().post(`/api/telehealth/appointments/${a.body.appointment.id}/cancel`).set(auth(t));
    expect((await api().post('/api/telehealth/appointments').set(auth(await asOther())).send(body)).status).toBe(201);
  });
  it('facility bookings cannot overlap', async () => {
    const t = await asSenior(); const b = { facility: 'Community Room', date: tomorrow(), startTime: '15:00', endTime: '17:00' };
    expect((await api().post('/api/agewell/facility-bookings').set(auth(t)).send(b)).status).toBe(201);
    expect((await api().post('/api/agewell/facility-bookings').set(auth(await asOther())).send({ ...b, startTime: '16:00', endTime: '18:00' })).status).toBe(409);
    expect((await api().post('/api/agewell/facility-bookings').set(auth(await asOther())).send({ ...b, startTime: '17:00', endTime: '18:00' })).status).toBe(201); // back-to-back is fine
  });
  it('event capacity holds under concurrent RSVPs (12 people, 3 seats)', async () => {
    const ev = await one<any>(`INSERT INTO events (title, category, starts_at, ends_at, capacity) VALUES ('Tiny class','Exercise', now() + interval '2 days', now() + interval '2 days 1 hour', 3) RETURNING id`);
    const users = await query<any>(`INSERT INTO users (full_name, email, password_hash, role) SELECT 'P'||g, 'p'||g||'@x.test', 'x', 'senior' FROM generate_series(1,12) g RETURNING id, role`);
    const tokens = users.map((u) => signAccessToken({ sub: u.id, role: u.role }));
    const rs = await Promise.all(tokens.map((t) => api().post(`/api/community/events/${ev.id}/rsvp`).set(auth(t))));
    expect(rs.filter((r) => r.status === 201)).toHaveLength(3);
    expect(rs.filter((r) => r.status === 409)).toHaveLength(9);
    expect((await one<any>('SELECT count(*)::int AS n FROM event_rsvps WHERE event_id=$1', [ev.id])).n).toBe(3);
  });
  it('RSVP twice is harmless', async () => {
    const t = await asOther(); const ev = ids.evs[2];
    expect((await api().post(`/api/community/events/${ev.id}/rsvp`).set(auth(t))).status).toBe(201);
    expect((await api().post(`/api/community/events/${ev.id}/rsvp`).set(auth(t))).status).toBe(200);
  });
});

describe('orders', () => {
  it('prices an order from the menu, never from the client', async () => {
    const t = await asSenior(); const item = ids.menu[0];
    const r = await api().post('/api/nutrition/orders').set(auth(t)).send({ items: [{ menuItemId: item.id, qty: 2 }], address: 'House 5, Road 3, Gulshan', total: 1, totalBdt: 1 });
    expect(r.status).toBe(201); expect(r.body.order.totalBdt).toBe(item.priceBdt * 2);
  });
  it('rejects an empty order, and cancelling once preparation has started', async () => {
    const t = await asSenior();
    expect((await api().post('/api/nutrition/orders').set(auth(t)).send({ items: [], address: 'House 5, Road 3' })).status).toBe(400);
    const o = await api().post('/api/nutrition/orders').set(auth(t)).send({ items: [{ menuItemId: ids.menu[2].id, qty: 1 }], address: 'House 5, Road 3, Gulshan' });
    await query(`UPDATE meal_orders SET status='preparing' WHERE id=$1`, [o.body.order.id]);
    expect((await api().post(`/api/nutrition/orders/${o.body.order.id}/cancel`).set(auth(t))).status).toBe(409);
  });
  it('only delivered orders can be rated', async () => {
    const t = await asSenior(); const active = (await api().get('/api/nutrition/orders').set(auth(t))).body.active[0];
    expect((await api().post(`/api/nutrition/orders/${active.id}/rate`).set(auth(t)).send({ rating: 5 })).status).toBe(409);
  });
});

describe('Care360 records & uploads', () => {
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
  it('accepts a real PDF, then serves it back only to its owner (and audits the download)', async () => {
    const t = await asSenior();
    const up = await api().post('/api/care360/records').set(auth(t)).field('title', 'Blood test').attach('file', pdf, { filename: 'report.pdf', contentType: 'application/pdf' });
    expect(up.status).toBe(201); expect(up.body.record.hasFile).toBe(true);
    const id = up.body.record.id;
    const dl = await api().get(`/api/care360/records/${id}/file`).set(auth(t));
    expect(dl.status).toBe(200); expect(dl.headers['content-type']).toMatch(/pdf/); expect(dl.headers['x-content-type-options']).toBe('nosniff');
    expect((await api().get(`/api/care360/records/${id}/file`).set(auth(await asOther()))).status).toBe(404);
    expect((await one<any>(`SELECT count(*)::int AS n FROM audit_logs WHERE action='record.download'`)).n).toBe(1);
  });
  it('rejects a disguised file (an executable labelled as a PDF) and leaves nothing on disk', async () => {
    const t = await asSenior(); const before = fs.readdirSync('./storage').length;
    const r = await api().post('/api/care360/records').set(auth(t)).field('title', 'Totally a PDF').attach('file', Buffer.from('MZ\x90\x00 not a pdf at all'), { filename: 'virus.pdf', contentType: 'application/pdf' });
    expect(r.status).toBe(415);
    await new Promise((res) => setTimeout(res, 100));
    expect(fs.readdirSync('./storage').length).toBe(before);
  });
  it('rejects disallowed types and oversized files', async () => {
    const t = await asSenior();
    expect((await api().post('/api/care360/records').set(auth(t)).field('title', 'x').attach('file', Buffer.from('<script>'), { filename: 'a.html', contentType: 'text/html' })).status).toBe(415);
    const big = Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(11 * 1024 * 1024)]);
    expect((await api().post('/api/care360/records').set(auth(t)).field('title', 'x').attach('file', big, { filename: 'big.pdf', contentType: 'application/pdf' })).status).toBe(413);
  });
  it('a path-traversal filename cannot influence where the file lands', async () => {
    const t = await asSenior();
    const r = await api().post('/api/care360/records').set(auth(t)).field('title', 'x').attach('file', pdf, { filename: '../../../etc/passwd.pdf', contentType: 'application/pdf' });
    expect(r.status).toBe(201);
    expect((await one<any>('SELECT file_key FROM health_records WHERE id=$1', [r.body.record.id])).fileKey).toMatch(/^[0-9a-f-]{36}\.pdf$/);
  });
  it('refill requests: needs an active prescription with refills, and only one open request', async () => {
    const t = await asSenior(); const rx = await query<any>('SELECT id, medication, refills_remaining FROM prescriptions');
    const withRefills = rx.find((r) => r.refillsRemaining > 0), none = rx.find((r) => r.refillsRemaining === 0);
    expect((await api().post(`/api/care360/prescriptions/${withRefills.id}/refill`).set(auth(t))).status).toBe(201);
    expect((await api().post(`/api/care360/prescriptions/${withRefills.id}/refill`).set(auth(t))).status).toBe(409);
    expect((await api().post(`/api/care360/prescriptions/${none.id}/refill`).set(auth(t))).status).toBe(409);
  });
  it('sharing a record with a doctor is time-limited and audited', async () => {
    const t = await asSenior(); const rec = (await api().get('/api/care360/records').set(auth(t))).body.records[0];
    const r = await api().post(`/api/care360/records/${rec.id}/share`).set(auth(t)).send({ doctorId: ids.docs[0].id, days: 7 });
    expect(r.status).toBe(201);
    expect((await api().post(`/api/care360/records/${rec.id}/share`).set(auth(await asOther())).send({ doctorId: ids.docs[0].id })).status).toBe(404);
    expect((await one<any>(`SELECT count(*)::int AS n FROM audit_logs WHERE action='record.share'`)).n).toBe(1);
  });
});

describe('dashboard & misc', () => {
  it('aggregates real data', async () => {
    const d = (await api().get('/api/dashboard').set(auth(await asSenior()))).body;
    expect(d.metrics.map((m: any) => m.kind).sort()).toEqual(['blood_pressure', 'blood_sugar', 'heart_rate', 'weight']);
    expect(d.medications.total).toBe(4); expect(d.points).toBe(1250); expect(d.upcoming.length).toBeGreaterThan(0);
    expect(d.upcoming.map((u: any) => u.startsAt)).toEqual([...d.upcoming.map((u: any) => u.startsAt)].sort());
  });
  it('group chat: must join to read or post', async () => {
    const t = await asFamily(); const g = (await one<any>(`SELECT id FROM chat_groups LIMIT 1`)).id;
    expect((await api().get(`/api/community/groups/${g}/messages`).set(auth(t))).status).toBe(403);
    expect((await api().post(`/api/community/groups/${g}/messages`).set(auth(t)).send({ body: 'hi' })).status).toBe(403);
    await api().post(`/api/community/groups/${g}/join`).set(auth(t));
    expect((await api().post(`/api/community/groups/${g}/messages`).set(auth(t)).send({ body: 'hi' })).status).toBe(201);
    expect((await api().get(`/api/community/groups/${g}/messages`).set(auth(t))).body.messages.at(-1).mine).toBe(true);
  });
  it('unknown routes and bad JSON return clean errors, not stack traces', async () => {
    expect((await api().get('/api/nope')).body.error.code).toBe('not_found');
    const bad = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"identifier": ');
    expect(bad.status).toBe(400); expect(JSON.stringify(bad.body)).not.toMatch(/at .*\.js|node_modules/);
  });
  it('sends security headers and no X-Powered-By', async () => {
    const r = await api().get('/api/healthz');
    expect(r.headers['x-powered-by']).toBeUndefined(); expect(r.headers['x-content-type-options']).toBe('nosniff'); expect(r.headers['strict-transport-security']).toBeTruthy();
  });
});

describe('medication history', () => {
  it('lists missed doses (due, never logged) alongside taken ones, newest first, and never lists future doses', async () => {
    const t = await asSenior();
    const h = (await api().get('/api/medications/history?days=7').set(auth(t))).body.history as any[];
    expect(h.length).toBeGreaterThan(20);
    expect(h.some((e) => e.status === 'taken')).toBe(true);
    const sorted = [...h].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || a.name.localeCompare(b.name));
    expect(h.map((e) => e.date + e.time)).toEqual(sorted.map((e) => e.date + e.time));
    expect(h.every((e) => e.date <= localNow().date)).toBe(true);
    // Remove one logged dose → it must reappear as 'missed'.
    const yesterday = addDays(localNow().date, -1);
    await query(`DELETE FROM medication_logs WHERE scheduled_date=$1 AND medication_id=$2`, [yesterday, ids.meds[0].id]);
    const after = (await api().get('/api/medications/history?days=3').set(auth(t))).body.history as any[];
    expect(after.find((e) => e.date === yesterday && e.name === 'Lisinopril').status).toBe('missed');
  });
  it('an empty list (no medications) is not an error', async () => {
    expect((await api().get('/api/medications/history').set(auth(await asOther()))).body.history).toEqual([]);
  });
});

describe('telehealth video join link', () => {
  const book = async (t: string, minutesFromNow: number) => {
    const a = await one<any>(`INSERT INTO appointments (senior_id, doctor_id, starts_at, type) VALUES ($1,$2, now() + ($3 || ' minutes')::interval, 'video') RETURNING id`, [ids.senior.id, ids.docs[3].id, String(minutesFromNow)]);
    return a.id as string;
  };
  it('says so plainly when video is not configured (no fake call)', async () => {
    const id = await book(await asSenior(), 5);
    const r = await api().get(`/api/telehealth/appointments/${id}/join`).set(auth(await asSenior()));
    expect(r.status).toBe(501); expect(r.body.error.code).toBe('video_not_configured');
  });
  it('issues an unguessable room link only inside the join window, only to the owner', async () => {
    const cfg = (await import('../src/config.js')).config as any; cfg.VIDEO_BASE_URL = 'https://video.example.org';
    try {
      const t = await asSenior();
      const soon = await book(t, 5), later = await book(t, 120), past = await book(t, -200);
      const ok = await api().get(`/api/telehealth/appointments/${soon}/join`).set(auth(t));
      expect(ok.status).toBe(200); expect(ok.body.url).toMatch(/^https:\/\/video\.example\.org\/eldercare-[A-Za-z0-9_-]{24}$/);
      expect(ok.body.url).not.toContain(soon);                                   // the appointment id is not the room name
      expect((await api().get(`/api/telehealth/appointments/${soon}/join`).set(auth(t))).body.url).toBe(ok.body.url);   // stable per appointment
      expect((await api().get(`/api/telehealth/appointments/${later}/join`).set(auth(t))).body.error.code).toBe('too_early');
      expect((await api().get(`/api/telehealth/appointments/${past}/join`).set(auth(t))).body.error.code).toBe('ended');
      expect((await api().get(`/api/telehealth/appointments/${soon}/join`).set(auth(await asOther()))).status).toBe(404);   // not their appointment
    } finally { cfg.VIDEO_BASE_URL = undefined; }
  });
});
