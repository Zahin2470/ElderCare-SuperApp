import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, patch, post, refreshSession, onSessionChange, setSession, Session, SessionUser } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';

export type User = SessionUser;
export interface LinkedSenior { id: string; fullName: string; relation: string | null }

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** True while the initial "am I still signed in?" check is running. */
  isLoading: boolean;
  linkedSeniors: LinkedSenior[];
  /** True while `linkedSeniors` is still loading for a family account (distinct from "loaded and empty"). */
  isLoadingLinkedSeniors: boolean;
  /** The linked senior currently being viewed/managed (family accounts only; null for a senior's own account, or before any link exists). */
  selectedSeniorId: string | null;
  /** Switch which linked senior subsequent screens show. Ignored if `id` is not (or no longer) linked. */
  selectSenior: (id: string) => void;
  /** Password sign-in. Throws ApiError (e.g. code 'not_verified') so screens can react. */
  login: (identifier: string, password: string) => Promise<User>;
  /** Adopt a session returned by verify-otp / admin 2FA. */
  applySession: (s: Session) => void;
  logout: () => Promise<void>;
  setLocale: (l: 'en' | 'bn') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const storageKey = (userId: string) => `eldercare:selectedSenior:${userId}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chosenSeniorId, setChosenSeniorId] = useState<string | null>(null);

  useEffect(() => onSessionChange((s) => setUser(s?.user ?? null)), []);

  // Restore the session from the httpOnly refresh cookie on first load.
  useEffect(() => {
    let alive = true;
    refreshSession().finally(() => alive && setIsLoading(false));
    return () => { alive = false; };
  }, []);

  const me = useQuery({
    queryKey: ['me', user?.id],
    queryFn: () => get<{ user: User; linkedSeniors: LinkedSenior[] }>('/auth/me'),
    enabled: !!user && user.role === 'family',
  });
  const linkedSeniors = useMemo(() => me.data?.linkedSeniors ?? [], [me.data]);

  // Which senior is being viewed: the user's explicit pick this session, else this account's last
  // saved choice, else the first linked senior — each only if it is (still) a valid link.
  // Derived synchronously (not via an effect) so that the very first render after the link list
  // loads already has the right person: an effect would leave one render — and one request —
  // scoped to the wrong senior, briefly showing someone else's health data.
  const selectedSeniorId = useMemo(() => {
    if (!user || user.role !== 'family' || !me.data) return null;
    const valid = (id: string | null): id is string => !!id && linkedSeniors.some((s) => s.id === id);
    if (valid(chosenSeniorId)) return chosenSeniorId;
    const saved = localStorage.getItem(storageKey(user.id));
    if (valid(saved)) return saved;
    return linkedSeniors[0]?.id ?? null;
  }, [user, me.data, linkedSeniors, chosenSeniorId]);

  const selectSenior = useCallback((id: string) => {
    if (!user || !linkedSeniors.some((s) => s.id === id)) return; // never select someone not (or no longer) linked
    setChosenSeniorId(id);
    localStorage.setItem(storageKey(user.id), id);
  }, [user, linkedSeniors]);

  const login = useCallback(async (identifier: string, password: string) => {
    const s = await post<Session>('/auth/login', { identifier, password });
    queryClient.clear();
    setSession(s);
    return s.user;
  }, []);

  const applySession = useCallback((s: Session) => { queryClient.clear(); setSession(s); }, []);

  const logout = useCallback(async () => {
    try { await post('/auth/logout'); } catch { /* still sign out locally */ }
    setSession(null);
    setChosenSeniorId(null);
    queryClient.clear();                      // never leave one person's cached health data in memory for the next
    window.history.replaceState({}, '', '/');
  }, []);

  const setLocale = useCallback(async (locale: 'en' | 'bn') => {
    await patch('/auth/me', { locale });
    setUser((u) => (u ? { ...u, locale } : u));
    queryClient.invalidateQueries({ queryKey: ['ai'] });
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user, isAuthenticated: !!user, isLoading, linkedSeniors, isLoadingLinkedSeniors: me.isLoading,
    selectedSeniorId, selectSenior, login, applySession, logout, setLocale,
  }), [user, isLoading, linkedSeniors, me.isLoading, selectedSeniorId, selectSenior, login, applySession, logout, setLocale]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

/**
 * `{ seniorId }` params object to spread into any per-senior API call (dashboard, medications,
 * Care360, telehealth appointments, caregiver bookings, nutrition orders, AI digest/chat/recommendations).
 * Empty for a senior's own account — the server always resolves a senior account to themselves
 * regardless of what's sent, so omitting it there is just tidy, not a security boundary.
 */
export function useSeniorScope(): { seniorId?: string } {
  const { user, selectedSeniorId } = useAuth();
  return user?.role === 'family' && selectedSeniorId ? { seniorId: selectedSeniorId } : {};
}
