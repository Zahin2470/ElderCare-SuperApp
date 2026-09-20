import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { errorMessage, get, post } from '../../lib/api';
import { fmtTime } from '../../lib/format';

export interface Group { id: string; name: string; members: number; lastMessage: string | null; lastMessageAt: string | null; unread: number; joined: boolean }
interface Message { id: number; body: string; createdAt: string; author: string; mine: boolean }

export const useGroups = () => useQuery({ queryKey: ['community', 'groups'], queryFn: () => get<{ groups: Group[] }>('/community/groups').then((r) => r.groups), refetchInterval: 20_000 });

/** Polls every few seconds while open. (Swap for a WebSocket if you need instant delivery.) */
export function GroupChat({ group, onBack }: { group: Group; onBack?: () => void }) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const msgs = useQuery({ queryKey: ['community', 'messages', group.id], queryFn: () => get<{ messages: Message[] }>(`/community/groups/${group.id}/messages`).then((r) => r.messages), refetchInterval: 5_000, enabled: group.joined });
  const join = useMutation({ mutationFn: () => post(`/community/groups/${group.id}/join`), onSuccess: () => qc.invalidateQueries({ queryKey: ['community', 'groups'] }), onError: (e) => toast.error(errorMessage(e)) });
  const send = useMutation({
    mutationFn: (body: string) => post(`/community/groups/${group.id}/messages`, { body }),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['community', 'messages', group.id] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  useEffect(() => { bottom.current?.scrollIntoView?.({ behavior: 'smooth' }); }, [msgs.data?.length]);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between"><div><p className="text-gray-900">{group.name}</p><p className="text-xs text-gray-500">{group.members} members</p></div>{onBack && <Button variant="ghost" size="sm" onClick={onBack}>Close</Button>}</div>
      {!group.joined ? (
        <div className="p-6 text-center space-y-3"><p className="text-gray-600">Join this group to read and post messages.</p><Button onClick={() => join.mutate()} disabled={join.isPending}>Join group</Button></div>
      ) : (<>
        <div className="h-72 overflow-y-auto p-4 space-y-2 bg-gray-50" role="log" aria-live="polite" aria-label={`${group.name} messages`}>
          {msgs.isLoading && <p className="text-gray-500" role="status">Loading…</p>}
          {msgs.data?.length === 0 && <p className="text-gray-500 text-center">No messages yet — say hello!</p>}
          {msgs.data?.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.mine ? 'bg-purple-600 text-white' : 'bg-white border'}`}>
                {!m.mine && <p className="text-xs text-purple-700">{m.author}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`text-[10px] ${m.mine ? 'text-purple-200' : 'text-gray-400'}`}>{fmtTime(m.createdAt)}</p>
              </div>
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(text.trim()); }} className="p-3 border-t flex gap-2">
          <input aria-label="Message" value={text} onChange={(e) => setText(e.target.value.slice(0, 2000))} placeholder="Write a message…" className="flex-1 rounded-lg border px-3 py-2" />
          <Button type="submit" disabled={!text.trim() || send.isPending} aria-label="Send"><Send className="w-4 h-4" /></Button>
        </form>
      </>)}
    </Card>
  );
}
