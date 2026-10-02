import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pool } from '../src/db.js';
import { ErrorReporter, getReporter, reportFatalAndExit, setReporter } from '../src/lib/monitoring.js';
import { api, seed } from './helpers.js';

class FakeReporter implements ErrorReporter {
  exceptions: { err: unknown; context?: Record<string, unknown> }[] = [];
  flushed = false;
  captureException(err: unknown, context?: Record<string, unknown>) { this.exceptions.push({ err, context }); }
  async flush() { this.flushed = true; }
}

beforeEach(async () => { await seed({ quiet: true }); });

describe('error reporter — dependency injection', () => {
  it('defaults to a no-op that never throws, with nothing to inspect', () => {
    const r = getReporter();
    expect(() => r.captureException(new Error('x'))).not.toThrow();
  });
  it('setReporter swaps in a fake that records what it was called with', () => {
    const fake = new FakeReporter();
    setReporter(fake);
    getReporter().captureException(new Error('boom'), { path: '/x' });
    expect(fake.exceptions).toHaveLength(1);
    expect(fake.exceptions[0].context).toEqual({ path: '/x' });
  });
});

describe('the API only reports genuinely UNEXPECTED errors, not routine 4xx failures', () => {
  it('an unexpected error thrown inside a route handler is reported with safe, non-sensitive context', async () => {
    const fake = new FakeReporter();
    setReporter(fake);
    const spy = vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('simulated unexpected database failure'));

    const r = await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'Demo@12345' });

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe('internal');
    expect(r.body.error.requestId).toBeTruthy();
    expect(fake.exceptions).toHaveLength(1);
    expect((fake.exceptions[0].err as Error).message).toBe('simulated unexpected database failure');
    expect(fake.exceptions[0].context).toMatchObject({ method: 'POST', path: '/api/auth/login' });
    // Never the password, the identifier, or anything else from the request body — only routing metadata.
    expect(JSON.stringify(fake.exceptions[0].context)).not.toMatch(/Demo@12345|demo@eldercare/);
    spy.mockRestore();
  });

  it('an ordinary wrong-password 401 is normal traffic, not an incident — the reporter is never called', async () => {
    const fake = new FakeReporter();
    setReporter(fake);
    const r = await api().post('/api/auth/login').send({ identifier: 'demo@eldercare.com', password: 'WrongPassword1!' });
    expect(r.status).toBe(401);
    expect(fake.exceptions).toHaveLength(0);
  });

  it('a validation error (400) is also routine — not reported', async () => {
    const fake = new FakeReporter();
    setReporter(fake);
    expect((await api().post('/api/auth/register').send({ fullName: '' })).status).toBe(400);
    expect(fake.exceptions).toHaveLength(0);
  });
});

describe('reportFatalAndExit — the last line of defence before a crash', () => {
  it('reports the error, flushes, and exits — without hanging even if flush never resolves', async () => {
    vi.useFakeTimers();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const fake = new FakeReporter();
    fake.flush = () => new Promise(() => undefined); // a broken/unresponsive reporter — must never hang the process
    setReporter(fake);

    reportFatalAndExit('uncaughtException', new Error('the process is about to go down'));
    expect(fake.exceptions).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(2100); // past the 2s bounded wait
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    vi.useRealTimers();
  });

  it('exits promptly (does not wait the full timeout) once a normal flush resolves', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const fake = new FakeReporter();
    setReporter(fake);
    reportFatalAndExit('unhandledRejection', 'a rejected promise reason');
    await new Promise((r) => setTimeout(r, 10));
    expect(fake.flushed).toBe(true);
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
