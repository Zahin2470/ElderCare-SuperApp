import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { one, query } from '../src/db.js';
import { api, auth, backdateOtps, login, seed, validPw } from './helpers.js';

beforeEach(async () => { await seed({ quiet: true }); });

const register = (o: Record<string, unknown> = {}) =>
  api().post('/api/auth/register').send({ fullName: 'New Person', phone: '01755500001', password: validPw, ...o });

describe('registration', () => {
  it('enforces the password policy on the server', async () => {
    for (const pw of ['short1!', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoNumbers!!', 'NoSpecial123']) {
      const r = await register({ password: pw });
      expect(r.status, pw).toBe(400);
    }
  });
  it('never lets a client self-assign an admin role', async () => {
    expect((await register({ role: 'super_admin' })).status).toBe(400);
    const ok = await register({ role: 'family' });
    expect(ok.body.user.role).toBe('family');
  });
  it('normalises the phone, returns a masked target, and rejects duplicates', async () => {
    const r = await register();
    expect(r.status).toBe(201);
    expect(r.body.user.phone).toBe('+8801755500001');
    expect(r.body.verification.masked).toMatch(/\*/);
    expect(r.body.user.passwordHash).toBeUndefined();
    expect((await register({ phone: '+8801755500001' })).status).toBe(409);
  });
  it('stores only an HMAC of the OTP, never the code', async () => {
    const r = await register();
    const row = await one<any>('SELECT code_hash FROM otp_codes LIMIT 1');
    expect(row.codeHash).not.toContain(r.body.devOtp);
    expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('OTP verification', () => {
  it('completes verification and opens a session', async () => {
    const r = await register();
    const v = await api().post('/api/auth/verify-otp').send({ target: '01755500001', code: r.body.devOtp, purpose: 'verify' });
    expect(v.status).toBe(200);
    expect(v.body.user.isVerified).toBe(true);
    expect(v.body.accessToken).toBeTruthy();
    expect(v.headers['set-cookie'][0]).toMatch(/ec_rt=.*HttpOnly.*SameSite=Lax/i);
  });
  it('burns the code after 3 wrong guesses — even the right code then fails', async () => {
    const r = await register();
    const wrong = r.body.devOtp === '000000' ? '111111' : '000000';
    for (let i = 0; i < 3; i++) expect((await api().post('/api/auth/verify-otp').send({ target: '01755500001', code: wrong, purpose: 'verify' })).status).toBe(400);
    expect((await api().post('/api/auth/verify-otp').send({ target: '01755500001', code: r.body.devOtp, purpose: 'verify' })).status).toBe(400);
  });
  it('a code cannot be used twice', async () => {
    const r = await register();
    const body = { target: '01755500001', code: r.body.devOtp, purpose: 'verify' };
    expect((await api().post('/api/auth/verify-otp').send(body)).status).toBe(200);
    expect((await api().post('/api/auth/verify-otp').send(body)).status).toBe(400);
  });
  it('rejects expired codes', async () => {
    const r = await register();
    await query(`UPDATE otp_codes SET expires_at = now() - interval '1 second'`);
    expect((await api().post('/api/auth/verify-otp').send({ target: '01755500001', code: r.body.devOtp, purpose: 'verify' })).status).toBe(400);
  });
  it('enforces a resend cooldown and an hourly cap', async () => {
    await register();
    expect((await api().post('/api/auth/request-otp').send({ target: '01755500001', purpose: 'verify' })).status).toBe(429);
    for (let i = 0; i < 4; i++) { await backdateOtps(); await api().post('/api/auth/request-otp').send({ target: '01755500001', purpose: 'verify' }); }
    await backdateOtps();
    expect((await api().post('/api/auth/request-otp').send({ target: '01755500001', purpose: 'verify' })).status).toBe(429);
  });
  it('request-otp answers identically for unknown numbers (no account enumeration)', async () => {
    const unknown = await api().post('/api/auth/request-otp').send({ target: '01999999999', purpose: 'login' });
    expect(unknown.status).toBe(200); expect(unknown.body.sent).toBe(true); expect(unknown.body.devOtp).toBeUndefined();
  });
});

describe('password login', () => {
  it('blocks unverified accounts with a machine-readable code', async () => {
    await register();
    const r = await api().post('/api/auth/login').send({ identifier: '01755500001', password: validPw });
    expect(r.status).toBe(403); expect(r.body.error.code).toBe('not_verified');
  });
  it('gives the same error for a wrong password and an unknown user', async () => {
    const a = await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Wrong@12345' });
    const b = await api().post('/api/auth/login').send({ identifier: 'nobody@eldercare.com', password: 'Wrong@12345' });
    expect(a.status).toBe(401); expect(b.status).toBe(401); expect(a.body).toEqual(b.body);
  });
  it('locks the account after 5 failures — the correct password is then refused too', async () => {
    for (let i = 0; i < 5; i++) await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Wrong@12345' });
    const r = await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Demo@12345' });
    expect(r.status).toBe(429);
  });
  it('admin accounts cannot sign in here (they must pass 2FA)', async () => {
    expect((await api().post('/api/auth/login').send({ identifier: 'super@eldercare.com', password: 'Admin@12345' })).status).toBe(401);
  });
  it('suspended users are refused, and their live token dies immediately', async () => {
    const { token } = await login('demo@eldercare.com');
    await query(`UPDATE users SET status='suspended' WHERE email='demo@eldercare.com'`);
    expect((await api().get('/api/auth/me').set(auth(token))).status).toBe(401);
    expect((await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Demo@12345' })).status).toBe(401);
  });
});

describe('refresh-token rotation', () => {
  it('rotates on every refresh', async () => {
    const { cookies } = await login('demo@eldercare.com');
    const r = await api().post('/api/auth/refresh').set('Cookie', cookies);
    expect(r.status).toBe(200);
    expect(r.headers['set-cookie'][0].split(';')[0]).not.toBe(cookies[0].split(';')[0]);
  });
  it('a replayed (stolen) token revokes the whole session family', async () => {
    const { cookies } = await login('demo@eldercare.com');
    const r1 = await api().post('/api/auth/refresh').set('Cookie', cookies);                // legitimate rotation
    await query(`UPDATE refresh_tokens SET rotated_at = now() - interval '1 minute' WHERE rotated_at IS NOT NULL`); // outside the grace window
    const replay = await api().post('/api/auth/refresh').set('Cookie', cookies);            // attacker replays the old token
    expect(replay.status).toBe(401);
    const victim = await api().post('/api/auth/refresh').set('Cookie', r1.headers['set-cookie']);   // the legitimate newer token is now dead too
    expect(victim.status).toBe(401);
    expect((await one<any>(`SELECT count(*)::int AS n FROM audit_logs WHERE action='auth.refresh_reuse_detected'`)).n).toBe(1);
  });
  it('tolerates two tabs refreshing at the same instant', async () => {
    const { cookies } = await login('demo@eldercare.com');
    const [a, b] = await Promise.all([api().post('/api/auth/refresh').set('Cookie', cookies), api().post('/api/auth/refresh').set('Cookie', cookies)]);
    expect([a.status, b.status]).toEqual([200, 200]);
  });
  it('rejects a refresh coming from a foreign origin (CSRF guard)', async () => {
    const { cookies } = await login('demo@eldercare.com');
    expect((await api().post('/api/auth/refresh').set('Cookie', cookies).set('Origin', 'https://evil.example')).status).toBe(403);
  });
  it('logout kills the session', async () => {
    const { cookies } = await login('demo@eldercare.com');
    await api().post('/api/auth/logout').set('Cookie', cookies);
    expect((await api().post('/api/auth/refresh').set('Cookie', cookies)).status).toBe(401);
  });
});

describe('password reset', () => {
  it('answers the same for unknown accounts', async () => {
    const r = await api().post('/api/auth/forgot-password').send({ identifier: 'ghost@eldercare.com' });
    expect(r.status).toBe(200); expect(r.body.devOtp).toBeUndefined();
  });
  it('resets the password, and signs the user out everywhere', async () => {
    const { cookies } = await login('demo@eldercare.com');
    const f = await api().post('/api/auth/forgot-password').send({ identifier: 'demo@eldercare.com' });
    expect(f.body.devOtp).toMatch(/^\d{6}$/);
    expect((await api().post('/api/auth/reset-password').send({ identifier: 'demo@eldercare.com', code: f.body.devOtp, newPassword: 'weak' })).status).toBe(400);
    expect((await api().post('/api/auth/reset-password').send({ identifier: 'demo@eldercare.com', code: f.body.devOtp, newPassword: 'Brand@New99' })).status).toBe(200);
    expect((await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Demo@12345' })).status).toBe(401);
    expect((await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Brand@New99' })).status).toBe(200);
    expect((await api().post('/api/auth/refresh').set('Cookie', cookies)).status).toBe(401);
  });
});

describe('refresh grace window is not a back door', () => {
  it('does not apply after logout, even within seconds', async () => {
    const { cookies } = await login('demo@eldercare.com');
    await api().post('/api/auth/logout').set('Cookie', cookies);
    const r = await api().post('/api/auth/refresh').set('Cookie', cookies);   // immediately, well inside 10 s
    expect(r.status).toBe(401);
  });
  it('does not apply after the family is terminated following a rotation', async () => {
    const { cookies } = await login('demo@eldercare.com');
    const rotated = await api().post('/api/auth/refresh').set('Cookie', cookies);
    await api().post('/api/auth/logout').set('Cookie', rotated.headers['set-cookie']);      // user logs out
    expect((await api().post('/api/auth/refresh').set('Cookie', cookies)).status).toBe(401); // stale token replayed within 10 s
  });
});
