import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

/**
 * URL-backed navigation.
 *
 * The app used to keep `{ module, frame }` in React state only, so a page refresh,
 * the browser back button and deep links (`/silverbox`, `/care360/C360_UploadRecord`)
 * all silently reset the user to the dashboard. The public API is unchanged
 * (`navigateToFrame(module, frame, data)`), but the state now lives in the URL:
 *
 *   /<module>[/<frame>]      e.g.  /silverbox   /elderlink/EL02_Caregiver_Profile
 *
 * `data` (the object a frame was opened with) is stored in `history.state`, which the
 * browser preserves across reloads in the same tab.
 */

export interface NavigationState {
  module: string;
  frame: string | null;
  data?: any;
}

interface NavigationContextType {
  currentNavigation: NavigationState;
  navigateToFrame: (module: string, frame?: string | null, data?: any) => void;
  navigateBack: () => void;
  resetNavigation: () => void;
}

const DEFAULT_MODULE = 'dashboard';

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

function readLocation(): NavigationState {
  const [module, frame] = window.location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const data = (window.history.state as { data?: unknown } | null)?.data;
  return { module: module || DEFAULT_MODULE, frame: frame ?? null, data };
}

function toPath(module: string, frame: string | null): string {
  return frame ? `/${encodeURIComponent(module)}/${encodeURIComponent(frame)}` : `/${encodeURIComponent(module)}`;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentNavigation, setCurrentNavigation] = useState<NavigationState>(readLocation);

  useEffect(() => {
    const onPop = () => setCurrentNavigation(readLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigateToFrame = useCallback((module: string, frame: string | null = null, data?: any) => {
    const next: NavigationState = { module, frame, data };
    window.history.pushState({ data }, '', toPath(module, frame));
    setCurrentNavigation(next);
    window.scrollTo?.({ top: 0 });
  }, []);

  const navigateBack = useCallback(() => {
    setCurrentNavigation((prev) => {
      window.history.pushState({}, '', toPath(prev.module, null));
      return { module: prev.module, frame: null, data: undefined };
    });
  }, []);

  const resetNavigation = useCallback(() => {
    window.history.pushState({}, '', toPath(DEFAULT_MODULE, null));
    setCurrentNavigation({ module: DEFAULT_MODULE, frame: null });
  }, []);

  const value = useMemo(
    () => ({ currentNavigation, navigateToFrame, navigateBack, resetNavigation }),
    [currentNavigation, navigateToFrame, navigateBack, resetNavigation],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
