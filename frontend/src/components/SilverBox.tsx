import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pill, Clock, AlertTriangle, CheckCircle2, Plus, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useNavigation } from './navigation/NavigationContext';
import { errorMessage, post } from '../lib/api';
import { clock, fmtDate } from '../lib/format';
import { Dose, keys, useAdherence, useDosesToday, useMedications } from '../lib/queries';

const STATUS: Record<Dose['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; border: string }> = {
  taken: { label: 'Taken', variant: 'secondary', border: 'border-green-200 bg-green-50/40' },
  skipped: { label: 'Skipped', variant: 'outline', border: 'border-gray-200' },
  missed: { label: 'Not marked', variant: 'destructive', border: 'border-red-200 bg-red-50/40' },
  upcoming: { label: 'Due soon', variant: 'default', border: 'border-blue-200 bg-blue-50/40' },
  scheduled: { label: 'Later today', variant: 'outline', border: 'border-gray-200' },
};

function AddMedicationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: '', dosage: '', purpose: '', stock: '', refill: '' });
  const [times, setTimes] = useState<string[]>(['08:00']);
  const add = useMutation({
    mutationFn: () => post('/medications', {
      name: f.name.trim(), dosage: f.dosage.trim(), purpose: f.purpose.trim() || undefined, scheduleTimes: times.filter(Boolean),
      stockRemaining: Number(f.stock) || 0, stockTotal: Number(f.stock) || 0, refillDate: f.refill || undefined,
    }),
    onSuccess: () => { toast.success('Medication added'); qc.invalidateQueries({ queryKey: ['meds'] }); qc.invalidateQueries({ queryKey: keys.dashboard }); onOpenChange(false); setF({ name: '', dosage: '', purpose: '', stock: '', refill: '' }); setTimes(['08:00']); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const valid = f.name.trim() && f.dosage.trim() && times.some(Boolean);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a medication</DialogTitle><DialogDescription>Enter it exactly as written on the prescription.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (valid) add.mutate(); }} className="space-y-3">
          <div><Label htmlFor="m-name">Medicine name</Label><Input id="m-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="h-11" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="m-dose">Dosage</Label><Input id="m-dose" placeholder="10mg" value={f.dosage} onChange={(e) => setF({ ...f, dosage: e.target.value })} className="h-11" /></div>
            <div><Label htmlFor="m-purpose">What it's for</Label><Input id="m-purpose" placeholder="Blood pressure" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} className="h-11" /></div>
          </div>
          <div>
            <Label>Times each day</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input type="time" aria-label={`Dose time ${i + 1}`} value={t} onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))} className="h-11 w-36" />
                  {times.length > 1 && <button type="button" aria-label="Remove time" onClick={() => setTimes(times.filter((_, j) => j !== i))} className="p-2 text-gray-500 hover:text-red-600"><X className="w-4 h-4" /></button>}
                </div>
              ))}
              {times.length < 6 && <Button type="button" variant="outline" size="sm" className="h-11" onClick={() => setTimes([...times, '20:00'])}><Plus className="w-4 h-4 mr-1" />Add time</Button>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="m-stock">Tablets in stock</Label><Input id="m-stock" inputMode="numeric" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value.replace(/\D/g, '') })} className="h-11" /></div>
            <div><Label htmlFor="m-refill">Refill by</Label><Input id="m-refill" type="date" value={f.refill} onChange={(e) => setF({ ...f, refill: e.target.value })} className="h-11" /></div>
          </div>
          <Button type="submit" className="w-full h-12" disabled={!valid || add.isPending}>{add.isPending ? 'Adding…' : 'Add medication'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SilverBox({ userRole }: { userRole: 'senior' | 'family' }) {
  const { navigateToFrame } = useNavigation();
  const doses = useDosesToday();
  const meds = useMedications();
  const adherence = useAdherence();
  const [adding, setAdding] = useState(false);

  const pct = (v: number | null | undefined) => (v == null ? '—' : `${v}%`);
  const stats = [
    { label: 'This week', value: adherence.data?.thisWeek }, { label: 'This month', value: adherence.data?.thisMonth }, { label: 'Taken on time', value: adherence.data?.onTime },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-gray-900 mb-2 flex items-center gap-2"><Pill className="w-7 h-7 text-purple-600" aria-hidden />SilverBox</h1>
          <p className="text-gray-600">{userRole === 'senior' ? 'Your medicines and reminders' : 'Their medicines and how the day is going'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigateToFrame('silverbox', 'SB04_Med_History')}>History</Button>
          <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-1" aria-hidden />Add medication</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-gray-600 mb-1">{s.label}</p>
            <p className="text-3xl text-purple-700 mb-2">{pct(s.value)}</p>
            <Progress value={s.value ?? 0} aria-label={`${s.label} adherence`} />
          </Card>
        ))}
        {adherence.data && adherence.data.thisWeek == null && <p className="md:col-span-3 text-sm text-gray-500">Adherence appears once a few doses have come due.</p>}
      </div>

      <section aria-label="Today's schedule">
        <h2 className="text-gray-900 mb-4">Today's schedule</h2>
        {doses.isLoading ? <p className="text-gray-500" role="status">Loading…</p> : doses.isError ? <p role="alert" className="text-red-700">{errorMessage(doses.error)}</p> : !doses.data?.length ? (
          <Card className="p-6 text-gray-600">No medicines scheduled today. Add one to get started.</Card>
        ) : (
          <div className="space-y-3">
            {doses.data.map((d) => {
              const st = STATUS[d.status]; const done = d.status === 'taken' || d.status === 'skipped';
              return (
                <Card key={`${d.medicationId}-${d.time}`} className={`p-5 border-2 ${st.border}`}>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className={`p-3 rounded-full ${d.status === 'taken' ? 'bg-green-100' : d.status === 'missed' ? 'bg-red-100' : 'bg-purple-100'}`}>
                      {d.status === 'taken' ? <CheckCircle2 className="w-6 h-6 text-green-600" aria-hidden /> : d.status === 'missed' ? <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden /> : <Pill className="w-6 h-6 text-purple-600" aria-hidden />}
                    </div>
                    <div className="flex-1 min-w-48">
                      <p className="text-gray-900">{d.name} <span className="text-gray-600">{d.dosage}</span></p>
                      <p className="text-sm text-gray-600 flex items-center gap-1"><Clock className="w-4 h-4" aria-hidden />{clock(d.time)}{d.purpose ? ` · ${d.purpose}` : ''}</p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                    {!done && <Button onClick={() => navigateToFrame('silverbox', 'SB02_MarkAsTaken', d)}>Mark as taken</Button>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-label="Medicine supply">
        <div className="flex items-center justify-between mb-4"><h2 className="text-gray-900">Supply & refills</h2><Button variant="ghost" size="sm" onClick={() => navigateToFrame('silverbox', 'SB01_MedsOverview')}>All medications →</Button></div>
        <div className="grid md:grid-cols-2 gap-4">
          {(meds.data ?? []).map((m) => {
            const pctLeft = m.stockTotal ? Math.round((m.stockRemaining / m.stockTotal) * 100) : 100;
            return (
              <Card key={m.id} className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div><p className="text-gray-900">{m.name} <span className="text-gray-600">{m.dosage}</span></p>{m.refillDate && <p className="text-xs text-gray-500">Refill by {fmtDate(m.refillDate)}</p>}</div>
                  <Badge variant={m.stockStatus === 'good' ? 'secondary' : 'destructive'}>{m.stockStatus === 'good' ? 'In stock' : m.stockStatus === 'low' ? 'Running low' : 'Almost out'}</Badge>
                </div>
                <Progress value={pctLeft} aria-label={`${m.name} supply remaining`} className="mb-2" />
                <div className="flex items-center justify-between text-sm text-gray-600"><span>{m.stockRemaining} of {m.stockTotal} left</span>
                  {m.stockStatus !== 'good' && <Button size="sm" variant="outline" onClick={() => navigateToFrame('care360', 'C360_RequestRefill')}>Request refill</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <AddMedicationDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
