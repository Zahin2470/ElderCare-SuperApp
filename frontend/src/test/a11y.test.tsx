import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'vitest-axe';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import ForgotPassword from '../components/auth/ForgotPassword';
import ResetPassword from '../components/auth/ResetPassword';
import VerifyPhone from '../components/auth/VerifyPhone';
import { AuthProvider } from '../components/auth/AuthContext';
import { AdminLogin } from '../components/admin/AdminLogin';
import { setSession } from '../lib/api';

/**
 * Automated structural accessibility audit (axe-core): missing form labels, invalid ARIA, buttons
 * without accessible names, duplicate ids, bad heading/landmark structure, etc.
 *
 * Deliberately NOT covered, because jsdom has no layout engine: colour contrast, focus visibility,
 * touch-target size, and real screen-reader behaviour. Those still need a manual pass in a browser.
 */
const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } } as const;
const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const withQuery = (ui: React.ReactNode) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>;

async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container, AXE_OPTIONS);
  expect(results).toHaveNoViolations();
}

describe('accessibility — authentication screens', () => {
  it('Login', async () => {
    const { container } = render(<Login onLogin={vi.fn()} onRegister={vi.fn()} onForgotPassword={vi.fn()} onStaffLogin={vi.fn()} />);
    await expectNoViolations(container);
  });
  it('Register', async () => {
    const { container } = render(<Register onNext={vi.fn()} onBack={vi.fn()} />);
    await expectNoViolations(container);
  });
  it('ForgotPassword', async () => {
    const { container } = render(<ForgotPassword onSent={vi.fn()} onBack={vi.fn()} />);
    await expectNoViolations(container);
  });
  it('ResetPassword', async () => {
    const { container } = render(<ResetPassword target="+8801712345678" onDone={vi.fn()} onBack={vi.fn()} />);
    await expectNoViolations(container);
  });
  it('VerifyPhone (OTP entry)', async () => {
    const { container } = render(<VerifyPhone phone="+8801712345678" onVerified={vi.fn()} onBack={vi.fn()} />);
    await expectNoViolations(container);
  });
  it('Admin sign-in', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { error: { code: 'unauthorized', message: 'x' } })));
    setSession(null);
    const { container } = render(withQuery(<AuthProvider><AdminLogin onLoginSuccess={vi.fn()} /></AuthProvider>));
    await waitFor(() => expect(container.querySelector('form')).toBeTruthy());
    await expectNoViolations(container);
  });
});
