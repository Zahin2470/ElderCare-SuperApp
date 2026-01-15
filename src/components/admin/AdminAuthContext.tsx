import { createContext, useContext, useState, ReactNode } from 'react';

export type AdminRole = 'super_admin' | 'security_admin' | 'operations_admin' | 'clinical_admin';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: AdminRole;
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

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  impersonationSession: ImpersonationSession | null;
  adminLogin: (user: AdminUser) => void;
  adminLogout: () => void;
  updateAdminUser: (user: Partial<AdminUser>) => void;
  startImpersonation: (session: ImpersonationSession) => void;
  endImpersonation: () => void;
  verify2FA: (code: string) => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Permission sets for each role
export const ROLE_PERMISSIONS = {
  super_admin: [
    'users.read',
    'users.write',
    'users.delete',
    'roles.read',
    'roles.write',
    'audit_logs.read',
    'security.read',
    'security.write',
    'impersonation',
    'system_settings.read',
    'system_settings.write',
    'billing.read',
    'billing.write',
    'reports.read',
    'content.write',
    'franchise.read',
    'franchise.write',
    'partner.read',
    'partner.write',
  ],
  security_admin: [
    'audit_logs.read',
    'security.read',
    'security.write',
    'impersonation',
    'users.read',
  ],
  operations_admin: [
    'users.read',
    'users.write',
    'audit_logs.read',
    'franchise.read',
    'franchise.write',
    'partner.read',
    'partner.write',
    'system_settings.read',
    'billing.read',
    'reports.read',
    'content.write',
  ],
  clinical_admin: [
    'users.read',
    'audit_logs.read',
    'reports.read',
    'care360.read',
    'care360.write',
  ],
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [impersonationSession, setImpersonationSession] = useState<ImpersonationSession | null>(null);

  const adminLogin = (userData: AdminUser) => {
    setAdminUser(userData);
  };

  const adminLogout = () => {
    setAdminUser(null);
    setImpersonationSession(null);
  };

  const updateAdminUser = (userData: Partial<AdminUser>) => {
    if (adminUser) {
      setAdminUser({ ...adminUser, ...userData });
    }
  };

  const startImpersonation = (session: ImpersonationSession) => {
    setImpersonationSession(session);
    // Log impersonation event
    console.log('[AUDIT] Impersonation started:', {
      adminId: adminUser?.id,
      adminRole: adminUser?.role,
      targetUser: session.targetUserId,
      reason: session.reason,
      timestamp: new Date().toISOString(),
    });
  };

  const endImpersonation = () => {
    if (impersonationSession) {
      console.log('[AUDIT] Impersonation ended:', {
        adminId: adminUser?.id,
        targetUser: impersonationSession.targetUserId,
        duration: Date.now() - new Date(impersonationSession.startedAt).getTime(),
        timestamp: new Date().toISOString(),
      });
    }
    setImpersonationSession(null);
  };

  const verify2FA = async (code: string): Promise<boolean> => {
    // Mock 2FA verification - in production, this would call your backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(code.length === 6 && /^\d+$/.test(code));
      }, 500);
    });
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdminAuthenticated: !!adminUser,
        impersonationSession,
        adminLogin,
        adminLogout,
        updateAdminUser,
        startImpersonation,
        endImpersonation,
        verify2FA,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

export function hasPermission(user: AdminUser | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}
