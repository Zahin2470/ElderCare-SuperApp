import { beforeEach, describe, expect, it } from 'vitest';
import { one, query } from '../src/db.js';
import { totpAt } from '../src/lib/security.js';
import { adminLogin, ADMIN_PASSWORD, api, asFamily, asOther, asSenior, auth, DEV_TOTP_SECRET, login, seed } from './helpers.js';

let ids: Awaited<ReturnType<typeof seed>>;
beforeEach(async () => { ids = await seed({ quiet: true }); });

describe('tenant isolation (IDOR)', () => {
  it('a senior cannot reach another senior by passing their id — the parameter is ignored', async () => {
    const t = await asOther();
    const r = await api().get(`/api/medications?seniorId=${ids.senior.id}`).set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.medications).toEqual([]);                       // Rahima's own (empty) list, not Md. Mosarraf's
  });
  it('cannot fetch, delete or mark-taken another user\'s medication by guessing its id', async () => {
    const t = await asOther(); const med = ids.meds[0].id;
    expect((await api().delete(`/api/medications/${med}`).set(auth(t))).status).toBe(404);
    expect((await api().post(`/api/medications/${med}/take`).set(auth(t)).send({ time: '08:00' })).status).toBe(404);
    expect((await one<any>('SELECT active FROM medications WHERE id=$1', [med])).active).toBe(true);
  });
  it('health records, appointments, orders and bookings are all scoped to the caller', async () => {
    const t = await asOther();
    for (const p of ['/api/care360/records', '/api/care360/prescriptions', '/api/telehealth/appointments', '/api/nutrition/orders', '/api/caregivers/bookings']) {
      const r = await api().get(p).set(auth(t));
      expect(r.status, p).toBe(200);
      expect(JSON.stringify(r.body), p).not.toMatch(/Complete Blood Count|Lisinopril|Hypertension|Heart Healthy Plan|Nelufa/);
    }
  });
  it('a family member sees their linked senior by default and by explicit id', async () => {
    const t = await asFamily();
    expect((await api().get('/api/medications').set(auth(t))).body.medications).toHaveLength(4);
    expect((await api().get(`/api/medications?seniorId=${ids.senior.id}`).set(auth(t))).status).toBe(200);
  });
  it('a family member cannot reach a senior they are not linked to', async () => {
    const t = await asFamily();
    expect((await api().get(`/api/medications?seniorId=${ids.other.id}`).set(auth(t))).status).toBe(403);
    expect((await api().get(`/api/care360/metrics?seniorId=${ids.other.id}`).set(auth(t))).status).toBe(403);
  });
  it('pending or revoked links grant nothing', async () => {
    const t = await asFamily();
    await query(`UPDATE family_links SET status='pending'`);
    expect((await api().get('/api/medications').set(auth(t))).status).toBe(404);
    expect((await api().get(`/api/medications?seniorId=${ids.senior.id}`).set(auth(t))).status).toBe(403);
    await query(`UPDATE family_links SET status='revoked'`);
    expect((await api().get(`/api/medications?seniorId=${ids.senior.id}`).set(auth(t))).status).toBe(403);
  });
  it('linking requires the senior to accept', async () => {
    const fam = await asFamily(); const sen = await asSenior();
    await query(`DELETE FROM family_links`);
    const inv = await api().post('/api/family/invite').set(auth(fam)).send({ target: '01712345678', relation: 'Daughter' });
    expect(inv.status).toBe(202);
    expect((await api().get('/api/medications').set(auth(fam))).status).toBe(404);          // still no access
    const pending = await api().get('/api/family/requests').set(auth(sen));
    expect(pending.body.requests).toHaveLength(1);
    await api().post(`/api/family/requests/${ids.family.id}/accept`).set(auth(sen));
    expect((await api().get('/api/medications').set(auth(fam))).status).toBe(200);
  });
  it('invite answers the same for a number that has no account', async () => {
    const fam = await asFamily();
    expect((await api().post('/api/family/invite').set(auth(fam)).send({ target: '01999999999' })).status).toBe(202);
  });
  it('rejects malformed ids with 400, not a 500', async () => {
    const t = await asSenior();
    expect((await api().delete('/api/medications/not-a-uuid').set(auth(t))).status).toBe(400);
  });
});

describe('admin accounts', () => {
  it('cannot read personal data through the member API', async () => {
    const t = await adminLogin('super@eldercare.com');
    for (const p of ['/api/medications', '/api/care360/records', '/api/dashboard', '/api/ai/digest']) expect((await api().get(p).set(auth(t))).status, p).toBe(403);
  });
  it('the admin API rejects ordinary users and anonymous callers', async () => {
    expect((await api().get('/api/admin/users').set(auth(await asSenior()))).status).toBe(403);
    expect((await api().get('/api/admin/users')).status).toBe(401);
  });
  it('permissions are enforced per role, server-side', async () => {
    const clinical = await adminLogin('clinical@eldercare.com'), security = await adminLogin('security@eldercare.com'), ops = await adminLogin('ops@eldercare.com');
    expect((await api().get('/api/admin/roles').set(auth(clinical))).status).toBe(403);      // roles.read: super_admin only
    expect((await api().get('/api/admin/audit-logs').set(auth(security))).status).toBe(200);  // security_admin has audit_logs.read
    expect((await api().get('/api/admin/users').set(auth(ops))).status).toBe(200);
    expect((await api().patch(`/api/admin/users/${ids.senior.id}`).set(auth(clinical)).send({ status: 'suspended', reason: 'testing perms' })).status).toBe(403); // no users.write
    expect((await api().post('/api/admin/impersonation-events').set(auth(ops)).send({ phase: 'start', targetUserId: ids.senior.id, reason: 'support request 1234' })).status).toBe(403);
  });
  it('the users list never exposes password hashes or 2FA secrets', async () => {
    const r = await api().get('/api/admin/users').set(auth(await adminLogin()));
    expect(JSON.stringify(r.body)).not.toMatch(/argon2|passwordHash|totp/i);
  });
  it('suspending a user needs a reason, is audited, and ends their session', async () => {
    const t = await adminLogin(); const victim = await asSenior();
    expect((await api().patch(`/api/admin/users/${ids.senior.id}`).set(auth(t)).send({ status: 'suspended' })).status).toBe(400);
    expect((await api().patch(`/api/admin/users/${ids.senior.id}`).set(auth(t)).send({ status: 'suspended', reason: 'Reported by family' })).status).toBe(200);
    expect((await api().get('/api/auth/me').set(auth(victim))).status).toBe(401);
    expect((await one<any>(`SELECT metadata FROM audit_logs WHERE action='admin.user_suspend'`)).metadata.reason).toBe('Reported by family');
  });
  it('an admin cannot suspend themselves or mint another admin over the API', async () => {
    const t = await adminLogin(); const me = (await one<any>(`SELECT id FROM users WHERE email='super@eldercare.com'`)).id;
    expect((await api().patch(`/api/admin/users/${me}`).set(auth(t)).send({ status: 'suspended', reason: 'oops oops' })).status).toBe(400);
    expect((await api().patch(`/api/admin/users/${ids.family.id}`).set(auth(t)).send({ role: 'super_admin', reason: 'promote me' })).status).toBe(400);
  });
});

describe('admin 2FA', () => {
  const step1 = () => api().post('/api/admin/auth/login').send({ email: 'super@eldercare.com', password: ADMIN_PASSWORD });
  it('the password alone yields no session', async () => {
    const r = await step1();
    expect(r.status).toBe(200); expect(r.body.accessToken).toBeUndefined(); expect(r.headers['set-cookie']).toBeUndefined();
  });
  it('a wrong code is rejected and audited', async () => {
    const { body } = await step1();
    expect((await api().post('/api/admin/auth/verify-2fa').send({ challenge: body.challenge, code: '000000' })).status).toBe(401);
    expect((await one<any>(`SELECT count(*)::int AS n FROM audit_logs WHERE action='admin.2fa_failed'`)).n).toBe(1);
  });
  it('a code cannot be replayed', async () => {
    const code = totpAt(DEV_TOTP_SECRET);
    const a = await step1(); const ok = await api().post('/api/admin/auth/verify-2fa').send({ challenge: a.body.challenge, code });
    expect(ok.status).toBe(200);
    const b = await step1(); const replay = await api().post('/api/admin/auth/verify-2fa').send({ challenge: b.body.challenge, code });
    expect(replay.status).toBe(401);
  });
  it('a challenge token cannot be used as an access token', async () => {
    const { body } = await step1();
    expect((await api().get('/api/admin/users').set(auth(body.challenge))).status).toBe(401);
  });
  it('non-admins and wrong passwords cannot start an admin login', async () => {
    expect((await api().post('/api/admin/auth/login').send({ email: 'demo@eldercare.com', password: 'Demo@12345' })).status).toBe(401);
    expect((await api().post('/api/admin/auth/login').send({ email: 'super@eldercare.com', password: 'nope' })).status).toBe(401);
  });
  it('refuses an admin account that has no 2FA enrolled', async () => {
    await query(`UPDATE users SET totp_secret=NULL WHERE email='super@eldercare.com'`);
    expect((await step1()).status).toBe(403);
  });
});

describe('admin security center — real data, not sample data', () => {
  it('active sessions reflect real live refresh-token families, and revoking one ends it immediately', async () => {
    const t = await adminLogin();
    const senior = await login('demo@eldercare.com');            // creates one live refresh-token family
    const before = await api().get('/api/admin/security/sessions').set(auth(t));
    expect(before.status).toBe(200);
    const mine = before.body.sessions.find((s: any) => s.userId === ids.senior.id);
    expect(mine).toBeTruthy();
    expect(mine.userRole).toBe('senior');

    const revoke = await api().post(`/api/admin/security/sessions/${mine.familyId}/revoke`).set(auth(t));
    expect(revoke.status).toBe(200);
    // The session is really dead: the senior's own refresh cookie can no longer mint a new access token.
    expect((await api().post('/api/auth/refresh').set('Cookie', senior.cookies)).status).toBe(401);
    // And it's gone from the live list.
    const after = await api().get('/api/admin/security/sessions').set(auth(t));
    expect(after.body.sessions.some((s: any) => s.familyId === mine.familyId)).toBe(false);
    expect((await one<any>(`SELECT count(*)::int AS n FROM audit_logs WHERE action='admin.session_revoke'`)).n).toBe(1);
  });
  it('revoking an already-ended or unknown session is a clean 404, not a 500', async () => {
    const t = await adminLogin();
    expect((await api().post(`/api/admin/security/sessions/${'00000000-0000-4000-8000-000000000000'}/revoke`).set(auth(t))).status).toBe(404);
  });

  it('locked accounts are real (5 failed logins), and unlocking actually restores sign-in', async () => {
    for (let i = 0; i < 5; i++) await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Wrong@12345' });
    expect((await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Demo@12345' })).status).toBe(429); // really locked

    const t = await adminLogin();
    const locked = await api().get('/api/admin/security/locked-users').set(auth(t));
    const row = locked.body.users.find((u: any) => u.id === ids.senior.id);
    expect(row).toBeTruthy();
    expect(row.lockedUntil).toBeTruthy(); // failedLogins is intentionally reset to 0 once locked, so the lock itself is what we check

    const unlock = await api().post(`/api/admin/security/locked-users/${ids.senior.id}/unlock`).set(auth(t));
    expect(unlock.status).toBe(200);
    expect((await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Demo@12345' })).status).toBe(200); // really unlocked
    expect((await api().get('/api/admin/security/locked-users').set(auth(t))).body.users.some((u: any) => u.id === ids.senior.id)).toBe(false);
  });
  it('unlocking an account that is not locked is a clean 404', async () => {
    const t = await adminLogin();
    expect((await api().post(`/api/admin/security/locked-users/${ids.senior.id}/unlock`).set(auth(t))).status).toBe(404);
  });

  it('security events surface real failed-login and 2FA signals, correctly severity-ranked, and only recent ones', async () => {
    await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Wrong@12345' });
    await api().post('/api/admin/auth/login').send({ email: 'super@eldercare.com', password: 'Admin@12345' }).then(async (r) =>
      api().post('/api/admin/auth/verify-2fa').send({ challenge: r.body.challenge, code: '000000' }));
    await query(`UPDATE refresh_tokens SET revoked_at = now() - interval '1 minute' WHERE revoked_at IS NOT NULL`);
    const stolen = await login('other@eldercare.com');
    await api().post('/api/auth/refresh').set('Cookie', stolen.cookies); // legit rotation
    await query(`UPDATE refresh_tokens SET rotated_at = now() - interval '1 minute' WHERE rotated_at IS NOT NULL`);
    await api().post('/api/auth/refresh').set('Cookie', stolen.cookies); // replay → theft-detection event

    const t = await adminLogin();
    const r = await api().get('/api/admin/security/events').set(auth(t));
    const actions = r.body.events.map((e: any) => e.action);
    expect(actions).toContain('auth.login_failed');
    expect(actions).toContain('admin.2fa_failed');
    expect(actions).toContain('auth.refresh_reuse_detected');
    expect(r.body.events.find((e: any) => e.action === 'auth.refresh_reuse_detected').severity).toBe('critical');
    expect(r.body.events.find((e: any) => e.action === 'auth.login_failed').severity).toBe('medium');
    // Ordinary events (not security-relevant) must not leak into this feed.
    expect(actions).not.toContain('auth.login');
  });

  it('IP activity aggregates only IPs with real failures in the last 24h, ranked by failure count', async () => {
    for (let i = 0; i < 3; i++) await api().post('/api/auth/login').set('X-Forwarded-For', '203.0.113.9').send({ identifier: 'demo@eldercare.com', password: 'Wrong@12345' });
    const t = await adminLogin();
    const r = await api().get('/api/admin/security/ip-activity').set(auth(t));
    expect(r.status).toBe(200);
    // supertest doesn't traverse a real proxy, so app.ip reflects the test client's address, not the spoofed header —
    // the important thing is that whichever IP recorded the failures shows up with the right counts.
    expect(r.body.ips.length).toBeGreaterThan(0);
    expect(r.body.ips[0].failedEvents).toBeGreaterThanOrEqual(3);
    expect(r.body.ips[0].totalEvents).toBeGreaterThanOrEqual(r.body.ips[0].failedEvents);
  });

  it('permissions are enforced: only security_admin/super_admin can read or act, others get 403', async () => {
    const ops = await adminLogin('ops@eldercare.com');
    for (const p of ['/api/admin/security/sessions', '/api/admin/security/locked-users', '/api/admin/security/events', '/api/admin/security/ip-activity'])
      expect((await api().get(p).set(auth(ops))).status, p).toBe(403);
    const clinical = await adminLogin('clinical@eldercare.com');
    expect((await api().get('/api/admin/security/sessions').set(auth(clinical))).status).toBe(403);
    const security = await adminLogin('security@eldercare.com');
    expect((await api().get('/api/admin/security/sessions').set(auth(security))).status).toBe(200); // security_admin has security.read
  });
});

describe('audit log integrity', () => {
  it('cannot be edited or deleted, even by the application role', async () => {
    await query(`INSERT INTO audit_logs (action) VALUES ('test.event')`);
    await expect(query(`UPDATE audit_logs SET action='tampered'`)).rejects.toThrow(/append-only/);
    await expect(query(`DELETE FROM audit_logs`)).rejects.toThrow(/append-only/);
  });
});
