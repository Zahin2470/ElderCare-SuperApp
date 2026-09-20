import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { QueryState } from './common/QueryState';
import type { Application, Room } from './frames/AgeWellFrames';
import { useNavigation } from './navigation/NavigationContext';
import { ApiError, errorMessage, get, post } from '../lib/api';
import { fmtDate, fmtDateTime, relativeDay, taka, todayISO } from '../lib/format';

interface FacilityBooking { id: string; facility: string; startsAt: string; endsAt: string; purpose: string | null }
const STATUS_LABEL: Record<Application['status'], string> = { submitted: 'Submitted', under_review: 'Under review', approved: 'Approved', withdrawn: 'Withdrawn' };

function FacilityBooker() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['agewell', 'facility'], queryFn: () => get<{ facilities: string[]; bookings: FacilityBooking[] }>('/agewell/facility-bookings') });
  const [f, setF] = useState({ facility: '', date: todayISO(), startTime: '15:00', endTime: '17:00', purpose: '' });
  const book = useMutation({
    mutationFn: () => post('/agewell/facility-bookings', { ...f, facility: f.facility || q.data?.facilities[0], purpose: f.purpose.trim() || undefined }),
    onSuccess: () => { toast.success('Facility booked'); qc.invalidateQueries({ queryKey: ['agewell'] }); },
    onError: (e) => toast.error(e instanceof ApiError && e.code === 'unavailable' ? e.message : errorMessage(e)),
  });
  const cancel = useMutation({ mutationFn: (id: string) => post(`/agewell/facility-bookings/${id}/cancel`), onSuccess: () => qc.invalidateQueries({ queryKey: ['agewell'] }), onError: (e) => toast.error(errorMessage(e)) });
  return (
    <QueryState q={q}>{(d) => (
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <p className="text-gray-900">Book a shared space</p>
          <div><Label htmlFor="f-fac">Space</Label><select id="f-fac" value={f.facility || d.facilities[0]} onChange={(e) => setF({ ...f, facility: e.target.value })} className="w-full h-11 rounded-md border px-3 bg-white">{d.facilities.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-2"><div><Label htmlFor="f-date">Date</Label><Input id="f-date" type="date" min={todayISO()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            <div><Label htmlFor="f-s">From</Label><Input id="f-s" type="time" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} /></div>
            <div><Label htmlFor="f-e">To</Label><Input id="f-e" type="time" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} /></div></div>
          <div><Label htmlFor="f-p">Purpose (optional)</Label><Input id="f-p" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} /></div>
          <Button className="w-full" disabled={book.isPending} onClick={() => book.mutate()}>{book.isPending ? 'Booking…' : 'Book'}</Button>
        </Card>
        <div className="space-y-2">{d.bookings.length === 0 ? <Card className="p-5 text-gray-600">No upcoming facility bookings.</Card> : d.bookings.map((b) => (
          <Card key={b.id} className="p-4 flex items-center gap-3"><div className="flex-1"><p className="text-gray-900">{b.facility}</p><p className="text-sm text-gray-600">{fmtDateTime(b.startsAt)}{b.purpose ? ` · ${b.purpose}` : ''}</p></div>
            <Button size="sm" variant="ghost" className="text-red-600" disabled={cancel.isPending} onClick={() => cancel.mutate(b.id)}>Cancel</Button></Card>
        ))}</div>
      </div>
    )}</QueryState>
  );
}

export default function AgeWellLiving() {
  const { navigateToFrame } = useNavigation();
  const rooms = useQuery({ queryKey: ['agewell', 'rooms'], queryFn: () => get<{ rooms: Room[] }>('/agewell/rooms').then((r) => r.rooms) });
  const apps = useQuery({ queryKey: ['agewell', 'apps'], queryFn: () => get<{ applications: Application[] }>('/agewell/applications').then((r) => r.applications) });
  const open = (apps.data ?? []).filter((a) => a.status !== 'withdrawn');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-gray-900 mb-2">AgeWell Living</h1><p className="text-gray-600">Senior living communities and shared spaces</p></div><Button variant="outline" onClick={() => navigateToFrame('agewell', 'AW01_CommunityChatRoom')}>Community chat</Button></div>

      {open.length > 0 && (
        <section aria-label="Your applications"><h2 className="text-gray-900 mb-4">Your applications</h2>
          <div className="space-y-3">{open.map((a) => (
            <Card key={a.id} className="p-5 flex flex-wrap items-center gap-4"><div className="flex-1 min-w-48"><p className="text-gray-900">{a.roomName}</p><p className="text-sm text-gray-600">{a.moveInOn ? `Move-in ${fmtDate(a.moveInOn)}` : 'No move-in date set'} · {taka(a.priceMonthBdt)}/month</p></div>
              <Badge variant={a.status === 'approved' ? 'secondary' : 'outline'}>{STATUS_LABEL[a.status]}</Badge>
              {(a.status === 'submitted' || a.status === 'under_review') && <Button size="sm" variant="outline" onClick={() => navigateToFrame('agewell', 'AW05_ModifyApplication', a)}>Modify</Button>}</Card>
          ))}</div>
        </section>
      )}

      <section aria-label="Available rooms"><h2 className="text-gray-900 mb-4">Available rooms</h2>
        <QueryState q={rooms} isEmpty={(r) => !r.length}>{(list) => <div className="grid md:grid-cols-2 gap-4">{list.map((r) => (
          <Card key={r.id} className="p-5 flex flex-col gap-2"><div className="flex items-start justify-between"><p className="text-gray-900">{r.name}</p><Badge variant="outline">{r.type}</Badge></div>
            <p className="text-sm text-gray-600">{r.sizeSqft ?? '—'} sq ft · {r.floor}</p><div className="flex flex-wrap gap-1">{r.features.map((f) => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}</div>
            <div className="flex items-center justify-between mt-auto pt-2"><span className="text-gray-900">{taka(r.priceMonthBdt)}/month <span className="text-xs text-green-700">· available {relativeDay(r.availableFrom).toLowerCase()}</span></span>
              <Button size="sm" disabled={open.some((a) => a.roomId === r.id)} onClick={() => navigateToFrame('agewell', 'AW04_ApplyNow', r)}>{open.some((a) => a.roomId === r.id) ? 'Applied' : 'Apply'}</Button></div>
          </Card>
        ))}</div>}</QueryState>
      </section>

      <section aria-label="Shared spaces"><h2 className="text-gray-900 mb-4">Shared spaces</h2><FacilityBooker /></section>
    </div>
  );
}
