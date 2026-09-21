import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { hash, verify } from '@node-rs/argon2';
import { config } from '../config.js';

// ───────── passwords (Argon2id, library defaults follow OWASP minimums) ─────────
export const hashPassword = (pw: string) => hash(pw);
export async function verifyPassword(stored: string, pw: string): Promise<boolean> {
  try { return await verify(stored, pw); } catch { return false; }
}
// Verified against when the account does not exist, so "unknown user" and "wrong password"
// take the same time and cannot be told apart by timing.
export const DUMMY_HASH = await hash('dummy-password-for-timing-equalisation');

// ───────── generic ─────────
export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// ───────── JWT access tokens ─────────
const ISS = 'eldercare-api';
export interface AccessClaims { sub: string; role: string }

export const signAccessToken = (c: AccessClaims) =>
  jwt.sign({ role: c.role }, config.JWT_ACCESS_SECRET, { subject: c.sub, issuer: ISS, audience: 'access', expiresIn: config.ACCESS_TOKEN_TTL_SECONDS, algorithm: 'HS256' });

export function verifyAccessToken(token: string): AccessClaims {
  const p = jwt.verify(token, config.JWT_ACCESS_SECRET, { issuer: ISS, audience: 'access', algorithms: ['HS256'] }) as jwt.JwtPayload;
  return { sub: String(p.sub), role: String(p.role) };
}

/** Short-lived token proving the password step of an admin login succeeded; useless without a valid TOTP code. */
export const signAdminChallenge = (userId: string) =>
  jwt.sign({}, config.JWT_ACCESS_SECRET, { subject: userId, issuer: ISS, audience: 'admin-2fa', expiresIn: 300, algorithm: 'HS256' });
export function verifyAdminChallenge(token: string): string {
  const p = jwt.verify(token, config.JWT_ACCESS_SECRET, { issuer: ISS, audience: 'admin-2fa', algorithms: ['HS256'] }) as jwt.JwtPayload;
  return String(p.sub);
}

// ───────── OTP ─────────
export const generateOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
export const hashOtp = (target: string, code: string) =>
  crypto.createHmac('sha256', config.OTP_HMAC_SECRET).update(`${target}:${code}`).digest('hex');

// ───────── TOTP (RFC 6238, SHA-1, 6 digits, 30 s) for admin 2FA ─────────
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
export function base32Decode(s: string): Buffer {
  let bits = 0, value = 0; const out: number[] = [];
  for (const ch of s.replace(/=+$/, '').toUpperCase()) {
    const idx = B32.indexOf(ch); if (idx < 0) continue;
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
export const generateTotpSecret = () => base32Encode(crypto.randomBytes(20));
export function totpAt(secret: string, timeMs = Date.now(), step = 30): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(timeMs / 1000 / step)));
  const h = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const off = h[h.length - 1] & 0xf;
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % 1_000_000).padStart(6, '0');
}
/** Returns the matching 30 s window number (so the caller can refuse replays), or null. Accepts ±1 window of clock skew. */
export function totpMatch(secret: string, code: string, timeMs = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  for (const w of [-1, 0, 1]) {
    const t = timeMs + w * 30_000;
    if (safeEqual(totpAt(secret, t), code)) return Math.floor(t / 1000 / 30);
  }
  return null;
}
