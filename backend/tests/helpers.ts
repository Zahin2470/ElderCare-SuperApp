import request from 'supertest';
import { createApp } from '../src/app.js';
import { query } from '../src/db.js';
import { seed, DEMO_PASSWORD, ADMIN_PASSWORD, DEV_TOTP_SECRET } from '../src/seed.js';
import { totpAt } from '../src/lib/security.js';

export const app = createApp();
export const api = () => request(app);
export { seed, DEMO_PASSWORD, ADMIN_PASSWORD, DEV_TOTP_SECRET };

export async function login(identifier: string, password = DEMO_PASSWORD) {
  const r = await api().post('/api/auth/login').send({ identifier, password });
  if (r.status !== 200) throw new Error(`login failed ${r.status} ${JSON.stringify(r.body)}`);
  return { token: r.body.accessToken as string, user: r.body.user, cookies: r.headers['set-cookie'] as unknown as string[] };
}
export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
export const asSenior = () => login('demo@eldercare.com').then((s) => s.token);
export const asFamily = () => login('family@eldercare.com').then((s) => s.token);
export const asOther = () => login('other@eldercare.com').then((s) => s.token);

/** Full admin sign-in: password step, then a fresh TOTP code. `stepOffset` lets tests avoid replay rejection. */
export async function adminLogin(email = 'super@eldercare.com', stepOffset = 0) {
  const a = await api().post('/api/admin/auth/login').send({ email, password: ADMIN_PASSWORD });
  if (a.status !== 200) throw new Error(`admin step 1 failed ${a.status}`);
  const code = totpAt(DEV_TOTP_SECRET, Date.now() + stepOffset * 30_000);
  const b = await api().post('/api/admin/auth/verify-2fa').send({ challenge: a.body.challenge, code });
  if (b.status !== 200) throw new Error(`admin step 2 failed ${b.status} ${JSON.stringify(b.body)}`);
  return b.body.accessToken as string;
}
export const backdateOtps = () => query(`UPDATE otp_codes SET created_at = created_at - interval '2 minutes'`);
export const validPw = 'Str0ng!Pass';
