import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, errorMessage, get, post, refreshSession, setSession, upload } from '../lib/api';

const user = { id: 'u1', fullName: 'A B', email: 'a@b.c', phone: null, role: 'senior' as const, locale: 'en' as const, isVerified: true };
const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => { setSession(null); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });

describe('api client', () => {
  it('sends the bearer token, cookies, and JSON', async () => {
    setSession({ user, accessToken: 'tok-1' });
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await post('/medications', { name: 'x' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/medications');
    expect(init.headers.Authorization).toBe('Bearer tok-1');
    expect(init.credentials).toBe('include');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"name":"x"}');
  });
  it('builds query strings and skips empty values', async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}));
    await get('/x', { q: 'a b', page: 2, empty: '', none: undefined });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/x?q=a+b&page=2');
  });
  it('lets the browser set the multipart boundary for uploads', async () => {
    setSession({ user, accessToken: 't' });
    fetchMock.mockResolvedValueOnce(json(201, {}));
    await upload('/care360/records', new FormData());
    expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
  });
  it('on 401 it refreshes once and retries the original request with the new token', async () => {
    setSession({ user, accessToken: 'old' });
    fetchMock
      .mockResolvedValueOnce(json(401, { error: { code: 'unauthorized', message: 'Session expired' } }))
      .mockResolvedValueOnce(json(200, { user, accessToken: 'new' }))     // /auth/refresh
      .mockResolvedValueOnce(json(200, { data: 1 }));
    await expect(get('/dashboard')).resolves.toEqual({ data: 1 });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new');
  });
  it('merges simultaneous refreshes into ONE request (single-flight)', async () => {
    setSession({ user, accessToken: 'old' });
    let refreshCalls = 0;
    fetchMock.mockImplementation(async (url: string, init: any) => {
      if (url === '/api/auth/refresh') { refreshCalls++; await new Promise((r) => setTimeout(r, 20)); return json(200, { user, accessToken: 'new' }); }
      return init.headers.Authorization === 'Bearer new' ? json(200, { ok: 1 }) : json(401, { error: { code: 'unauthorized', message: 'x' } });
    });
    await Promise.all([get('/a'), get('/b'), get('/c')]);
    expect(refreshCalls).toBe(1);        // otherwise rotation would see a "reused" token and log the user out
  });
  it('signs the user out locally when refresh fails', async () => {
    const seen: unknown[] = []; const { onSessionChange } = await import('../lib/api'); const off = onSessionChange((s) => seen.push(s));
    setSession({ user, accessToken: 'old' });
    fetchMock.mockResolvedValueOnce(json(401, { error: { code: 'unauthorized', message: 'x' } })).mockResolvedValueOnce(json(401, { error: { code: 'unauthorized', message: 'gone' } }));
    await expect(get('/dashboard')).rejects.toBeInstanceOf(ApiError);
    expect(seen.at(-1)).toBeNull(); off();
  });
  it('does not try to refresh for login failures (wrong password is not an expired session)', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { error: { code: 'invalid_credentials', message: 'Invalid email/phone or password' } }));
    await expect(post('/auth/login', {})).rejects.toMatchObject({ status: 401, code: 'invalid_credentials', message: 'Invalid email/phone or password' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('turns 204 into undefined and non-JSON failures into a readable ApiError', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(api('DELETE', '/x')).resolves.toBeUndefined();
    fetchMock.mockResolvedValueOnce(new Response('<html>Bad gateway</html>', { status: 502 }));
    await expect(get('/x')).rejects.toMatchObject({ status: 502, code: 'http_error' });
  });
  it('errorMessage gives friendly text for network failures and server errors', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toMatch(/Cannot reach the server/);
    expect(errorMessage(new ApiError(409, 'conflict', 'Already booked'))).toBe('Already booked');
    expect(errorMessage(new Error('secret stack detail'))).not.toMatch(/secret/);
  });
  it('refreshSession() with no cookie resolves null instead of throwing', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { error: { code: 'unauthorized', message: 'x' } }));
    await expect(refreshSession()).resolves.toBeNull();
  });
});
