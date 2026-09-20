import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { QueryState } from '../common/QueryState';
import { useAuditLogs } from './adminApi';
import { fmtDateTime } from '../../lib/format';

const PREFIXES = ['', 'auth', 'admin', 'record', 'family'];

export function AuditLogs() {
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);
  const logs = useAuditLogs({ action, from, to, page });
  const reset = (fn: () => void) => { fn(); setPage(1); };
  return (
    <div className="space-y-5">
      <div><h1 className="text-gray-900">Audit log</h1><p className="text-gray-600">An append-only record of sign-ins, admin actions and access to health records. It cannot be edited or deleted.</p></div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Event type<select value={action} onChange={(e) => reset(() => setAction(e.target.value))} className="block h-11 rounded-md border px-3 bg-white">{PREFIXES.map((p) => <option key={p} value={p}>{p || 'All'}</option>)}</select></label>
        <label className="text-sm">From<Input type="date" value={from} onChange={(e) => reset(() => setFrom(e.target.value))} className="h-11" /></label>
        <label className="text-sm">To<Input type="date" value={to} onChange={(e) => reset(() => setTo(e.target.value))} className="h-11" /></label>
      </div>
      <QueryState q={logs} isEmpty={(d) => !d.logs.length} empty="No events match.">{(d) => (<>
        <Card className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600"><tr>{['When', 'Event', 'By', 'IP', ''].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{d.logs.map((l) => (<>
            <tr key={l.id}>
              <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtDateTime(l.createdAt)}</td>
              <td className="px-4 py-3"><Badge variant={/failed|reuse/.test(l.action) ? 'destructive' : 'outline'} className="font-mono text-xs">{l.action}</Badge></td>
              <td className="px-4 py-3">{l.actorName ?? '—'}{l.actorRole && <span className="text-xs text-gray-500"> ({l.actorRole})</span>}</td>
              <td className="px-4 py-3 text-gray-500 font-mono text-xs">{l.ip ?? '—'}</td>
              <td className="px-4 py-3 text-right">{Object.keys(l.metadata).length > 0 && <Button size="sm" variant="ghost" onClick={() => setOpen(open === l.id ? null : l.id)}>{open === l.id ? 'Hide' : 'Details'}</Button>}</td>
            </tr>
            {open === l.id && <tr key={`${l.id}-d`}><td colSpan={5} className="px-4 pb-3"><pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">{JSON.stringify(l.metadata, null, 2)}</pre></td></tr>}
          </>))}</tbody></table></Card>
        <div className="flex justify-end items-center gap-2 text-sm text-gray-600"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Newer</Button><span>Page {page}</span><Button size="sm" variant="outline" disabled={d.logs.length < d.pageSize} onClick={() => setPage(page + 1)}>Older</Button></div>
      </>)}</QueryState>
    </div>
  );
}
