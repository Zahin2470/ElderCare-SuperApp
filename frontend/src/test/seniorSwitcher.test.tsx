import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth, useSeniorScope } from '../components/auth/AuthContext';
import { SeniorSwitcher } from '../components/family/SeniorSwitcher';
import { setSession } from '../lib/api';
import App from '../App';
import { family as familyFixture, installApiMock } from './apiMock';

const withQuery = (ui: React.ReactNode) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>;

const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const familyUser = { id: 'fam-1', fullName: 'Nusrat Jahan', email: 'family@eldercare.com', phone: null, role: 'family' as const, locale: 'en' as const, isVerified: true };
const seniorUser = { id: 'sen-1', fullName: 'Md. Mosarraf Hossain', email: 'demo@eldercare.com', phone: null, role: 'senior' as const, locale: 'en' as const, isVerified: true };

const TWO_SENIORS = [
  { id: 'senior-a', fullName: 'Md. Mosarraf Hossain', relation: 'Father' },
  { id: 'senior-b', fullName: 'Rahima Begum', relation: 'Mother-in-law' },
];

function mockBackend(user: typeof familyUser | typeof seniorUser, linkedSeniors: typeof TWO_SENIORS) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.includes('/auth/refresh')) return json(200, { user, accessToken: 't' });
    if (url.includes('/auth/me')) return json(200, { user, linkedSeniors });
    return json(404, { error: { code: 'not_found', message: 'x' } });
  }));
  setSession({ user, accessToken: 't' });
}

function Probe() {
  const { linkedSeniors, selectedSeniorId, selectSenior } = useAuth();
  const scope = useSeniorScope();
  return (
    <div>
      <p data-testid="selected">{selectedSeniorId ?? '-'}</p>
      <p data-testid="scope">{scope.seniorId ?? '(none)'}</p>
      <SeniorSwitcher />
      {linkedSeniors.map((s) => <button key={s.id} onClick={() => selectSenior(s.id)}>{s.fullName}</button>)}
      <button onClick={() => selectSenior('not-a-linked-id')}>pick invalid</button>
    </div>
  );
}

describe('multi-senior switcher', () => {
  // Each test starts with a clean slate: a previous test's persisted choice must never leak into the next.
  beforeEach(() => localStorage.clear());

  it('a senior account never gets a seniorId in scope, and the switcher renders nothing', async () => {
    mockBackend(seniorUser, []);
    render(withQuery(<AuthProvider><Probe /></AuthProvider>));
    await waitFor(() => expect(screen.getByTestId('scope')).toHaveTextContent('(none)'));
    expect(screen.queryByLabelText(/Choose which person/)).toBeNull();
    expect(screen.queryByText(/Caring for/)).toBeNull();
  });

  it('a family account with exactly one linked senior shows a plain label, not a picker', async () => {
    mockBackend(familyUser, [TWO_SENIORS[0]]);
    render(withQuery(<AuthProvider><Probe /></AuthProvider>));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('senior-a'));
    expect(screen.getByText(/Caring for: Md\. Mosarraf Hossain/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('defaults to the first linked senior, and every per-senior query is scoped to them', async () => {
    mockBackend(familyUser, TWO_SENIORS);
    render(withQuery(<AuthProvider><Probe /></AuthProvider>));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('senior-a'));
    expect(screen.getByTestId('scope')).toHaveTextContent('senior-a');
  });

  it('switching senior updates every consumer of useSeniorScope, and persists the choice', async () => {
    mockBackend(familyUser, TWO_SENIORS);
    render(withQuery(<AuthProvider><Probe /></AuthProvider>));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('senior-a'));

    const select = screen.getByLabelText(/Choose which person/) as HTMLSelectElement;
    act(() => { fireEvent.change(select, { target: { value: 'senior-b' } }); });

    expect(screen.getByTestId('selected')).toHaveTextContent('senior-b');
    expect(screen.getByTestId('scope')).toHaveTextContent('senior-b');
    expect(localStorage.getItem(`eldercare:selectedSenior:${familyUser.id}`)).toBe('senior-b');
  });

  it('ignores an attempt to select someone who is not (or no longer) linked', async () => {
    mockBackend(familyUser, TWO_SENIORS);
    render(withQuery(<AuthProvider><Probe /></AuthProvider>));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('senior-a'));
    fireEvent.click(screen.getByText('pick invalid'));
    expect(screen.getByTestId('selected')).toHaveTextContent('senior-a'); // unchanged
  });

  it('restores the previously selected senior after a reload (persisted per account)', async () => {
    localStorage.setItem(`eldercare:selectedSenior:${familyUser.id}`, 'senior-b');
    mockBackend(familyUser, TWO_SENIORS);
    render(withQuery(<AuthProvider><Probe /></AuthProvider>));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('senior-b'));
  });

  it('falls back to the first senior when the persisted choice is no longer a valid link', async () => {
    localStorage.setItem(`eldercare:selectedSenior:${familyUser.id}`, 'senior-that-was-revoked');
    mockBackend(familyUser, TWO_SENIORS);
    render(withQuery(<AuthProvider><Probe /></AuthProvider>));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('senior-a'));
  });

  it('the dropdown lists every linked senior with their relation', async () => {
    mockBackend(familyUser, TWO_SENIORS);
    render(withQuery(<AuthProvider><Probe /></AuthProvider>));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('senior-a'));
    const select = screen.getByLabelText(/Choose which person/);
    expect(select).toHaveTextContent('Md. Mosarraf Hossain (Father)');
    expect(select).toHaveTextContent('Rahima Begum (Mother-in-law)');
  });

  it('never fetches per-senior data for the wrong person: after a reload, every request is scoped to the persisted senior', async () => {
    localStorage.setItem(`eldercare:selectedSenior:${familyFixture.id}`, 'senior-b');
    installApiMock(familyFixture, { linkedSeniors: TWO_SENIORS });
    window.history.replaceState({}, '', '/dashboard');
    render(withQuery(<App />));
    await waitFor(() => expect(document.querySelector('nav[aria-label="Modules"]')).toBeTruthy());
    await waitFor(() => expect(screen.getByText(/Caring for Rahima/)).toBeInTheDocument()); // the SECOND senior's data is what's shown

    const perSenior = (vi.mocked(fetch).mock.calls.map((c) => String(c[0]))).filter((u) => /\/api\/(dashboard|medications|ai\/digest|care360|telehealth\/appointments|caregivers\/bookings|nutrition\/(orders|stats))/.test(u));
    expect(perSenior.length).toBeGreaterThan(0);
    for (const url of perSenior) expect(url, url).toContain('seniorId=senior-b'); // never unscoped, never senior-a
    expect(perSenior.some((u) => u.includes('senior-a'))).toBe(false);
  });
});
