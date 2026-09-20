import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { QueryState } from '../common/QueryState';
import { useAdminAuth, hasPermission } from './AdminAuthContext';
import { AdminUserRow, ROLE_LABEL, useAdminUsers } from './adminApi';
import { errorMessage, patch } from '../../lib/api';
import { fmtDate } from '../../lib/format';

/** Suspend / reactivate with a mandatory reason (stored in the audit log). */
export function StatusDialog({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const next = user.status === 'active' ? 'suspended' : 'active';
  const save = useMutation({
    mutationFn: () => patch(`/admin/users/${user.id}`, { status: next, reason: reason.trim() }),
    onSuccess: () => { toast.success(next === 'suspended' ? 'User suspended and signed out' : 'User reactivated'); qc.invalidateQueries({ queryKey: ['admin'] }); onClose(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{next === 'suspended' ? 'Suspend' : 'Reactivate'} {user.fullName}?</DialogTitle><DialogDescription>{next === 'suspended' ? 'They will be signed out immediately and cannot sign in again until reactivated.' : 'They will be able to sign in again.'}</DialogDescription></DialogHeader>
        <div><Label htmlFor="reason">Reason (recorded in the audit log)</Label><Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="h-11" /></div>
        <div className="flex gap-2 justify-end"><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant={next === 'suspended' ? 'destructive' : 'default'} disabled={reason.trim().length < 5 || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : next === 'suspended' ? 'Suspend' : 'Reactivate'}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

export function UserManagement({ onViewUser }: { onViewUser: (id: string) => void }) {
  const { adminUser } = useAdminAuth();
  const canWrite = hasPermission(adminUser, 'users.write');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminUserRow | null>(null);
  const users = useAdminUsers({ q, role, status, page });
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return (
    <div className="space-y-5">
      <div><h1 className="text-gray-900">User management</h1><p className="text-gray-600">Accounts, roles and access</p></div>
      <div className="flex flex-wrap gap-3">
        <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden /><Input aria-label="Search users" placeholder="Name, email or phone" value={q} onChange={(e) => reset(setQ)(e.target.value)} className="pl-9 h-11 w-64" /></div>
        <select aria-label="Filter by role" value={role} onChange={(e) => reset(setRole)(e.target.value)} className="h-11 rounded-md border px-3 bg-white"><option value="">All roles</option>{Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select aria-label="Filter by status" value={status} onChange={(e) => reset(setStatus)(e.target.value)} className="h-11 rounded-md border px-3 bg-white"><option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
      </div>
      <QueryState q={users} isEmpty={(d) => !d.users.length} empty="No users match.">{(d) => (<>
        <Card className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600"><tr>{['Name', 'Contact', 'Role', 'Status', 'Last sign-in', ''].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{d.users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3"><button className="text-purple-700 hover:underline text-left" onClick={() => onViewUser(u.id)}>{u.fullName}</button></td>
              <td className="px-4 py-3 text-gray-600">{u.email ?? u.phone}{!u.isVerified && <Badge variant="outline" className="ml-2 text-xs">unverified</Badge>}</td>
              <td className="px-4 py-3">{ROLE_LABEL[u.role] ?? u.role}</td>
              <td className="px-4 py-3"><Badge variant={u.status === 'active' ? 'secondary' : 'destructive'}>{u.status}</Badge></td>
              <td className="px-4 py-3 text-gray-600">{u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'Never'}</td>
              <td className="px-4 py-3 text-right">{canWrite && u.id !== adminUser?.id && <Button size="sm" variant="outline" onClick={() => setTarget(u)}>{u.status === 'active' ? 'Suspend' : 'Reactivate'}</Button>}</td>
            </tr>))}</tbody></table></Card>
        <div className="flex items-center justify-between text-sm text-gray-600"><span>{d.total} user{d.total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {Math.max(1, Math.ceil(d.total / d.pageSize))}</span><Button size="sm" variant="outline" disabled={page * d.pageSize >= d.total} onClick={() => setPage(page + 1)}>Next</Button></div></div>
      </>)}</QueryState>
      {target && <StatusDialog user={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
