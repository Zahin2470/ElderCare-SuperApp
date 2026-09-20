import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { errorMessage, get, post } from '../../lib/api';

/** A family member asks to link to a senior; nothing is visible until the senior accepts. */
export function FamilyInvite() {
  const [target, setTarget] = useState('');
  const [relation, setRelation] = useState('');
  const invite = useMutation({
    mutationFn: () => post('/family/invite', { target: target.trim(), relation: relation.trim() || undefined }),
    onSuccess: () => { toast.success('Request sent. They will see it next time they open ElderCare and must accept before you can see anything.'); setTarget(''); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Card className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-3"><Users className="w-6 h-6 text-purple-600" aria-hidden /><h2 className="text-gray-900">Connect with your loved one</h2></div>
      <p className="text-gray-600 mb-4">Enter the phone number or email they used to sign up. They'll get a request and choose whether to share their care information with you.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (target.trim().length >= 3) invite.mutate(); }} className="space-y-3">
        <div><Label htmlFor="fl-target">Their phone or email</Label><Input id="fl-target" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="01712345678 or name@example.com" className="h-12" /></div>
        <div><Label htmlFor="fl-rel">Your relationship (optional)</Label><Input id="fl-rel" value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Daughter, Son, Nephew…" className="h-12" /></div>
        <Button type="submit" disabled={invite.isPending || target.trim().length < 3} className="w-full h-12">{invite.isPending ? 'Sending…' : 'Send request'}</Button>
      </form>
    </Card>
  );
}

/** Shown to seniors when someone has asked to see their care information. */
export function FamilyRequests() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['family', 'requests'], queryFn: () => get<{ requests: { familyId: string; fullName: string; relation: string | null }[] }>('/family/requests') });
  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'reject' }) => post(`/family/requests/${id}/${action}`),
    onSuccess: (_r, v) => { toast.success(v.action === 'accept' ? 'Access granted. You can remove it any time.' : 'Request declined.'); qc.invalidateQueries({ queryKey: ['family'] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (!data?.requests.length) return null;
  return (
    <Card className="p-5 border-l-4 border-l-purple-500 bg-purple-50/50" role="region" aria-label="Family access requests">
      <h3 className="text-gray-900 mb-3">Someone wants to help look after you</h3>
      <div className="space-y-3">
        {data.requests.map((r) => (
          <div key={r.familyId} className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-gray-800"><strong>{r.fullName}</strong>{r.relation ? ` (${r.relation})` : ''} would like to see your medicines, readings and appointments.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => respond.mutate({ id: r.familyId, action: 'accept' })} disabled={respond.isPending}>Allow</Button>
              <Button size="sm" variant="outline" onClick={() => respond.mutate({ id: r.familyId, action: 'reject' })} disabled={respond.isPending}>Decline</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
