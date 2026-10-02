import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ApiError, errorMessage } from '../lib/api';
import { ErrorReporter, getReporter, setReporter } from '../lib/monitoring';

class FakeReporter implements ErrorReporter {
  calls: { err: unknown; context?: Record<string, unknown> }[] = [];
  captureException(err: unknown, context?: Record<string, unknown>) { this.calls.push({ err, context }); }
}

afterEach(() => setReporter(new FakeReporter())); // leave a harmless default behind for any later test

describe('error reporting — dependency injection', () => {
  it('the default reporter is a safe no-op', () => {
    expect(() => getReporter().captureException(new Error('x'))).not.toThrow();
  });
});

describe('ErrorBoundary reports what it catches', () => {
  it('reports the error and its component stack when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fake = new FakeReporter();
    setReporter(fake);
    const Boom = () => { throw new Error('kaboom'); };
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(fake.calls).toHaveLength(1);
    expect((fake.calls[0].err as Error).message).toBe('kaboom');
    expect(fake.calls[0].context?.componentStack).toContain('Boom');
  });
});

describe('the API client only reports genuinely unexpected server failures', () => {
  const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('reports a 500/502/503 from the server', async () => {
    const fake = new FakeReporter();
    setReporter(fake);
    vi.stubGlobal('fetch', vi.fn(async () => json(500, { error: { code: 'internal', message: 'Something went wrong on our side.', requestId: 'req-1' } })));
    const { get } = await import('../lib/api');
    await expect(get('/dashboard')).rejects.toBeInstanceOf(ApiError);
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0].context).toMatchObject({ status: 500, code: 'internal', requestId: 'req-1' });
  });

  it('does NOT report an ordinary 4xx (wrong password, validation, not found)', async () => {
    const fake = new FakeReporter();
    setReporter(fake);
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { error: { code: 'invalid_credentials', message: 'Invalid email/phone or password' } })));
    const { post } = await import('../lib/api');
    await expect(post('/auth/login', {})).rejects.toBeInstanceOf(ApiError);
    expect(fake.calls).toHaveLength(0);
  });

  it('does NOT report a plain network failure (no server response at all)', async () => {
    const fake = new FakeReporter();
    setReporter(fake);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const { get } = await import('../lib/api');
    await expect(get('/dashboard')).rejects.toThrow();
    expect(fake.calls).toHaveLength(0);
    expect(errorMessage(new TypeError('Failed to fetch'))).toMatch(/Cannot reach the server/);
  });
});
