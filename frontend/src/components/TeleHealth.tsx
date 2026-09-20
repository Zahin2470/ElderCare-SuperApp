import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Video, MapPin, Search } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import DoctorCard, { Doctor } from './telehealth/DoctorCard';
import { QueryState } from './common/QueryState';
import { ApiError, errorMessage, get, post } from '../lib/api';
import { clock, fmtDateTime, taka, todayISO } from '../lib/format';

interface Appt { id: string; startsAt: string; type: 'video' | 'in_person' | 'chat'; reason: string | null; location: string | null; status: string; diagnosis: string | null; consultNotes: string | null; doctorId: string; doctorName: string; specialty: string; hospital: string | null }
interface Slots { date: string; slots: { time: string; available: boolean }[] }

function BookingView({ doctor, onDone, onBack }: { doctor: Doctor; onDone: () => void; onBack: () => void }) {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('');
  const [type, setType] = useState<'video' | 'in_person'>('video');
  const [reason, setReason] = useState('');
  const slots = useQuery({ queryKey: ['telehealth', 'slots', doctor.id, date], queryFn: () => get<Slots>(`/telehealth/doctors/${doctor.id}/slots`, { date }) });

  const book = useMutation({
    mutationFn: () => post('/telehealth/appointments', { doctorId: doctor.id, date, time, type, reason: reason.trim() || undefined }),
    onSuccess: () => { toast.success(`Booked with ${doctor.name} at ${clock(time)}`); qc.invalidateQueries({ queryKey: ['telehealth'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); onDone(); },
    onError: (e) => {
      toast.error(errorMessage(e));
      if (e instanceof ApiError && e.code === 'slot_taken') { setTime(''); slots.refetch(); }   // someone else got it first
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div><Button variant="ghost" onClick={onBack} className="-ml-2 mb-2"><ArrowLeft className="w-4 h-4 mr-2" aria-hidden />Back</Button><h1 className="text-gray-900">Book a consultation</h1></div>
      <DoctorCard doctor={doctor} />
      <Card className="p-6 space-y-5">
        <div><Label htmlFor="tb-date">Date</Label><Input id="tb-date" type="date" min={todayISO()} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} className="h-12 max-w-xs" /></div>
        <div>
          <p className="mb-2 text-sm">Available times</p>
          <QueryState q={slots}>{(s) => (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Time slots">
              {s.slots.map((sl) => (
                <Button key={sl.time} type="button" role="radio" aria-checked={time === sl.time} variant={time === sl.time ? 'default' : 'outline'} disabled={!sl.available} onClick={() => setTime(sl.time)}>{clock(sl.time)}</Button>
              ))}
            </div>
          )}</QueryState>
        </div>
        <div>
          <p className="mb-2 text-sm">Visit type</p>
          <div className="flex gap-2">
            {([['video', 'Video call', Video], ['in_person', 'In person', MapPin]] as const).map(([v, label, Icon]) => (
              <Button key={v} type="button" variant={type === v ? 'default' : 'outline'} aria-pressed={type === v} onClick={() => setType(v)}><Icon className="w-4 h-4 mr-2" aria-hidden />{label}</Button>
            ))}
          </div>
        </div>
        <div><Label htmlFor="tb-reason">Reason for visit (optional)</Label><textarea id="tb-reason" value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))} rows={3} className="mt-1 w-full rounded-md border p-3" /></div>
        <div className="flex items-center justify-between border-t pt-4"><span className="text-gray-600">Consultation fee</span><span className="text-xl text-gray-900">{taka(doctor.feeBdt)}</span></div>
        <Button className="w-full h-12" disabled={!time || book.isPending} onClick={() => book.mutate()}>{book.isPending ? 'Booking…' : 'Confirm booking'}</Button>
      </Card>
    </div>
  );
}

export default function TeleHealth() {
  const qc = useQueryClient();
  const [booking, setBooking] = useState<Doctor | null>(null);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState<string | null>(null);
  const doctors = useQuery({ queryKey: ['telehealth', 'doctors'], queryFn: () => get<{ doctors: Doctor[] }>('/telehealth/doctors').then((r) => r.doctors) });
  const appts = useQuery({ queryKey: ['telehealth', 'appointments'], queryFn: () => get<{ upcoming: Appt[]; past: Appt[] }>('/telehealth/appointments') });
  const specialties = useMemo(() => [...new Set((doctors.data ?? []).map((d) => d.specialty))], [doctors.data]);
  const shown = (doctors.data ?? []).filter((d) => (!specialty || d.specialty === specialty) && (`${d.name} ${d.hospital ?? ''} ${d.specialty}`).toLowerCase().includes(search.toLowerCase()));

  const join = useMutation({
    mutationFn: (id: string) => get<{ url: string }>(`/telehealth/appointments/${id}/join`),
    onSuccess: (r) => window.open(r.url, '_blank', 'noopener,noreferrer'),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => post(`/telehealth/appointments/${id}/cancel`),
    onSuccess: () => { toast.success('Appointment cancelled'); qc.invalidateQueries({ queryKey: ['telehealth'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (booking) return <BookingView doctor={booking} onBack={() => setBooking(null)} onDone={() => setBooking(null)} />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div><h1 className="text-gray-900 mb-2">TeleHealth</h1><p className="text-gray-600">Talk to a doctor from home</p></div>

      <section aria-label="Upcoming appointments">
        <h2 className="text-gray-900 mb-4">Upcoming appointments</h2>
        <QueryState q={appts} isEmpty={(a) => !a.upcoming.length} empty="No upcoming appointments. Choose a doctor below to book one.">
          {(a) => (
            <div className="space-y-3">{a.upcoming.map((x) => (
              <Card key={x.id} className="p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-52"><p className="text-gray-900">{x.doctorName}</p><p className="text-sm text-gray-600">{x.specialty} · {fmtDateTime(x.startsAt)}</p>{x.reason && <p className="text-xs text-gray-500">{x.reason}</p>}</div>
                <Badge variant="outline">{x.type === 'video' ? 'Video' : x.type === 'in_person' ? `In person${x.location ? ` · ${x.location}` : ''}` : 'Chat'}</Badge>
                {x.type === 'video' && <Button onClick={() => join.mutate(x.id)} disabled={join.isPending}><Video className="w-4 h-4 mr-2" aria-hidden />Join call</Button>}
                <Button variant="ghost" className="text-red-600" disabled={cancel.isPending} onClick={() => { if (window.confirm('Cancel this appointment?')) cancel.mutate(x.id); }}>Cancel</Button>
              </Card>
            ))}</div>
          )}
        </QueryState>
      </section>

      <section aria-label="Find a doctor">
        <h2 className="text-gray-900 mb-4">Find a doctor</h2>
        <div className="relative mb-3 max-w-md"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden /><Input aria-label="Search doctors" placeholder="Search by name or hospital" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-11" /></div>
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter by specialty">
          <Button size="sm" variant={specialty === null ? 'default' : 'outline'} onClick={() => setSpecialty(null)}>All</Button>
          {specialties.map((s) => <Button key={s} size="sm" variant={specialty === s ? 'default' : 'outline'} onClick={() => setSpecialty(s)}>{s}</Button>)}
        </div>
        <QueryState q={doctors} isEmpty={() => !shown.length} empty="No doctors match your search.">{() => <div className="grid md:grid-cols-2 gap-4">{shown.map((d) => <DoctorCard key={d.id} doctor={d} onBook={setBooking} />)}</div>}</QueryState>
      </section>

      <section aria-label="Past consultations">
        <h2 className="text-gray-900 mb-4">Past consultations</h2>
        <QueryState q={appts} isEmpty={(a) => !a.past.length} empty="Your completed consultations will appear here.">
          {(a) => <div className="space-y-3">{a.past.map((x) => (
            <Card key={x.id} className="p-5"><p className="text-gray-900">{x.doctorName} <span className="text-gray-500 text-sm">· {fmtDateTime(x.startsAt)}</span></p>
              {x.diagnosis && <p className="text-sm text-gray-700 mt-1"><strong>Diagnosis:</strong> {x.diagnosis}</p>}{x.consultNotes && <p className="text-sm text-gray-600">{x.consultNotes}</p>}</Card>
          ))}</div>}
        </QueryState>
      </section>
    </div>
  );
}
