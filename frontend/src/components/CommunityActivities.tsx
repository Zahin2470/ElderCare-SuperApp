import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Video } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Recommendations } from './ai/Recommendations';
import { QueryState } from './common/QueryState';
import { Group, GroupChat, useGroups } from './community/GroupChat';
import { ApiError, del, errorMessage, get, post } from '../lib/api';
import { fmtDate, fmtTime } from '../lib/format';

export interface EventDto { id: string; title: string; description: string | null; category: string; startsAt: string; endsAt: string; location: string | null; mode: 'in-person' | 'virtual'; capacity: number; attendees: number; registered: boolean }

export function EventCard({ e }: { e: EventDto }) {
  const qc = useQueryClient();
  const left = e.capacity - e.attendees;
  const refresh = () => { for (const k of ['community', 'ai', 'dashboard', 'rewards']) qc.invalidateQueries({ queryKey: [k] }); };
  const rsvp = useMutation({
    mutationFn: () => post<{ pointsAwarded: number }>(`/community/events/${e.id}/rsvp`),
    onSuccess: (r) => { toast.success(r.pointsAwarded ? `You're in! +${r.pointsAwarded} points` : "You're in!"); refresh(); },
    onError: (err) => { toast.error(err instanceof ApiError && err.code === 'full' ? 'Sorry — this event just filled up.' : errorMessage(err)); refresh(); },
  });
  const cancel = useMutation({ mutationFn: () => del(`/community/events/${e.id}/rsvp`), onSuccess: () => { toast.success('RSVP cancelled'); refresh(); }, onError: (err) => toast.error(errorMessage(err)) });

  return (
    <Card className="p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2"><p className="text-gray-900">{e.title}</p><Badge variant="outline">{e.category}</Badge></div>
      {e.description && <p className="text-sm text-gray-600">{e.description}</p>}
      <p className="text-sm text-gray-700 flex items-center gap-1"><Calendar className="w-4 h-4" aria-hidden />{fmtDate(e.startsAt, { weekday: 'short', month: 'short', day: 'numeric' })} · {fmtTime(e.startsAt)} – {fmtTime(e.endsAt)}</p>
      <p className="text-sm text-gray-700 flex items-center gap-1">{e.mode === 'virtual' ? <Video className="w-4 h-4" aria-hidden /> : <MapPin className="w-4 h-4" aria-hidden />}{e.location}</p>
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="text-sm text-gray-600 flex items-center gap-1"><Users className="w-4 h-4" aria-hidden />{e.attendees}/{e.capacity}{left > 0 && left <= 3 ? <span className="text-orange-600"> · {left} left</span> : null}</span>
        {e.registered ? <Button variant="outline" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate()}>Cancel RSVP</Button>
          : <Button size="sm" disabled={left <= 0 || rsvp.isPending} onClick={() => rsvp.mutate()}>{left <= 0 ? 'Full' : rsvp.isPending ? 'Joining…' : 'Join'}</Button>}
      </div>
      {e.registered && <Badge variant="secondary" className="w-fit">You're going</Badge>}
    </Card>
  );
}

const TABS = [['upcoming', 'Upcoming'], ['mine', 'My events'], ['groups', 'Groups']] as const;

export default function CommunityActivities() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('upcoming');
  const [category, setCategory] = useState('');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const events = useQuery({ queryKey: ['community', 'events', category], queryFn: () => get<{ events: EventDto[] }>('/community/events', { category }).then((r) => r.events) });
  const mine = useQuery({ queryKey: ['community', 'events', 'mine'], queryFn: () => get<{ events: EventDto[] }>('/community/events/mine').then((r) => r.events) });
  const groups = useGroups();
  const categories = [...new Set((events.data ?? []).map((e) => e.category))];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div><h1 className="text-gray-900 mb-2">Community Activities</h1><p className="text-gray-600">Meet people, stay active, learn something new</p></div>
      <div role="tablist" aria-label="Community sections" className="flex gap-2 border-b">
        {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`px-4 py-2 -mb-px border-b-2 ${tab === id ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>{label}</button>)}
      </div>

      {tab === 'upcoming' && (<>
        <Recommendations type="events" title="Suggested for you" />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <Button size="sm" variant={!category ? 'default' : 'outline'} onClick={() => setCategory('')}>All</Button>
          {(category && !categories.includes(category) ? [category, ...categories] : categories).map((c) => <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} onClick={() => setCategory(c)}>{c}</Button>)}
        </div>
        <QueryState q={events} isEmpty={(l) => !l.length} empty="No upcoming events in this category.">{(l) => <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{l.map((e) => <EventCard key={e.id} e={e} />)}</div>}</QueryState>
      </>)}

      {tab === 'mine' && <QueryState q={mine} isEmpty={(l) => !l.length} empty="You haven't joined any events yet.">{(l) => <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{l.map((e) => <EventCard key={e.id} e={e} />)}</div>}</QueryState>}

      {tab === 'groups' && (
        <QueryState q={groups} isEmpty={(g) => !g.length}>
          {(list) => {
            const current: Group | undefined = list.find((g) => g.id === openGroup);
            return current ? <GroupChat group={current} onBack={() => setOpenGroup(null)} /> : (
              <div className="grid md:grid-cols-2 gap-4">{list.map((g) => (
                <Card key={g.id} className="p-5 flex items-center gap-4">
                  <div className="flex-1"><p className="text-gray-900">{g.name}</p><p className="text-xs text-gray-500">{g.members} members{g.lastMessage ? ` · ${g.lastMessage.slice(0, 40)}` : ''}</p></div>
                  {g.unread > 0 && <Badge>{g.unread} new</Badge>}
                  <Button size="sm" variant={g.joined ? 'default' : 'outline'} onClick={() => setOpenGroup(g.id)}>{g.joined ? 'Open' : 'View'}</Button>
                </Card>
              ))}</div>
            );
          }}
        </QueryState>
      )}
    </div>
  );
}
