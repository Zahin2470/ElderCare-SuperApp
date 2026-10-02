import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Globe, Lock, LogOut, ShieldCheck, Unlock } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { QueryState } from '../common/QueryState';
import { SkeletonTable } from '../common/Skeleton';
import { errorMessage, post } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import { hasPermission, useAdminAuth } from './AdminAuthContext';
import { AdminSession, LockedUser, ROLE_LABEL, useAdminSessions, useIpActivity, useLockedUsers, useSecurityEvents } from './adminApi';

function SessionsTab() {
  const qc = useQueryClient();
  const { adminUser } = useAdminAuth();
  const canWrite = hasPermission(adminUser, 'security.write');
  const q = useAdminSessions();
  const revoke = useMutation({
    mutationFn: (familyId: string) => post(`/admin/security/sessions/${familyId}/revoke`),
    onSuccess: () => { toast.success('Session ended — they will be signed out on their next request'); qc.invalidateQueries({ queryKey: ['admin', 'security'] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <QueryState q={q} isEmpty={(s) => !s.length} empty="No active sessions right now." skeleton={<SkeletonTable columns={6} />}>
      {(sessions: AdminSession[]) => (
        <Card className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600"><tr>{['User', 'Role', 'IP', 'Started', 'Last refreshed', ''].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h || <span className="sr-only">Actions</span>}</th>)}</tr></thead>
          <tbody className="divide-y">{sessions.map((s) => (
            <tr key={s.familyId} className="hover:bg-gray-50">
              <td className="px-4 py-3">{s.userName}</td>
              <td className="px-4 py-3">{ROLE_LABEL[s.userRole] ?? s.userRole}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.ip ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{fmtDateTime(s.startedAt)}</td>
              <td className="px-4 py-3 text-gray-600">{fmtDateTime(s.lastRefreshedAt)}</td>
              <td className="px-4 py-3 text-right">{canWrite && <Button size="sm" variant="outline" disabled={revoke.isPending} onClick={() => revoke.mutate(s.familyId)}><LogOut className="w-4 h-4 mr-1" aria-hidden />End session</Button>}</td>
            </tr>
          ))}</tbody>
        </table></Card>
      )}
    </QueryState>
  );
}

function LockedAccountsTab() {
  const qc = useQueryClient();
  const { adminUser } = useAdminAuth();
  const canWrite = hasPermission(adminUser, 'security.write');
  const q = useLockedUsers();
  const unlock = useMutation({
    mutationFn: (id: string) => post(`/admin/security/locked-users/${id}/unlock`),
    onSuccess: () => { toast.success('Account unlocked'); qc.invalidateQueries({ queryKey: ['admin', 'security'] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <QueryState q={q} isEmpty={(u) => !u.length} empty="No accounts are currently locked out.">
      {(users: LockedUser[]) => (
        <div className="space-y-3">{users.map((u) => (
          <Card key={u.id} className="p-4 flex flex-wrap items-center gap-4">
            <div className="p-2 rounded-full bg-red-50"><Lock className="w-5 h-5 text-red-600" aria-hidden /></div>
            <div className="flex-1 min-w-48"><p className="text-gray-900">{u.fullName}</p><p className="text-xs text-gray-500">{u.email ?? u.phone} · {ROLE_LABEL[u.role] ?? u.role}</p></div>
            <Badge variant="destructive">Locked until {fmtDateTime(u.lockedUntil)}</Badge>
            {canWrite && <Button size="sm" variant="outline" disabled={unlock.isPending} onClick={() => unlock.mutate(u.id)}><Unlock className="w-4 h-4 mr-1" aria-hidden />Unlock now</Button>}
          </Card>
        ))}</div>
      )}
    </QueryState>
  );
}

function EventsTab() {
  const q = useSecurityEvents();
  return (
    <QueryState q={q} isEmpty={(e) => !e.length} empty="No security events in the last 7 days." skeleton={<SkeletonTable columns={5} />}>
      {(events) => (
        <Card className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600"><tr>{['When', 'Event', 'By', 'IP', 'Severity'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{events.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtDateTime(e.createdAt)}</td>
              <td className="px-4 py-3 font-mono text-xs">{e.action}</td>
              <td className="px-4 py-3">{e.actorName ?? 'Unknown'}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.ip ?? '—'}</td>
              <td className="px-4 py-3"><Badge variant={e.severity === 'critical' ? 'destructive' : 'outline'} className="capitalize">{e.severity}</Badge></td>
            </tr>
          ))}</tbody>
        </table></Card>
      )}
    </QueryState>
  );
}

function IpActivityTab() {
  const q = useIpActivity();
  return (
    <QueryState q={q} isEmpty={(i) => !i.length} empty="No IPs with failed authentication attempts in the last 24 hours." skeleton={<SkeletonTable columns={4} />}>
      {(ips) => (
        <Card className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600"><tr>{['IP address', 'Failed events (24h)', 'Total events (24h)', 'Last seen'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{ips.map((i) => (
            <tr key={i.ip}>
              <td className="px-4 py-3 font-mono text-xs flex items-center gap-2"><Globe className="w-4 h-4 text-gray-400" aria-hidden />{i.ip}</td>
              <td className="px-4 py-3"><Badge variant="destructive">{i.failedEvents}</Badge></td>
              <td className="px-4 py-3 text-gray-600">{i.totalEvents}</td>
              <td className="px-4 py-3 text-gray-600">{fmtDateTime(i.lastSeen)}</td>
            </tr>
          ))}</tbody>
        </table></Card>
      )}
    </QueryState>
  );
}

export function SecurityCenter() {
  return (
    <div className="space-y-5">
      <div><h1 className="text-gray-900 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-purple-600" aria-hidden />Security Center</h1><p className="text-gray-600">Live sign-in sessions, account lockouts, and authentication security events — computed from real activity, refreshed every 30 seconds.</p></div>
      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Active sessions</TabsTrigger>
          <TabsTrigger value="locked">Locked accounts</TabsTrigger>
          <TabsTrigger value="events"><AlertTriangle className="w-4 h-4 mr-1" aria-hidden />Security events</TabsTrigger>
          <TabsTrigger value="ips">IP activity</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions" className="mt-4"><SessionsTab /></TabsContent>
        <TabsContent value="locked" className="mt-4"><LockedAccountsTab /></TabsContent>
        <TabsContent value="events" className="mt-4"><EventsTab /></TabsContent>
        <TabsContent value="ips" className="mt-4"><IpActivityTab /></TabsContent>
      </Tabs>
    </div>
  );
}
