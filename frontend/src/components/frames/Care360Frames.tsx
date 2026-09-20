import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Download, FileText, Share2, Upload } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { QueryState } from '../common/QueryState';
import { useNavigation } from '../navigation/NavigationContext';
import { download, errorMessage, get, post, upload } from '../../lib/api';
import { fmtDate, taka, todayISO } from '../../lib/format';
import type { Doctor } from '../telehealth/DoctorCard';

export interface RecordDto { id: string; type: string; title: string; category: string; provider: string | null; recordDate: string; status: 'pending' | 'reviewed'; fileName: string | null; fileMime: string | null; fileSize: number | null; hasFile: boolean }
export interface Rx { id: string; medication: string; dosage: string; prescribedBy: string | null; startDate: string | null; refillsRemaining: number; status: string }
export const useRecords = () => useQuery({ queryKey: ['care360', 'records'], queryFn: () => get<{ records: RecordDto[] }>('/care360/records').then((r) => r.records) });
export const usePrescriptions = () => useQuery({ queryKey: ['care360', 'rx'], queryFn: () => get<{ prescriptions: Rx[] }>('/care360/prescriptions').then((r) => r.prescriptions) });

const kb = (n: number | null) => (n == null ? '' : n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function Back({ label = 'Back' }: { label?: string }) {
  const { navigateBack } = useNavigation();
  return <Button variant="ghost" onClick={navigateBack} className="-ml-2 mb-2"><ArrowLeft className="w-4 h-4 mr-2" aria-hidden />{label}</Button>;
}

export function RecordRow({ r, onOpen }: { r: RecordDto; onOpen: (r: RecordDto) => void }) {
  return (
    <Card className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer" onClick={() => onOpen(r)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(r)}>
      <div className="p-3 rounded-lg bg-blue-50"><FileText className="w-5 h-5 text-blue-600" aria-hidden /></div>
      <div className="flex-1 min-w-0"><p className="text-gray-900 truncate">{r.title}</p><p className="text-xs text-gray-500">{r.provider ?? r.type} · {fmtDate(r.recordDate)}</p></div>
      <Badge variant="outline">{r.category}</Badge>
      <Badge variant={r.status === 'reviewed' ? 'secondary' : 'outline'} className="capitalize">{r.status}</Badge>
    </Card>
  );
}

export function C360_RecordsList() {
  const { navigateToFrame } = useNavigation();
  const records = useRecords();
  const [q, setQ] = useState('');
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3"><div><Back label="Care360" /><h1 className="text-gray-900">Health records</h1></div><Button onClick={() => navigateToFrame('care360', 'C360_UploadRecord')}><Upload className="w-4 h-4 mr-2" aria-hidden />Upload</Button></div>
      <Input aria-label="Search records" placeholder="Search records" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 max-w-md" />
      <QueryState q={records} isEmpty={(r) => !r.length} empty="No records yet. Upload a lab report, prescription or visit summary.">
        {(list) => <div className="space-y-2">{list.filter((r) => `${r.title} ${r.provider ?? ''} ${r.category}`.toLowerCase().includes(q.toLowerCase())).map((r) => <RecordRow key={r.id} r={r} onOpen={(x) => navigateToFrame('care360', 'C360_ViewRecord', x)} />)}</div>}
      </QueryState>
    </div>
  );
}

export function C360_UploadRecord() {
  const { navigateToFrame } = useNavigation();
  const qc = useQueryClient();
  const [f, setF] = useState({ title: '', type: 'Lab Results', category: 'Labs', provider: '', recordDate: todayISO() });
  const [file, setFile] = useState<File | null>(null);
  const tooBig = !!file && file.size > 10 * 1024 * 1024;
  const badType = !!file && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type);
  const save = useMutation({
    mutationFn: () => { const form = new FormData(); Object.entries(f).forEach(([k, v]) => v && form.append(k, v)); if (file) form.append('file', file); return upload('/care360/records', form); },
    onSuccess: () => { toast.success('Record saved'); qc.invalidateQueries({ queryKey: ['care360'] }); navigateToFrame('care360', 'C360_RecordsList'); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div><Back /><h1 className="text-gray-900">Upload a record</h1></div>
      <Card className="p-6 space-y-4">
        <div><Label htmlFor="r-title">Title</Label><Input id="r-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="h-11" /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label htmlFor="r-type">Type</Label><select id="r-type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="w-full h-11 rounded-md border px-3 bg-white">{['Lab Results', 'Imaging', 'Prescription', 'Visit Summary', 'Insurance', 'Document'].map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><Label htmlFor="r-cat">Category</Label><select id="r-cat" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="w-full h-11 rounded-md border px-3 bg-white">{['Labs', 'Imaging', 'Prescriptions', 'Visits', 'Insurance', 'General'].map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><Label htmlFor="r-prov">Doctor / hospital (optional)</Label><Input id="r-prov" value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} className="h-11" /></div>
          <div><Label htmlFor="r-date">Date</Label><Input id="r-date" type="date" max={todayISO()} value={f.recordDate} onChange={(e) => setF({ ...f, recordDate: e.target.value })} className="h-11" /></div>
        </div>
        <div>
          <Label htmlFor="r-file">File (PDF, JPG or PNG, up to 10 MB)</Label>
          <Input id="r-file" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="h-11 pt-2" />
          {(tooBig || badType) && <p className="text-sm text-red-700 mt-1" role="alert">{tooBig ? 'That file is larger than 10 MB.' : 'Only PDF, JPG and PNG files are accepted.'}</p>}
        </div>
        <Button className="w-full h-12" disabled={!f.title.trim() || tooBig || badType || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Uploading…' : 'Save record'}</Button>
      </Card>
    </div>
  );
}

export function C360_ViewRecord() {
  const { navigateToFrame, currentNavigation } = useNavigation();
  const r = currentNavigation.data as RecordDto;
  const dl = useMutation({
    mutationFn: async () => { const blob = await download(`/care360/records/${r.id}/file`); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = r.fileName ?? 'record'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10_000); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div><Back label="Records" /><h1 className="text-gray-900">{r.title}</h1></div>
      <Card className="p-6 space-y-2">
        <div className="flex flex-wrap gap-2"><Badge variant="outline">{r.category}</Badge><Badge variant="secondary" className="capitalize">{r.status}</Badge></div>
        <p><span className="text-gray-600">Type:</span> {r.type}</p>
        <p><span className="text-gray-600">Date:</span> {fmtDate(r.recordDate)}</p>
        {r.provider && <p><span className="text-gray-600">From:</span> {r.provider}</p>}
        {r.hasFile ? <p><span className="text-gray-600">File:</span> {r.fileName} <span className="text-gray-400">({kb(r.fileSize)})</span></p> : <p className="text-gray-500">No file attached.</p>}
      </Card>
      <div className="flex flex-wrap gap-3">
        {r.hasFile && <Button onClick={() => dl.mutate()} disabled={dl.isPending}><Download className="w-4 h-4 mr-2" aria-hidden />{dl.isPending ? 'Preparing…' : 'Download'}</Button>}
        <Button variant="outline" onClick={() => navigateToFrame('care360', 'C360_ShareWithDoctor', r)}><Share2 className="w-4 h-4 mr-2" aria-hidden />Share with a doctor</Button>
      </div>
    </div>
  );
}

export function C360_ShareWithDoctor() {
  const { navigateToFrame, currentNavigation } = useNavigation();
  const r = currentNavigation.data as RecordDto;
  const doctors = useQuery({ queryKey: ['telehealth', 'doctors'], queryFn: () => get<{ doctors: Doctor[] }>('/telehealth/doctors').then((d) => d.doctors) });
  const [doctorId, setDoctorId] = useState('');
  const [days, setDays] = useState(7);
  const share = useMutation({
    mutationFn: () => post(`/care360/records/${r.id}/share`, { doctorId, days }),
    onSuccess: () => { toast.success(`Shared for ${days} day${days > 1 ? 's' : ''}. Access ends automatically.`); navigateToFrame('care360', 'C360_RecordsList'); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div><Back /><h1 className="text-gray-900">Share "{r.title}"</h1><p className="text-gray-600">Only the doctor you choose can see it, and only until the time you set. Every share is recorded.</p></div>
      <QueryState q={doctors} isEmpty={(d) => !d.length}>{(d) => (
        <Card className="p-5 space-y-2" role="radiogroup" aria-label="Choose a doctor">
          {d.map((x) => <button key={x.id} role="radio" aria-checked={doctorId === x.id} onClick={() => setDoctorId(x.id)} className={`w-full text-left p-3 rounded-lg border-2 ${doctorId === x.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}><p className="text-gray-900">{x.name}</p><p className="text-xs text-gray-500">{x.specialty} · {x.hospital} · {taka(x.feeBdt)}</p></button>)}
        </Card>
      )}</QueryState>
      <div className="flex flex-wrap items-center gap-2"><span className="text-sm text-gray-700">Share for</span>{[1, 7, 30].map((n) => <Button key={n} size="sm" variant={days === n ? 'default' : 'outline'} onClick={() => setDays(n)}>{n === 1 ? '1 day' : `${n} days`}</Button>)}</div>
      <Button className="w-full h-12" disabled={!doctorId || share.isPending} onClick={() => share.mutate()}>{share.isPending ? 'Sharing…' : 'Share record'}</Button>
    </div>
  );
}

export function C360_RequestRefill() {
  const qc = useQueryClient();
  const rx = usePrescriptions();
  const refill = useMutation({ mutationFn: (id: string) => post(`/care360/prescriptions/${id}/refill`), onSuccess: () => { toast.success('Refill requested'); qc.invalidateQueries({ queryKey: ['care360'] }); }, onError: (e) => toast.error(errorMessage(e)) });
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div><Back label="Care360" /><h1 className="text-gray-900">Request a refill</h1></div>
      <QueryState q={rx} isEmpty={(l) => !l.length} empty="No prescriptions on file.">{(list) => <div className="space-y-3">{list.map((p) => (
        <Card key={p.id} className="p-5 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-48"><p className="text-gray-900">{p.medication} <span className="text-gray-600">{p.dosage}</span></p><p className="text-xs text-gray-500">{p.prescribedBy}{p.startDate ? ` · since ${fmtDate(p.startDate)}` : ''}</p></div>
          <Badge variant={p.refillsRemaining ? 'secondary' : 'destructive'}>{p.refillsRemaining} refill{p.refillsRemaining === 1 ? '' : 's'} left</Badge>
          <Button size="sm" disabled={p.status !== 'active' || p.refillsRemaining < 1 || refill.isPending} onClick={() => refill.mutate(p.id)}>{p.refillsRemaining < 1 ? 'Book a consultation' : 'Request refill'}</Button>
        </Card>
      ))}</div>}</QueryState>
    </div>
  );
}
