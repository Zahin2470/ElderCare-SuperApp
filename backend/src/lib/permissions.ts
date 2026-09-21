export const ADMIN_ROLES = ['super_admin', 'security_admin', 'operations_admin', 'clinical_admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export const isAdminRole = (r: string): r is AdminRole => (ADMIN_ROLES as readonly string[]).includes(r);

/** Authoritative permission table. The UI has a copy for hiding buttons only; THIS is what is enforced. */
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    'users.read', 'users.write', 'users.delete', 'roles.read', 'roles.write', 'audit_logs.read',
    'security.read', 'security.write', 'impersonation', 'system_settings.read', 'system_settings.write',
    'billing.read', 'billing.write', 'reports.read', 'content.write', 'franchise.read', 'franchise.write',
    'partner.read', 'partner.write',
  ],
  security_admin: ['audit_logs.read', 'security.read', 'security.write', 'impersonation', 'users.read'],
  operations_admin: [
    'users.read', 'users.write', 'audit_logs.read', 'franchise.read', 'franchise.write', 'partner.read',
    'partner.write', 'system_settings.read', 'billing.read', 'reports.read', 'content.write',
  ],
  clinical_admin: ['users.read', 'audit_logs.read', 'reports.read', 'care360.read', 'care360.write'],
};

export const hasPermission = (role: string, perm: string) => isAdminRole(role) && ROLE_PERMISSIONS[role].includes(perm);
