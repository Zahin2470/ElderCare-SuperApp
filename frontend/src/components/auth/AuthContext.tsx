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
  /** Password sign-in. Throws ApiError (e.g. code 'not_verified') so screens can react. */
  login: (identifier: string, password: string) => Promise<User>;
  /** Adopt a session returned by verify-otp / admin 2FA. */
  applySession: (s: Session) => void;
  logout: () => Promise<void>;
  setLocale: (l: 'en' | 'bn') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    queryClient.clear();                      // never leave one person's cached health data in memory for the next
    window.history.replaceState({}, '', '/');
  }, []);

  const setLocale = useCallback(async (locale: 'en' | 'bn') => {
    await patch('/auth/me', { locale });
    setUser((u) => (u ? { ...u, locale } : u));
    queryClient.invalidateQueries({ queryKey: ['ai'] });
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user, isAuthenticated: !!user, isLoading, linkedSeniors: me.data?.linkedSeniors ?? [], login, applySession, logout, setLocale,
  }), [user, isLoading, me.data, login, applySession, logout, setLocale]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
