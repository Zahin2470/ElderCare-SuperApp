/**
 * Typed fetch wrapper for the ElderCare API.
 *
 * Token handling (why it looks like this):
 *  - The short-lived access token lives ONLY in this module's memory — never localStorage/sessionStorage —
 *    so an XSS bug cannot read it out of storage.
 *  - The long-lived refresh token is an httpOnly cookie the browser sends by itself; JavaScript never sees it.
 *  - On page load, `refreshSession()` trades that cookie for a fresh access token, which is how a reload keeps you signed in.
 *  - A 401 triggers exactly one refresh + retry. Concurrent refreshes are merged into one request (single-flight).
 */
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

export type Role = 'senior' | 'family' | 'super_admin' | 'security_admin' | 'operations_admin' | 'clinical_admin';
export interface SessionUser {
  id: string; fullName: string; email: string | null; phone: string | null; role: Role; locale: 'en' | 'bn'; isVerified: boolean;
}
export interface Session { user: SessionUser; accessToken: string }

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}

let accessToken: string | null = null;
let refreshing: Promise<Session | null> | null = null;
type Listener = (s: Session | null) => void;
const listeners = new Set<Listener>();
export const onSessionChange = (fn: Listener) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export function setSession(s: Session | null) {
  accessToken = s?.accessToken ?? null;
  listeners.forEach((fn) => fn(s));
}
export const hasAccessToken = () => accessToken !== null;

interface Opts { query?: Record<string, string | number | boolean | undefined | null>; body?: unknown; form?: FormData; auth?: boolean }

async function send(method: string, path: string, o: Opts, token: string | null): Promise<Response> {
  const qs = o.query ? new URLSearchParams(Object.entries(o.query).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString() : '';
  const headers: Record<string, string> = {};
  if (token && o.auth !== false) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (o.form) body = o.form;                                   // browser sets the multipart boundary
  else if (o.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(o.body); }
  return fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, { method, headers, body, credentials: 'include' });
}

async function toError(res: Response): Promise<ApiError> {
  let payload: any = null;
  try { payload = await res.json(); } catch { /* non-JSON error page */ }
  const e = payload?.error;
  return new ApiError(res.status, e?.code ?? 'http_error', e?.message ?? `Request failed (${res.status})`, e?.details);
}

export function refreshSession(): Promise<Session | null> {
  refreshing ??= (async () => {
    try {
      const res = await send('POST', '/auth/refresh', { auth: false }, null);
      if (!res.ok) { setSession(null); return null; }
      const s = (await res.json()) as Session;
      setSession(s);
      return s;
    } catch { setSession(null); return null; }
    finally { refreshing = null; }
  })();
  return refreshing;
}

export async function api<T = unknown>(method: string, path: string, o: Opts = {}): Promise<T> {
  let res = await send(method, path, o, accessToken);
  if (res.status === 401 && o.auth !== false && !path.startsWith('/auth/') && !path.startsWith('/admin/auth/')) {
    const s = await refreshSession();
    if (s) res = await send(method, path, o, s.accessToken);
  }
  if (!res.ok) throw await toError(res);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const get = <T>(path: string, query?: Opts['query']) => api<T>('GET', path, { query });
export const post = <T>(path: string, body?: unknown, query?: Opts['query']) => api<T>('POST', path, { body: body ?? {}, query });
export const patch = <T>(path: string, body?: unknown) => api<T>('PATCH', path, { body: body ?? {} });
export const del = <T>(path: string) => api<T>('DELETE', path);
export const upload = <T>(path: string, form: FormData) => api<T>('POST', path, { form });

/** Fetch a protected file (e.g. a health record) as a Blob, sending the bearer token. */
export async function download(path: string): Promise<Blob> {
  let res = await send('GET', path, {}, accessToken);
  if (res.status === 401) { const s = await refreshSession(); if (s) res = await send('GET', path, {}, s.accessToken); }
  if (!res.ok) throw await toError(res);
  return res.blob();
}

export const errorMessage = (e: unknown, fallback = 'Something went wrong. Please try again.') =>
  e instanceof ApiError ? e.message : e instanceof TypeError ? 'Cannot reach the server. Check your connection and try again.' : fallback;
