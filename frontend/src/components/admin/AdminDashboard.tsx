import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { QueryState } from '../common/QueryState';
import { useAdminStats } from './adminApi';

const Stat = ({ label, value, hint, warn }: { label: string; value: number; hint?: string; warn?: boolean }) => (
  <Card className={`p-5 ${warn && value > 0 ? 'border-orange-300 bg-orange-50' : ''}`}><p className="text-sm text-gray-600">{label}</p><p className="text-3xl text-gray-900">{value.toLocaleString()}</p>{hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}</Card>
);

export function AdminDashboard() {
  const stats = useAdminStats();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between"><div><h1 className="text-gray-900">Admin dashboard</h1><p className="text-gray-600">Live platform figures. Aggregates only — no personal health data is shown here.</p></div><Button variant="outline" onClick={() => stats.refetch()} disabled={stats.isFetching}>{stats.isFetching ? 'Refreshing…' : 'Refresh'}</Button></div>
      <QueryState q={stats}>{(s) => (<>
        <section aria-label="Users"><h2 className="text-gray-900 mb-3">Users</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Stat label="Total accounts" value={s.users.total} /><Stat label="Seniors" value={s.users.seniors} /><Stat label="Family members" value={s.users.families} />
            <Stat label="Joined in last 7 days" value={s.users.new7d} /><Stat label="Signed in last 24 h" value={s.users.active24h} /><Stat label="Suspended" value={s.users.suspended} warn />
          </div></section>
        <section aria-label="Operations"><h2 className="text-gray-900 mb-3">Operations</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Stat label="Upcoming appointments" value={s.operations.upcomingAppointments} /><Stat label="Caregiver bookings awaiting confirmation" value={s.operations.pendingCaregiverBookings} warn />
            <Stat label="Open meal orders" value={s.operations.openMealOrders} /><Stat label="AI assistant messages (24 h)" value={s.operations.aiMessages24h} /><Stat label="Failed sign-in events (24 h)" value={s.operations.failedAuth24h} hint="Wrong passwords or 2FA codes" warn />
          </div></section>
      </>)}</QueryState>
    </div>
  );
}
