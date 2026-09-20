import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { QueryState } from '../common/QueryState';
import { GroupChat, useGroups } from '../community/GroupChat';
import { useNavigation } from '../navigation/NavigationContext';
import { ApiError, errorMessage, patch, post } from '../../lib/api';
import { fmtDate, taka } from '../../lib/format';

export interface Room { id: string; name: string; type: string; sizeSqft: number | null; floor: string | null; features: string[]; priceMonthBdt: number; availableFrom: string }
export interface Application { id: string; status: 'submitted' | 'under_review' | 'approved' | 'withdrawn'; moveInOn: string | null; note: string | null; createdAt: string; roomId: string; roomName: string; priceMonthBdt: number }

function Back({ label = 'Back' }: { label?: string }) {
  const { navigateBack } = useNavigation();
  return <Button variant="ghost" onClick={navigateBack} className="-ml-2 mb-2"><ArrowLeft className="w-4 h-4 mr-2" aria-hidden />{label}</Button>;
}

export function AW01_CommunityChatRoom() {
  const groups = useGroups();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div><Back label="AgeWell" /><h1 className="text-gray-900">Community chat</h1></div>
      <QueryState q={groups} isEmpty={(g) => !g.length} empty="No chat groups yet.">
        {(list) => { const g = list.find((x) => x.id === open); return g ? <GroupChat group={g} onBack={() => setOpen(null)} /> : (
          <div className="space-y-3">{list.map((x) => <Card key={x.id} className="p-4 flex items-center gap-3"><div className="flex-1"><p className="text-gray-900">{x.name}</p><p className="text-xs text-gray-500">{x.members} members</p></div>{x.unread > 0 && <Badge>{x.unread} new</Badge>}<Button size="sm" onClick={() => setOpen(x.id)}>{x.joined ? 'Open' : 'View'}</Button></Card>)}</div>
        ); }}
      </QueryState>
    </div>
  );
}

export function AW04_ApplyNow() {
  const { navigateToFrame, currentNavigation } = useNavigation();
  const qc = useQueryClient();
  const room = currentNavigation.data as Room;
  const [moveIn, setMoveIn] = useState(room.availableFrom);
  const [note, setNote] = useState('');
  const apply = useMutation({
    mutationFn: () => post('/agewell/applications', { roomId: room.id, moveInOn: moveIn || undefined, note: note.trim() || undefined }),
    onSuccess: () => { toast.success('Application submitted'); qc.invalidateQueries({ queryKey: ['agewell'] }); navigateToFrame('agewell', null); },
    onError: (e) => toast.error(e instanceof ApiError && e.code === 'already_applied' ? 'You already have an open application for this room.' : errorMessage(e)),
  });
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div><Back /><h1 className="text-gray-900">Apply for {room.name}</h1></div>
      <Card className="p-5"><p className="text-gray-900">{room.type} · {room.sizeSqft ?? '—'} sq ft · {room.floor}</p><p className="text-sm text-gray-600">{room.features.join(', ')}</p><p className="mt-2 text-lg text-gray-900">{taka(room.priceMonthBdt)}/month</p></Card>
      <Card className="p-6 space-y-4">
        <div><Label htmlFor="a-date">Preferred move-in date</Label><Input id="a-date" type="date" min={room.availableFrom} value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className="h-11 max-w-xs" /></div>
        <div><Label htmlFor="a-note">Anything the community team should know? (optional)</Label><textarea id="a-note" rows={4} value={note} onChange={(e) => setNote(e.target.value.slice(0, 1000))} className="mt-1 w-full rounded-md border p-3" /></div>
        <Button className="w-full h-12" disabled={apply.isPending} onClick={() => apply.mutate()}>{apply.isPending ? 'Submitting…' : 'Submit application'}</Button>
      </Card>
    </div>
  );
}

export function AW05_ModifyApplication() {
  const { navigateToFrame, currentNavigation } = useNavigation();
  const qc = useQueryClient();
  const app = currentNavigation.data as Application;
  const [moveIn, setMoveIn] = useState(app.moveInOn ?? '');
  const [note, setNote] = useState(app.note ?? '');
  const done = () => { qc.invalidateQueries({ queryKey: ['agewell'] }); navigateToFrame('agewell', null); };
  const save = useMutation({ mutationFn: () => patch(`/agewell/applications/${app.id}`, { moveInOn: moveIn || undefined, note: note.trim() || undefined }), onSuccess: () => { toast.success('Application updated'); done(); }, onError: (e) => toast.error(errorMessage(e)) });
  const withdraw = useMutation({ mutationFn: () => patch(`/agewell/applications/${app.id}`, { withdraw: true }), onSuccess: () => { toast.success('Application withdrawn'); done(); }, onError: (e) => toast.error(errorMessage(e)) });
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div><Back /><h1 className="text-gray-900">Your application</h1><p className="text-gray-600">{app.roomName} · submitted {fmtDate(app.createdAt)}</p></div>
      <Card className="p-6 space-y-4">
        <div><Label htmlFor="m-date">Move-in date</Label><Input id="m-date" type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className="h-11 max-w-xs" /></div>
        <div><Label htmlFor="m-note">Note</Label><textarea id="m-note" rows={4} value={note} onChange={(e) => setNote(e.target.value.slice(0, 1000))} className="mt-1 w-full rounded-md border p-3" /></div>
        <div className="flex gap-3"><Button className="flex-1 h-12" disabled={save.isPending} onClick={() => save.mutate()}>Save changes</Button>
          <Button variant="outline" className="h-12 text-red-600" disabled={withdraw.isPending} onClick={() => { if (window.confirm('Withdraw this application?')) withdraw.mutate(); }}>Withdraw</Button></div>
      </Card>
    </div>
  );
}
