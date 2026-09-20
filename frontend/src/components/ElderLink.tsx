import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CaregiverCard } from './elderlink/CaregiverCard';
import { Recommendations } from './ai/Recommendations';
import { QueryState } from './common/QueryState';
import { useCaregivers } from './frames/ElderLinkFrames';
import { useNavigation } from './navigation/NavigationContext';
import { errorMessage, get, post } from '../lib/api';
import { fmtDateTime, taka } from '../lib/format';

interface Booking { id: string; startsAt: string; endsAt: string; services: string[]; totalBdt: number; status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; caregiverName: string }

export default function ElderLink({ userRole }: { userRole: 'senior' | 'family' }) {
  const { navigateToFrame } = useNavigation();
  const qc = useQueryClient();
  const bookings = useQuery({ queryKey: ['caregivers', 'bookings'], queryFn: () => get<{ bookings: Booking[] }>('/caregivers/bookings').then((r) => r.bookings) });
  const caregivers = useCaregivers();
  const cancel = useMutation({
    mutationFn: (id: string) => post(`/caregivers/bookings/${id}/cancel`),
    onSuccess: () => { toast.success('Booking cancelled'); qc.invalidateQueries({ queryKey: ['caregivers'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const active = (bookings.data ?? []).filter((b) => b.status === 'pending' || b.status === 'confirmed');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-gray-900 mb-2">ElderLink</h1><p className="text-gray-600">{userRole === 'senior' ? 'Trusted caregivers, when you need them' : 'Arrange caregiver visits for your loved one'}</p></div>
        <Button onClick={() => navigateToFrame('elderlink', 'EL01_SearchResults')}>Browse all caregivers</Button>
      </div>

      <section aria-label="Your bookings">
        <h2 className="text-gray-900 mb-4">Your bookings</h2>
        <QueryState q={bookings} isEmpty={() => !active.length} empty="No upcoming visits. Choose a caregiver below to book one.">
          {() => <div className="space-y-3">{active.map((b) => (
            <Card key={b.id} className="p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-52"><p className="text-gray-900">{b.caregiverName}</p><p className="text-sm text-gray-600">{fmtDateTime(b.startsAt)}{b.services.length ? ` · ${b.services.join(', ')}` : ''}</p></div>
              <span className="text-gray-900">{taka(b.totalBdt)}</span>
              <Badge variant={b.status === 'confirmed' ? 'secondary' : 'outline'} className="capitalize">{b.status}</Badge>
              <Button variant="ghost" className="text-red-600" disabled={cancel.isPending} onClick={() => { if (window.confirm('Cancel this booking?')) cancel.mutate(b.id); }}>Cancel</Button>
            </Card>
          ))}</div>}
        </QueryState>
      </section>

      <Recommendations type="caregivers" title="Suggested for you" actionLabel="View profile"
        onSelect={(r) => { const c = caregivers.data?.find((x) => x.id === r.id); if (c) navigateToFrame('elderlink', 'EL02_Caregiver_Profile', c); }} />

      <section aria-label="Available caregivers">
        <h2 className="text-gray-900 mb-4">Available caregivers</h2>
        <QueryState q={caregivers} isEmpty={(l) => !l.length}>
          {(l) => <div className="grid md:grid-cols-2 gap-4">{l.map((c) => <CaregiverCard key={c.id} c={c} onView={(x) => navigateToFrame('elderlink', 'EL02_Caregiver_Profile', x)} onBook={(x) => navigateToFrame('elderlink', 'EL03_ScheduleVisit', x)} />)}</div>}
        </QueryState>
      </section>
    </div>
  );
}
