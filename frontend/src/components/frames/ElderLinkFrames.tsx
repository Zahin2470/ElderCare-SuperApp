import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Search } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { CaregiverCard, Caregiver } from '../elderlink/CaregiverCard';
import { QueryState } from '../common/QueryState';
import { useNavigation } from '../navigation/NavigationContext';
import { ApiError, errorMessage, get, post } from '../../lib/api';
import { clock, fmtDateTime, taka, todayISO } from '../../lib/format';

const SERVICES = ['Companionship', 'Personal Care', 'Meal Prep', 'Medication Reminders', 'Transportation', 'Light Housekeeping', 'Mobility Assistance'];

function Back({ label = 'Back' }: { label?: string }) {
  const { navigateBack } = useNavigation();
  return <Button variant="ghost" onClick={navigateBack} className="-ml-2 mb-2"><ArrowLeft className="w-4 h-4 mr-2" aria-hidden />{label}</Button>;
}

export const useCaregivers = (q = '', specialty = '') =>
  useQuery({ queryKey: ['caregivers', q, specialty], queryFn: () => get<{ caregivers: Caregiver[] }>('/caregivers', { q, specialty }).then((r) => r.caregivers) });

export function EL01_SearchResults() {
  const { navigateToFrame } = useNavigation();
  const [q, setQ] = useState('');
  const [specialty, setSpecialty] = useState('');
  const list = useCaregivers(q, specialty);
  const chips = ['Companionship', 'Medical Care', 'Dementia Care', 'Personal Care', 'Meal Prep'];
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div><Back label="ElderLink" /><h1 className="text-gray-900">Find a caregiver</h1></div>
      <div className="relative max-w-md"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden /><Input aria-label="Search caregivers" placeholder="Name, area or skill" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-11" /></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by skill">
        <Button size="sm" variant={!specialty ? 'default' : 'outline'} onClick={() => setSpecialty('')}>All</Button>
        {chips.map((c) => <Button key={c} size="sm" variant={specialty === c ? 'default' : 'outline'} onClick={() => setSpecialty(c)}>{c}</Button>)}
      </div>
      <QueryState q={list} isEmpty={(l) => !l.length} empty="No caregivers match. Try fewer filters.">
        {(l) => <div className="grid md:grid-cols-2 gap-4">{l.map((c) => <CaregiverCard key={c.id} c={c} onView={(x) => navigateToFrame('elderlink', 'EL02_Caregiver_Profile', x)} onBook={(x) => navigateToFrame('elderlink', 'EL03_ScheduleVisit', x)} />)}</div>}
      </QueryState>
    </div>
  );
}

export function EL02_Caregiver_Profile() {
  const { navigateToFrame, currentNavigation } = useNavigation();
  const c = currentNavigation.data as Caregiver;
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div><Back /><h1 className="text-gray-900">Caregiver profile</h1></div>
      <CaregiverCard c={c} />
      <Card className="p-5 text-sm text-gray-600">Reviews are aggregated from completed visits. Verification means identity and background documents have been checked by ElderCare.</Card>
      <Button className="w-full h-12" onClick={() => navigateToFrame('elderlink', 'EL03_ScheduleVisit', c)}>Book a visit with {c.name.split(' ')[0]}</Button>
    </div>
  );
}

export function EL03_ScheduleVisit() {
  const { navigateToFrame, currentNavigation } = useNavigation();
  const qc = useQueryClient();
  const c = currentNavigation.data as Caregiver;
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('13:00');
  const [services, setServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const hours = (Number(end.slice(0, 2)) * 60 + Number(end.slice(3)) - (Number(start.slice(0, 2)) * 60 + Number(start.slice(3)))) / 60;
  const valid = hours > 0 && hours <= 12;
  const estimate = valid ? Math.round(hours * c.hourlyRateBdt) : 0;

  const book = useMutation({
    mutationFn: () => post<{ booking: { id: string; startsAt: string; endsAt: string; services: string[]; totalBdt: number; status: string } }>('/caregivers/bookings', { caregiverId: c.id, date, startTime: start, endTime: end, services, notes: notes.trim() || undefined }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['caregivers'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); navigateToFrame('elderlink', 'EL05_Booking_Confirmation', { ...r.booking, caregiverName: c.name }); },
    onError: (e) => toast.error(e instanceof ApiError && e.code === 'unavailable' ? `${c.name} is already booked then — try another time.` : errorMessage(e)),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div><Back /><h1 className="text-gray-900">Schedule a visit</h1><p className="text-gray-600">with {c.name}</p></div>
      <Card className="p-6 space-y-5">
        <div className="grid sm:grid-cols-3 gap-3">
          <div><Label htmlFor="v-date">Date</Label><Input id="v-date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className="h-11" /></div>
          <div><Label htmlFor="v-start">From</Label><Input id="v-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-11" /></div>
          <div><Label htmlFor="v-end">To</Label><Input id="v-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11" /></div>
        </div>
        {!valid && <p className="text-sm text-red-700" role="alert">A visit must end after it starts and last at most 12 hours.</p>}
        <fieldset><legend className="mb-2 text-sm">What help is needed?</legend>
          <div className="grid sm:grid-cols-2 gap-2">{SERVICES.map((s) => (
            <label key={s} className="flex items-center gap-2 p-2 rounded-md border hover:bg-purple-50 cursor-pointer">
              <Checkbox checked={services.includes(s)} onCheckedChange={(on) => setServices(on ? [...services, s] : services.filter((x) => x !== s))} /><span className="text-sm">{s}</span>
            </label>
          ))}</div>
        </fieldset>
        <div><Label htmlFor="v-notes">Notes for the caregiver (optional)</Label><textarea id="v-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))} className="mt-1 w-full rounded-md border p-3" /></div>
        <div className="flex items-center justify-between border-t pt-4"><span className="text-gray-600">Estimated cost ({hours > 0 ? hours.toFixed(1) : 0} h × {taka(c.hourlyRateBdt)})</span><span className="text-xl text-gray-900">{taka(estimate)}</span></div>
        <p className="text-xs text-gray-500">The final price is calculated by ElderCare from the caregiver's rate when you confirm.</p>
        <Button className="w-full h-12" disabled={!valid || book.isPending} onClick={() => book.mutate()}>{book.isPending ? 'Booking…' : 'Request booking'}</Button>
      </Card>
    </div>
  );
}

export function EL05_Booking_Confirmation() {
  const { navigateToFrame, currentNavigation } = useNavigation();
  const b = currentNavigation.data as { caregiverName: string; startsAt: string; endsAt: string; services: string[]; totalBdt: number; status: string } | undefined;
  return (
    <div className="max-w-xl mx-auto space-y-5 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-9 h-9 text-green-600" aria-hidden /></div>
      <h1 className="text-gray-900">Booking requested</h1>
      {b && (
        <Card className="p-6 text-left space-y-2">
          <p><span className="text-gray-600">Caregiver:</span> <strong>{b.caregiverName}</strong></p>
          <p><span className="text-gray-600">When:</span> {fmtDateTime(b.startsAt)} – {clock(new Date(b.endsAt).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' }))}</p>
          {b.services.length > 0 && <p className="flex flex-wrap gap-1 items-center"><span className="text-gray-600">Services:</span>{b.services.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</p>}
          <p><span className="text-gray-600">Total:</span> <strong>{taka(b.totalBdt)}</strong></p>
          <Badge variant="secondary" className="capitalize">{b.status}</Badge>
        </Card>
      )}
      <p className="text-sm text-gray-600">Your request is now pending. You can see or cancel it any time from ElderLink.</p>
      <Button className="w-full" onClick={() => navigateToFrame('elderlink', null)}>Back to ElderLink</Button>
    </div>
  );
}
