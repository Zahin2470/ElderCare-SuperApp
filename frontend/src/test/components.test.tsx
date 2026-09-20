import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Login from '../components/auth/Login';
import CareAssistant from '../components/ai/CareAssistant';
import { AuthProvider } from '../components/auth/AuthContext';
import { clock, relativeDay, addDaysISO } from '../lib/format';
import { setSession } from '../lib/api';

const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const withQuery = (ui: React.ReactNode) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>;

describe('ErrorBoundary', () => {
  it('shows a recovery screen instead of a blank page, and resets when the route changes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Boom = ({ boom }: { boom: boolean }) => { if (boom) throw new Error('kaboom'); return <p>fine</p>; };
    const { rerender } = render(<ErrorBoundary resetKey="a"><Boom boom /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent(/Something went wrong/);
    expect(screen.queryByText(/kaboom/)).toBeNull();                       // internals are not shown to the user
    rerender(<ErrorBoundary resetKey="b"><Boom boom={false} /></ErrorBoundary>);
    expect(screen.getByText('fine')).toBeInTheDocument();
  });
});

describe('Login', () => {
  const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label, { selector: 'input' }), { target: { value } });
  it('shows the server\'s message when sign-in fails, and re-enables the button', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Invalid email/phone or password'));
    render(<Login onLogin={onLogin} />);
    fill(/^email/i, 'demo@eldercare.com'); fill(/^password/i, 'Wrong@12345');
    fireEvent.click(screen.getAllByRole('button', { name: /sign in/i })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email/phone or password');
    expect(onLogin).toHaveBeenCalledWith({ identifier: 'demo@eldercare.com', password: 'Wrong@12345' });
  });
  it('does not call the server when required fields are empty', () => {
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);
    fireEvent.click(screen.getAllByRole('button', { name: /sign in/i })[0]);
    expect(onLogin).not.toHaveBeenCalled();
  });
});

describe('Care assistant', () => {
  const user = { id: 'u1', fullName: 'A B', email: 'a@b.c', phone: null, role: 'senior' as const, locale: 'en' as const, isVerified: true };
  const setup = (chatBody: unknown) => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('/api/auth/refresh')) return json(200, { user, accessToken: 't' });
      if (url.startsWith('/api/ai/status')) return json(200, { mode: 'ai', emergencyNumber: '999' });
      if (url.startsWith('/api/ai/chat')) return json(200, chatBody);
      return json(404, { error: { code: 'not_found', message: 'x' } });
    }));
    setSession({ user, accessToken: 't' });
    render(withQuery(<AuthProvider><CareAssistant /></AuthProvider>));
  };
  const ask = async (text: string) => {
    const box = await screen.findByLabelText('Type your question…');
    fireEvent.change(box, { target: { value: text } });
    fireEvent.submit(box.closest('form')!);
  };

  it('renders model output as plain text — markup in a reply is never executed', async () => {
    setup({ conversationId: 'c1', reply: '<img src=x onerror="window.__pwned=1"><b>bold</b>', source: 'claude', safety: null });
    await ask('hello');
    expect(await screen.findByText(/<img src=x/)).toBeInTheDocument();     // visible as literal text
    expect(document.querySelector('img[src="x"]')).toBeNull();               // no element was created
    expect((window as any).__pwned).toBeUndefined();
  });
  it('an emergency reply shows a large one-tap call button to the emergency number', async () => {
    setup({ conversationId: 'c1', reply: 'This could be an emergency. Please call 999 right now.', source: 'safety', safety: 'medical_emergency' });
    await ask('I have chest pain');
    const call = await screen.findByRole('link', { name: /Call emergency now \(999\)/ });
    expect(call).toHaveAttribute('href', 'tel:999');
  });
  it('a failed request shows a friendly message instead of crashing the chat', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.includes('/ai/chat') ? json(429, { error: { code: 'rate_limited', message: "You have reached today's message limit." } }) : url.includes('refresh') ? json(200, { user, accessToken: 't' }) : json(200, { mode: 'basic', emergencyNumber: '999' }))));
    setSession({ user, accessToken: 't' });
    render(withQuery(<AuthProvider><CareAssistant /></AuthProvider>));
    await ask('hi');
    await waitFor(() => expect(screen.getByText(/message limit/)).toBeInTheDocument());
  });
  it('always shows the not-a-doctor disclaimer with the emergency number', async () => {
    setup({ conversationId: 'c', reply: 'ok', source: 'claude', safety: null });
    expect(await screen.findByText(/can't diagnose or change medicines/)).toHaveTextContent('999');
  });
});

describe('format helpers', () => {
  it('formats 24-hour clock times for seniors', () => {
    expect(clock('08:00')).toBe('8:00 AM'); expect(clock('12:05')).toBe('12:05 PM'); expect(clock('00:30')).toBe('12:30 AM'); expect(clock('21:00')).toBe('9:00 PM');
  });
  it('describes calendar dates relative to today without timezone drift', () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
    expect(relativeDay(today)).toBe('Today'); expect(relativeDay(addDaysISO(today, 1))).toBe('Tomorrow'); expect(relativeDay(addDaysISO(today, -3))).toBe('Today');
    expect(relativeDay(addDaysISO(today, 9))).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
  });
});
