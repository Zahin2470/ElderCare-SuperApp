import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { post } from '../../lib/api';

export type AdminRole = 'super_admin' | 'security_admin' | 'operations_admin' | 'clinical_admin';
export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: AdminRole;
  /** For hiding buttons only. The API enforces permissions itself on every request. */
  permissions: string[];
  isVerified: boolean;
  has2FA: boolean;
  lastLogin?: string;
  ipAddress?: string;
}
export interface ImpersonationSession {
  targetUserId: string;
  targetUserName: string;
  targetUserRole: 'senior' | 'family';
  reason: string;
  startedAt: string;
}

/** UI mirror of backend/src/lib/permissions.ts — presentation only, never a security boundary. */
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['users.read', 'users.write', 'users.delete', 'roles.read', 'roles.write', 'audit_logs.read', 'security.read', 'security.write', 'impersonation', 'system_settings.read', 'system_settings.write', 'billing.read', 'billing.write', 'reports.read', 'content.write', 'franchise.read', 'franchise.write', 'partner.read', 'partner.write'],
  security_admin: ['audit_logs.read', 'security.read', 'security.write', 'impersonation', 'users.read'],
  operations_admin: ['users.read', 'users.write', 'audit_logs.read', 'franchise.read', 'franchise.write', 'partner.read', 'partner.write', 'system_settings.read', 'billing.read', 'reports.read', 'content.write'],
  clinical_admin: ['users.read', 'audit_logs.read', 'reports.read', 'care360.read', 'care360.write'],
};

export const isAdminRole = (r: string | undefined): r is AdminRole => !!r && r in ROLE_PERMISSIONS;

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  impersonationSession: ImpersonationSession | null;
  adminLogout: () => Promise<void>;
  /** Writes the audit trail first; the banner only appears if the server accepted the record. */
  startImpersonation: (session: ImpersonationSession) => Promise<void>;
  endImpersonation: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

/** Admin identity is the same server session as everyone else's — there is no second, client-side login state. */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [impersonationSession, setImpersonationSession] = useState<ImpersonationSession | null>(null);

  const adminUser = useMemo<AdminUser | null>(() => (user && isAdminRole(user.role)
    ? { id: user.id, fullName: user.fullName, email: user.email ?? '', role: user.role, permissions: ROLE_PERMISSIONS[user.role], isVerified: true, has2FA: true }
    : null), [user]);

  const adminLogout = useCallback(async () => { setImpersonationSession(null); await logout(); }, [logout]);

  const startImpersonation = useCallback(async (s: ImpersonationSession) => {
    await post('/admin/impersonation-events', { phase: 'start', targetUserId: s.targetUserId, reason: s.reason });
    setImpersonationSession(s);
  }, []);

  const endImpersonation = useCallback(() => {
    setImpersonationSession((cur) => {
      if (cur) void post('/admin/impersonation-events', { phase: 'end', targetUserId: cur.targetUserId }).catch(() => undefined);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ adminUser, isAdminAuthenticated: !!adminUser, impersonationSession, adminLogout, startImpersonation, endImpersonation }),
    [adminUser, impersonationSession, adminLogout, startImpersonation, endImpersonation]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
}

export function hasPermission(user: AdminUser | null, permission: string): boolean {
  return !!user && user.permissions.includes(permission);
}
