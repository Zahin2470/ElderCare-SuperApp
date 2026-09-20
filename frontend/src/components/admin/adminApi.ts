import { useQuery } from '@tanstack/react-query';
import { get } from '../../lib/api';

export interface AdminUserRow { id: string; fullName: string; email: string | null; phone: string | null; role: string; status: 'active' | 'suspended'; isVerified: boolean; lastLoginAt: string | null; createdAt: string; locale?: string }
export interface AuditRow { id: number; action: string; actorRole: string | null; actorName: string | null; subjectType: string | null; subjectId: string | null; metadata: Record<string, unknown>; ip: string | null; createdAt: string }
export interface Stats { users: { total: number; seniors: number; families: number; suspended: number; new7d: number; active24h: number }; operations: { upcomingAppointments: number; pendingCaregiverBookings: number; openMealOrders: number; aiMessages24h: number; failedAuth24h: number } }

export const useAdminStats = () => useQuery({ queryKey: ['admin', 'stats'], queryFn: () => get<Stats>('/admin/stats') });
export const useAdminUsers = (p: { q: string; role: string; status: string; page: number }) =>
  useQuery({ queryKey: ['admin', 'users', p], queryFn: () => get<{ users: AdminUserRow[]; total: number; page: number; pageSize: number }>('/admin/users', { q: p.q, role: p.role, status: p.status, page: p.page }), placeholderData: (prev) => prev });
export const useAdminUser = (id: string) => useQuery({ queryKey: ['admin', 'user', id], queryFn: () => get<{ user: AdminUserRow }>(`/admin/users/${id}`).then((r) => r.user), enabled: !!id });
export const useAuditLogs = (p: { action: string; from: string; to: string; page: number }) =>
  useQuery({ queryKey: ['admin', 'audit', p], queryFn: () => get<{ logs: AuditRow[]; page: number; pageSize: number }>('/admin/audit-logs', { action: p.action, from: p.from ? new Date(p.from).toISOString() : undefined, to: p.to ? new Date(`${p.to}T23:59:59`).toISOString() : undefined, page: p.page }), placeholderData: (prev) => prev });
export const useAdminRoles = () => useQuery({ queryKey: ['admin', 'roles'], queryFn: () => get<{ roles: Record<string, string[]> }>('/admin/roles').then((r) => r.roles) });

export const ROLE_LABEL: Record<string, string> = { senior: 'Senior', family: 'Family', super_admin: 'Super Admin', security_admin: 'Security Admin', operations_admin: 'Operations Admin', clinical_admin: 'Clinical Admin' };
