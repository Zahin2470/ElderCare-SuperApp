import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Star, ShieldCheck, Video, MessageSquare } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { QueryState } from './common/QueryState';
import { ApiError, errorMessage, get, patch, post } from '../lib/api';
import { fmtDateTime, taka, todayISO } from '../lib/format';

interface Mentor { id: string; name: string; expertise: string; experience: string | null; skills: string[]; rateBdtHour: number; rating: number; reviewsCount: number; verified: boolean; bio: string | null; availability: string | null }
interface Session { id: string; topic: string; startsAt: string; durationMin: number; type: 'video' | 'chat'; status: string; mentorId: string; mentorName: string }

function BookDialog({ mentor, session, onClose }: { mentor?: Mentor; session?: Session; onClose: () => void }) {
  const qc = useQueryClient();
  const rescheduling = !!session;
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('10:00');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState<'video' | 'chat'>('video');
  const save = useMutation({
    mutationFn: () => (rescheduling ? patch(`/mentors/sessions/${session!.id}`, { date, time }) : post('/mentors/sessions', { mentorId: mentor!.id, topic: topic.trim(), date, time, durationMin: duration, type })),
    onSuccess: () => { toast.success(rescheduling ? 'Session rescheduled' : 'Session booked'); qc.invalidateQueries({ queryKey: ['mentors'] }); onClose(); },
    onError: (e) => toast.error(e instanceof ApiError && e.code === 'unavailable' ? 'The mentor is busy then — please pick another time.' : errorMessage(e)),
  });
  const name = mentor?.name ?? session?.mentorName;
  const valid = rescheduling || topic.trim().length >= 2;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{rescheduling ? 'Reschedule session' : `Book ${name}`}</DialogTitle><DialogDescription>{rescheduling ? session!.topic : mentor && `${taka(mentor.rateBdtHour)} per hour`}</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate(); }} className="space-y-3">
          {!rescheduling && <div><Label htmlFor="gc-topic">What would you like help with?</Label><Input id="gc-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="h-11" /></div>}
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="gc-date">Date</Label><Input id="gc-date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className="h-11" /></div>
            <div><Label htmlFor="gc-time">Time</Label><Input id="gc-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11" /></div>
          </div>
          {!rescheduling && (
            <div className="flex flex-wrap gap-2">
              {[30, 60, 90].map((d) => <Button key={d} type="button" size="sm" variant={duration === d ? 'default' : 'outline'} onClick={() => setDuration(d)}>{d} min</Button>)}
              <Button type="button" size="sm" variant={type === 'video' ? 'default' : 'outline'} onClick={() => setType('video')}><Video className="w-4 h-4 mr-1" aria-hidden />Video</Button>
              <Button type="button" size="sm" variant={type === 'chat' ? 'default' : 'outline'} onClick={() => setType('chat')}><MessageSquare className="w-4 h-4 mr-1" aria-hidden />Chat</Button>
            </div>
          )}
          <Button type="submit" className="w-full h-12" disabled={!valid || save.isPending}>{save.isPending ? 'Saving…' : rescheduling ? 'Reschedule' : 'Confirm booking'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function GoldenCareJobs() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [expertise, setExpertise] = useState('');
  const [booking, setBooking] = useState<Mentor | null>(null);
  const [resched, setResched] = useState<Session | null>(null);
  const mentors = useQuery({ queryKey: ['mentors', 'list', q, expertise], queryFn: () => get<{ mentors: Mentor[] }>('/mentors', { q, expertise }).then((r) => r.mentors) });
  const cats = useQuery({ queryKey: ['mentors', 'categories'], queryFn: () => get<{ categories: { name: string; count: number }[] }>('/mentors/categories').then((r) => r.categories) });
  const sessions = useQuery({ queryKey: ['mentors', 'sessions'], queryFn: () => get<{ sessions: Session[] }>('/mentors/sessions').then((r) => r.sessions) });
  const cancel = useMutation({ mutationFn: (id: string) => post(`/mentors/sessions/${id}/cancel`), onSuccess: () => { toast.success('Session cancelled'); qc.invalidateQueries({ queryKey: ['mentors'] }); }, onError: (e) => toast.error(errorMessage(e)) });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div><h1 className="text-gray-900 mb-2">GoldenCare</h1><p className="text-gray-600">Learn from experienced mentors — or share your own experience</p></div>

      <section aria-label="Your sessions">
        <h2 className="text-gray-900 mb-4">Your sessions</h2>
        <QueryState q={sessions} isEmpty={(s) => !s.length} empty="No sessions booked. Pick a mentor below.">
          {(s) => <div className="space-y-3">{s.map((x) => (
            <Card key={x.id} className="p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-52"><p className="text-gray-900">{x.topic}</p><p className="text-sm text-gray-600">{x.mentorName} · {fmtDateTime(x.startsAt)} · {x.durationMin} min</p></div>
              <Badge variant="outline" className="capitalize">{x.type}</Badge>
              <Button variant="outline" size="sm" onClick={() => setResched(x)}>Reschedule</Button>
              <Button variant="ghost" size="sm" className="text-red-600" disabled={cancel.isPending} onClick={() => { if (window.confirm('Cancel this session?')) cancel.mutate(x.id); }}>Cancel</Button>
            </Card>
          ))}</div>}
        </QueryState>
      </section>

      <section aria-label="Find a mentor">
        <h2 className="text-gray-900 mb-4">Find a mentor</h2>
        <Input aria-label="Search mentors" placeholder="Search by name or skill" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 max-w-md mb-3" />
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter by area">
          <Button size="sm" variant={!expertise ? 'default' : 'outline'} onClick={() => setExpertise('')}>All</Button>
          {(cats.data ?? []).map((c) => <Button key={c.name} size="sm" variant={expertise === c.name ? 'default' : 'outline'} onClick={() => setExpertise(c.name)}>{c.name} ({c.count})</Button>)}
        </div>
        <QueryState q={mentors} isEmpty={(m) => !m.length} empty="No mentors match your search.">
          {(m) => <div className="grid md:grid-cols-2 gap-4">{m.map((x) => (
            <Card key={x.id} className="p-5 flex flex-col gap-2">
              <div className="flex items-start justify-between"><div><p className="text-gray-900 flex items-center gap-2">{x.name}{x.verified && <ShieldCheck className="w-4 h-4 text-green-600" aria-label="Verified" />}</p><p className="text-sm text-purple-700">{x.expertise}</p></div>
                <span className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-hidden />{x.rating.toFixed(1)} ({x.reviewsCount})</span></div>
              <p className="text-sm text-gray-600">{x.experience}</p>{x.bio && <p className="text-sm text-gray-600">{x.bio}</p>}
              <div className="flex flex-wrap gap-1">{x.skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
              <div className="flex items-center justify-between mt-auto pt-2"><span className="text-gray-900">{taka(x.rateBdtHour)}/hour</span><Button size="sm" onClick={() => setBooking(x)}>Book session</Button></div>
              {x.availability && <p className="text-xs text-green-700">{x.availability}</p>}
            </Card>
          ))}</div>}
        </QueryState>
      </section>

      {booking && <BookDialog mentor={booking} onClose={() => setBooking(null)} />}
      {resched && <BookDialog session={resched} onClose={() => setResched(null)} />}
    </div>
  );
}
