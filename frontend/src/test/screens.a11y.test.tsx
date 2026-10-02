import { describe, expect, it } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'vitest-axe';
import App from '../App';
import { AuthProvider } from '../components/auth/AuthContext';
import { AdminAuthProvider } from '../components/admin/AdminAuthContext';
import { NavigationProvider } from '../components/navigation/NavigationContext';
import Dashboard from '../components/Dashboard';
import SilverBox from '../components/SilverBox';
import ElderLink from '../components/ElderLink';
import TeleHealth from '../components/TeleHealth';
import NutriSenior from '../components/NutriSenior';
import Care360 from '../components/Care360';
import CommunityActivities from '../components/CommunityActivities';
import RewardsLoyalty from '../components/RewardsLoyalty';
import GoldenCareJobs from '../components/GoldenCareJobs';
import AgeWellLiving from '../components/AgeWellLiving';
import CareAssistant from '../components/ai/CareAssistant';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { UserManagement } from '../components/admin/UserManagement';
import { AuditLogs } from '../components/admin/AuditLogs';
import { RolesPermissions } from '../components/admin/RolesPermissions';
import { SecurityCenter } from '../components/admin/SecurityCenter';
import { admin, family, installApiMock, senior } from './apiMock';
import type { SessionUser } from '../lib/api';

/**
 * Renders each main screen with realistic data, waits for it to finish loading, then audits it with
 * axe-core. This doubles as a render smoke test: a crash, a missing fixture (surfaced as a 404 error
 * panel) or a stuck skeleton fails the test. Colour contrast / focus visibility / touch-target size /
 * real screen-reader behaviour can't be judged in jsdom and still need a manual browser pass.
 */
const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } } as const;

async function audit(ui: React.ReactNode, user: SessionUser, linkedSeniors?: { id: string; fullName: string; relation: string | null }[], wrap = true, overrides?: Record<string, unknown>) {
  installApiMock(user, { linkedSeniors, overrides });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { container } = render(wrap
    ? <QueryClientProvider client={client}><AuthProvider><AdminAuthProvider><NavigationProvider>{ui}</NavigationProvider></AdminAuthProvider></AuthProvider></QueryClientProvider>
    : <QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  // Wait for the network to go idle (a family account refetches once its linked seniors load) AND the
  // skeletons to disappear, so we audit the settled screen rather than racing a refetch.
  await waitFor(() => { expect(client.isFetching()).toBe(0); expect(container.querySelector('[aria-label="Loading"], [aria-busy="true"]')).toBeNull(); }, { timeout: 4000 });
  await waitFor(() => expect(container.textContent).not.toMatch(/No mock for/), { timeout: 1000 }); // a missing fixture would show here
  expect(container.textContent!.length).toBeGreaterThan(50); // it actually rendered something substantial
  // The error boundary's fallback is itself valid HTML, so axe alone would happily "pass" a crashed screen.
  expect(container.textContent).not.toMatch(/Something went wrong on this page/);
  expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
}

describe('accessibility + render smoke — member screens (senior account)', () => {
  it.each([
    ['Dashboard', <Dashboard userRole="senior" />],
    ['SilverBox', <SilverBox userRole="senior" />],
    ['ElderLink', <ElderLink userRole="senior" />],
    ['TeleHealth', <TeleHealth />],
    ['NutriSenior', <NutriSenior userRole="senior" />],
    ['Care360', <Care360 userRole="senior" />],
    ['Community Activities', <CommunityActivities />],
    ['Rewards & Loyalty', <RewardsLoyalty />],
    ['GoldenCare', <GoldenCareJobs />],
    ['AgeWell Living', <AgeWellLiving />],
    ['Care Assistant', <CareAssistant />],
  ])('%s', async (_name, ui) => { await audit(ui, senior); });
});

describe('accessibility + render smoke — family account', () => {
  it('senior Dashboard with a pending family request keeps a valid heading order (h1 → h2, never h1 → h3)', async () => {
    // Regression test: 'Someone wants to help look after you' used to be an <h3> straight after the
    // page's <h1> with nothing in between — a real heading-order bug axe only catches when there is
    // at least one pending request to render (the empty-list fixture used elsewhere hides it).
    await audit(<Dashboard userRole="senior" />, senior, undefined, undefined, {
      '/api/family/requests': { requests: [{ familyId: 'f1', fullName: 'Nusrat Jahan', relation: 'Daughter' }] },
    });
  });


  it('Dashboard with two linked seniors (includes the senior switcher)', async () => {
    await audit(<Dashboard userRole="family" />, family, [{ id: 's1', fullName: 'Md. Mosarraf Hossain', relation: 'Father' }, { id: 's2', fullName: 'Rahima Begum', relation: 'Mother' }]);
  });
});

describe('accessibility + render smoke — whole app shell', () => {
  it('senior: sidebar navigation + dashboard', async () => {
    await audit(<App />, senior, undefined, false);
    expect(document.querySelector('nav[aria-label="Modules"]')).toBeTruthy(); // the shell really rendered, not just a fallback
  });
  it('family: sidebar with senior switcher + dashboard', async () => {
    await audit(<App />, family, [{ id: 's1', fullName: 'Md. Mosarraf Hossain', relation: 'Father' }, { id: 's2', fullName: 'Rahima Begum', relation: 'Mother' }], false);
    expect(document.querySelector('nav[aria-label="Modules"]')).toBeTruthy();
  });
});

describe('accessibility + render smoke — admin console screens', () => {
  it.each([
    ['Admin dashboard', <AdminDashboard />],
    ['User management', <UserManagement onViewUser={() => undefined} />],
    ['Audit log', <AuditLogs />],
    ['Roles & permissions', <RolesPermissions />],
    ['Security Center', <SecurityCenter />],
  ])('%s', async (_name, ui) => { await audit(ui, admin); });
});
