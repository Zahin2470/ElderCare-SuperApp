import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { QueryState } from '../common/QueryState';
import { hasPermission, useAdminAuth } from './AdminAuthContext';
import { ROLE_LABEL, useAdminUser } from './adminApi';
import { StatusDialog } from './UserManagement';
import { fmtDateTime } from '../../lib/format';

export function UserDetail({ userId, onBack }: { userId: string; onBack: () => void }) {
  const { adminUser } = useAdminAuth();
  const q = useAdminUser(userId);
  const [dialog, setDialog] = useState(false);
  return (
    <div className="space-y-5 max-w-3xl">
      <div><Button variant="ghost" onClick={onBack} className="-ml-2 mb-2"><ArrowLeft className="w-4 h-4 mr-2" aria-hidden />Users</Button><h1 className="text-gray-900">User details</h1><p className="text-gray-600">Viewing this record is written to the audit log. Health data is not shown in the admin console.</p></div>
      <QueryState q={q}>{(u) => (<>
        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between"><p className="text-xl text-gray-900">{u.fullName}</p><Badge variant={u.status === 'active' ? 'secondary' : 'destructive'}>{u.status}</Badge></div>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {([['Role', ROLE_LABEL[u.role] ?? u.role], ['Email', u.email ?? '—'], ['Phone', u.phone ?? '—'], ['Verified', u.isVerified ? 'Yes' : 'No'], ['Language', u.locale === 'bn' ? 'বাংলা' : 'English'], ['Joined', fmtDateTime(u.createdAt)], ['Last sign-in', u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : 'Never']] as const).map(([k, v]) => <div key={k}><dt className="text-gray-500">{k}</dt><dd className="text-gray-900">{v}</dd></div>)}
          </dl>
        </Card>
        {hasPermission(adminUser, 'users.write') && u.id !== adminUser?.id && <Button variant={u.status === 'active' ? 'destructive' : 'default'} onClick={() => setDialog(true)}>{u.status === 'active' ? 'Suspend account' : 'Reactivate account'}</Button>}
        {dialog && <StatusDialog user={u} onClose={() => setDialog(false)} />}
      </>)}</QueryState>
    </div>
  );
}
