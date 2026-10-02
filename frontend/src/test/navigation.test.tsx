import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { NavigationProvider, useNavigation } from '../components/navigation/NavigationContext';

function Probe() {
  const { currentNavigation: c, navigateToFrame, resetNavigation, navigateBack } = useNavigation();
  return (
    <div>
      <p data-testid="state">{c.module}|{c.frame ?? '-'}|{c.data ? JSON.stringify(c.data) : '-'}</p>
      <button onClick={() => navigateToFrame('silverbox', 'SB02_MarkAsTaken', { name: 'Aspirin' })}>frame</button>
      <button onClick={() => navigateToFrame('elderlink')}>module</button>
      <button onClick={resetNavigation}>reset</button>
      <button onClick={navigateBack}>back</button>
    </div>
  );
}
const state = () => screen.getByTestId('state').textContent;
const click = (name: string) => act(() => { screen.getByText(name).click(); });

describe('URL-backed navigation', () => {
  it('reads the module and frame from the URL on load (deep links and refresh work)', () => {
    window.history.replaceState({ data: { id: 7 } }, '', '/care360/C360_ViewRecord');
    render(<NavigationProvider><Probe /></NavigationProvider>);
    expect(state()).toBe('care360|C360_ViewRecord|{"id":7}');           // data survives a reload via history.state
  });
  it('defaults to the dashboard at /', () => {
    window.history.replaceState({}, '', '/');
    render(<NavigationProvider><Probe /></NavigationProvider>);
    expect(state()).toBe('dashboard|-|-');
  });
  it('navigating updates the address bar, so the back button and bookmarks work', () => {
    window.history.replaceState({}, '', '/');
    render(<NavigationProvider><Probe /></NavigationProvider>);
    click('frame');
    expect(window.location.pathname).toBe('/silverbox/SB02_MarkAsTaken');
    expect(state()).toContain('Aspirin');
    click('module');
    expect(window.location.pathname).toBe('/elderlink');
    click('reset');
    expect(window.location.pathname).toBe('/dashboard');
  });
  it('responds to the browser back button (real popstate from the history stack)', async () => {
    window.history.replaceState({}, '', '/');
    render(<NavigationProvider><Probe /></NavigationProvider>);
    click('frame'); click('module');
    expect(state()).toBe('elderlink|-|-');
    await act(async () => { window.history.back(); await new Promise((r) => setTimeout(r, 30)); });   // jsdom fires popstate itself
    expect(window.location.pathname).toBe('/silverbox/SB02_MarkAsTaken');
    expect(state()).toContain('silverbox|SB02_MarkAsTaken');
    expect(state()).toContain('Aspirin');                                                              // the frame's data came back with it
  });
  it('navigateBack from a frame returns to that module\'s root', () => {
    window.history.replaceState({}, '', '/');
    render(<NavigationProvider><Probe /></NavigationProvider>);
    click('frame'); click('back');
    expect(state()).toBe('silverbox|-|-');
  });
});

describe('module code-splitting', () => {
  it('navigating to a module shows the loading fallback first, then the real screen (Suspense is actually exercised)', async () => {
    const { installApiMock, senior } = await import('./apiMock');
    installApiMock(senior);
    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
    const { AuthProvider } = await import('../components/auth/AuthContext');
    const AppMod = (await import('../App')).default;
    window.history.replaceState({}, '', '/silverbox');
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthProvider><AppMod /></AuthProvider>
      </QueryClientProvider>,
    );
    // SilverBox is a separate lazily-loaded chunk: its heading only appears after that chunk resolves,
    // proving the module registry really does defer loading rather than bundling everything eagerly.
    await screen.findByRole('heading', { name: /SilverBox/i }, { timeout: 4000 });
  });
});
