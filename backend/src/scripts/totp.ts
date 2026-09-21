/**
 * Admin 2FA helper (run on the server):
 *   npm run totp -- <admin-email>            print the current code (dev only) and the enrolment URI
 *   npm run totp -- <admin-email> --enrol    generate a fresh secret and print the otpauth:// URI for an authenticator app
 */
import { config } from '../config.js';
import { one, pool, query } from '../db.js';
import { generateTotpSecret, totpAt } from '../lib/security.js';

const [email, flag] = process.argv.slice(2);
if (!email) { console.error('usage: npm run totp -- <admin-email> [--enrol]'); process.exit(1); }
const u = await one<any>('SELECT id, role, totp_secret FROM users WHERE email=$1', [email.toLowerCase()]);
if (!u || !u.role.endsWith('_admin')) { console.error('No admin account with that email.'); process.exit(1); }

let secret = u.totpSecret as string | null;
if (!secret || flag === '--enrol') {
  secret = generateTotpSecret();
  await query('UPDATE users SET totp_secret=$2, totp_last_step=NULL WHERE id=$1', [u.id, secret]);
  console.log('Enrolled a new 2FA secret.');
}
console.log(`otpauth://totp/ElderCare:${encodeURIComponent(email)}?secret=${secret}&issuer=ElderCare`);
if (!config.isProd) console.log(`Current code (dev only): ${totpAt(secret)}`);
await pool.end();
