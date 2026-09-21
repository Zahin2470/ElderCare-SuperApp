import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { adminLogin, api, asSenior, auth, seed } from './helpers.js';

/**
 * Every API call the React app makes must hit a route that exists.
 * The frontend source is scanned for get/post/patch/del/upload calls; each path is requested against the real
 * app and must NOT return the router's "No such endpoint" 404. This catches typos and drift between the two halves.
 */
const SRC = path.resolve(__dirname, '../../frontend/src');
const UUID = '00000000-0000-4000-8000-000000000000';

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [path.join(dir, e.name)] : []));
}

type Call = { method: string; url: string; file: string };
function extractCalls(): Call[] {
  const calls: Call[] = [];
  const verbs: Record<string, string> = { get: 'GET', post: 'POST', patch: 'PATCH', del: 'DELETE', upload: 'POST' };
  const re = /\b(get|post|patch|del|upload)\s*(?:<[^()]*?>)?\s*\(\s*(['"`])(\/[^'"`]*)\2/g;
  for (const file of walk(SRC)) {
    if (file.endsWith('lib/api.ts')) continue;
    const s = fs.readFileSync(file, 'utf8');
    for (const m of s.matchAll(re)) calls.push({ method: verbs[m[1]], url: m[3], file: path.relative(SRC, file) });
    for (const m of s.matchAll(/api(?:<[^()]*?>)?\(\s*'(GET|POST|PATCH|DELETE)'\s*,\s*(['"`])(\/[^'"`]*)\2/g)) calls.push({ method: m[1], url: m[3], file: path.relative(SRC, file) });
  }
  return calls;
}

/** `${action}` segments expand to every real value; every other `${…}` becomes a UUID. */
function expand(url: string): string[] {
  if (/\$\{action\}/.test(url)) {
    const actions = url.startsWith('/family') ? ['accept', 'reject'] : ['take', 'skip'];
    return actions.flatMap((a) => expand(url.replace('${action}', a)));
  }
  return [url.replace(/\$\{[^}]+\}/g, UUID).split('?')[0]];
}

describe('frontend ↔ backend route contract', () => {
  let member = '', admin = '';
  const calls = extractCalls();
  beforeAll(async () => { await seed({ quiet: true }); member = await asSenior(); admin = await adminLogin(); });

  it('finds the API calls (guards against the scanner silently matching nothing)', () => {
    expect(calls.length).toBeGreaterThan(60);
    const files = new Set(calls.map((c) => c.file));
    for (const f of ['components/SilverBox.tsx', 'components/ElderLink.tsx', 'components/TeleHealth.tsx', 'components/RewardsLoyalty.tsx', 'components/ai/CareAssistant.tsx', 'components/admin/AdminLogin.tsx', 'lib/queries.ts'])
      expect([...files].some((x) => x.replace(/\\/g, '/') === f), f).toBe(true);
  });

  it('every path the app calls exists on the server', async () => {
    const missing: string[] = [];
    const seen = new Set<string>();
    for (const c of calls) for (const url of expand(c.url)) {
      const key = `${c.method} ${url}`;
      if (seen.has(key)) continue; seen.add(key);
      const token = url.startsWith('/admin/') && !url.startsWith('/admin/auth') ? admin : member;
      const req = ({ GET: api().get, POST: api().post, PATCH: api().patch, DELETE: api().delete } as any)[c.method];
      const r = await (c.method === 'GET' || c.method === 'DELETE' ? api()[c.method.toLowerCase() as 'get' | 'delete'](`/api${url}`) : api()[c.method.toLowerCase() as 'post' | 'patch'](`/api${url}`).send({})).set(auth(token));
      void req;
      if (r.status === 404 && r.body?.error?.message === 'No such endpoint') missing.push(`${key}   (used in ${c.file})`);
    }
    expect(missing, `Frontend calls endpoints the backend does not have:\n${missing.join('\n')}`).toEqual([]);
    expect(seen.size).toBeGreaterThan(50);
  });
});
