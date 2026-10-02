import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * These tests exercise the real Redis-backed store (not a mock) against the local Redis started
 * for this suite, plus a genuinely unreachable address for the fail-open path. Each scenario
 * resets the module registry and re-sets REDIS_URL before importing, because config.ts reads
 * process.env once at import time.
 */
async function freshLimiter(prefix: string, limit: number) {
  vi.resetModules();
  const { sharedStore } = await import('../src/lib/rateLimitStore.js');
  const rateLimitMod = (await import('express-rate-limit')).default;
  return rateLimitMod({
    windowMs: 60_000, limit, standardHeaders: false, legacyHeaders: false,
    keyGenerator: () => 'fixed-client', // every request in a test is "the same client"
    store: sharedStore(prefix),
    handler: (_req, res) => res.status(429).json({ limited: true }),
  });
}

function appWith(limiter: express.RequestHandler) {
  const app = express();
  app.get('/x', limiter, (_req, res) => res.json({ ok: true }));
  return app;
}

const REAL_REDIS = 'redis://127.0.0.1:6379';
const originalEnv = process.env.REDIS_URL;
afterEach(() => { process.env.REDIS_URL = originalEnv; vi.resetModules(); });

describe('rate limiting without Redis (default, single-instance)', () => {
  it('two limiter instances do NOT share counters (each is its own in-memory store)', async () => {
    delete process.env.REDIS_URL;
    const prefix = `nolimit-${Date.now()}`;
    const appA = appWith(await freshLimiter(prefix, 1));
    const appB = appWith(await freshLimiter(prefix, 1));
    expect((await request(appA).get('/x')).status).toBe(200);
    expect((await request(appA).get('/x')).status).toBe(429); // A's own limit is now hit
    expect((await request(appB).get('/x')).status).toBe(200); // B never heard about A's request
  });
});

describe('rate limiting with Redis (simulating multiple server instances)', () => {
  beforeEach(() => { process.env.REDIS_URL = REAL_REDIS; });

  it('shares the counter across independent limiter instances via the real Redis server', async () => {
    const prefix = `shared-${Date.now()}-${Math.random()}`;
    const appA = appWith(await freshLimiter(prefix, 2));
    const appB = appWith(await freshLimiter(prefix, 2)); // a second "process" pointed at the same Redis + prefix

    expect((await request(appA).get('/x')).status).toBe(200); // hit 1, via instance A
    expect((await request(appB).get('/x')).status).toBe(200); // hit 2, via instance B — same shared counter
    expect((await request(appA).get('/x')).status).toBe(429); // instance A sees B's hit and refuses
    expect((await request(appB).get('/x')).status).toBe(429); // instance B is equally blocked
  });

  it('different prefixes do not collide with each other', async () => {
    const a = appWith(await freshLimiter(`iso-a-${Date.now()}`, 1));
    const b = appWith(await freshLimiter(`iso-b-${Date.now()}`, 1));
    expect((await request(a).get('/x')).status).toBe(200);
    expect((await request(a).get('/x')).status).toBe(429);
    expect((await request(b).get('/x')).status).toBe(200); // unaffected by "a"'s limit
  });
});

describe('rate limiting fails OPEN when Redis is unreachable', () => {
  it('requests are still served (never 500, never wrongly blocked) when Redis cannot be reached', async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:1'; // nothing listens on port 1 → connection refused
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = appWith(await freshLimiter(`down-${Date.now()}`, 1)); // limit of 1, but Redis is down
    for (let i = 0; i < 4; i++) {
      const r = await request(app).get('/x');
      expect(r.status).toBe(200); // fails open every time — a Redis outage never becomes an API outage
    }
    expect(errSpy).toHaveBeenCalled(); // the failure was logged, not silently swallowed
    errSpy.mockRestore();
  }, 15_000);
});
