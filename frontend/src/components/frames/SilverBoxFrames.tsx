import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Pill, AlertTriangle, Trash2, SkipForward } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useNavigation } from '../navigation/NavigationContext';
import { del, errorMessage, get } from '../../lib/api';
import { clock, fmtDate, fmtTime } from '../../lib/format';
import { Dose, useDoseAction, useMedications } from '../../lib/queries';

function Back({ label = 'Back' }: { label?: string }) {
  const { navigateBack } = useNavigation();
  return <Button variant="ghost" onClick={navigateBack} className="-ml-2 mb-2"><ArrowLeft className="w-4 h-4 mr-2" aria-hidden />{label}</Button>;
}

/** All medications, with the option to stop tracking one. */
export function SB01_MedsOverview() {
  const meds = useMedications();
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => del(`/medications/${id}`),
    onSuccess: () => { toast.success('Medication removed'); qc.invalidateQueries({ queryKey: ['meds'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div><Back label="SilverBox" /><h1 className="text-gray-900">All medications</h1></div>
      {meds.isLoading ? <p role="status" className="text-gray-500">Loading…</p> : !meds.data?.length ? <Card className="p-6 text-gray-600">No medications yet.</Card> : meds.data.map((m) => (
        <Card key={m.id} className="p-5 flex flex-wrap items-center gap-4">
          <div className="p-3 rounded-full bg-purple-100"><Pill className="w-6 h-6 text-purple-600" aria-hidden /></div>
          <div className="flex-1 min-w-48">
            <p className="text-gray-900">{m.name} <span className="text-gray-600">{m.dosage}</span></p>
            <p className="text-sm text-gray-600">{m.purpose ?? 'No purpose noted'} · {m.scheduleTimes.map(clock).join(', ')}</p>
          </div>
          <Badge variant={m.stockStatus === 'good' ? 'secondary' : 'destructive'}>{m.stockRemaining} left</Badge>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={remove.isPending}
            onClick={() => { if (window.confirm(`Stop tracking ${m.name}? Your history is kept.`)) remove.mutate(m.id); }}>
            <Trash2 className="w-4 h-4 mr-1" aria-hidden />Remove
          </Button>
        </Card>
      ))}
    </div>
  );
}

/** Confirm a dose was taken (or deliberately skipped). Nothing is recorded until the person confirms. */
function ConfirmDose({ heading }: { heading: string }) {
  const { navigateToFrame, currentNavigation } = useNavigation();
  const dose = currentNavigation.data as Dose;
  const act = useDoseAction();
  const late = dose.status === 'missed';

  const submit = (action: 'take' | 'skip') =>
    act.mutate({ id: dose.medicationId, time: dose.time, action }, {
      onSuccess: (r) => {
        toast.success(r.alreadyLogged ? `${dose.name} was already recorded.` : action === 'take' ? `${dose.name} marked as taken${r.pointsAwarded ? ` · +${r.pointsAwarded} points` : ''}` : `${dose.name} skipped`);
        navigateToFrame('silverbox', null);
      },
      onError: (e) => toast.error(errorMessage(e)),
    });

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div><Back /><h1 className="text-gray-900">{heading}</h1></div>
      <Card className="p-6 text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center"><Pill className="w-8 h-8 text-purple-600" aria-hidden /></div>
        <p className="text-2xl text-gray-900">{dose.name}</p>
        <p className="text-gray-600">{dose.dosage} · scheduled for {clock(dose.time)}</p>
        {dose.purpose && <Badge variant="outline">{dose.purpose}</Badge>}
      </Card>
      {late && (
        <Card className="p-4 border-orange-200 bg-orange-50 flex gap-3" role="note">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-orange-900">This dose is past its time. If you are unsure whether to take it now, please check with your doctor or pharmacist first — never double up.</p>
        </Card>
      )}
      <div className="space-y-3">
        <Button className="w-full h-14 text-lg" onClick={() => submit('take')} disabled={act.isPending}><CheckCircle2 className="w-5 h-5 mr-2" aria-hidden />{act.isPending ? 'Saving…' : 'Yes, I took it'}</Button>
        <Button variant="outline" className="w-full h-12" onClick={() => submit('skip')} disabled={act.isPending}><SkipForward className="w-4 h-4 mr-2" aria-hidden />I'm skipping this dose</Button>
        <Button variant="ghost" className="w-full" onClick={() => navigateToFrame('silverbox', null)}>Not now</Button>
      </div>
    </div>
  );
}
export const SB02_MarkAsTaken = () => <ConfirmDose heading="Mark as taken" />;
export const SB03_TakeNow = () => <ConfirmDose heading="Time for your medicine" />;

interface HistoryEntry { date: string; time: string; name: string; dosage: string; status: 'taken' | 'skipped' | 'missed'; takenAt: string | null }
const FILTERS = ['all', 'taken', 'missed', 'skipped'] as const;

export function SB04_Med_History() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const q = useQuery({ queryKey: ['meds', 'history', 30], queryFn: () => get<{ history: HistoryEntry[] }>('/medications/history', { days: 30 }).then((r) => r.history) });
  const rows = (q.data ?? []).filter((e) => filter === 'all' || e.status === filter);
  const byDate = rows.reduce<Record<string, HistoryEntry[]>>((acc, e) => { (acc[e.date] ??= []).push(e); return acc; }, {});
  const count = (s: HistoryEntry['status']) => (q.data ?? []).filter((e) => e.status === s).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div><Back label="SilverBox" /><h1 className="text-gray-900">Medication history</h1><p className="text-gray-600">Last 30 days</p></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter history">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} aria-pressed={filter === f} onClick={() => setFilter(f)} className="capitalize">
            {f}{f !== 'all' && q.data ? ` (${count(f)})` : ''}
          </Button>
        ))}
      </div>
      {q.isLoading ? <p role="status" className="text-gray-500">Loading…</p> : q.isError ? <p role="alert" className="text-red-700">{errorMessage(q.error)}</p> : !rows.length ? <Card className="p-6 text-gray-600">Nothing to show.</Card> : Object.entries(byDate).map(([date, list]) => (
        <section key={date} aria-label={fmtDate(date)}>
          <h2 className="text-sm text-gray-500 mb-2">{fmtDate(`${date}T12:00:00Z`, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
          <Card className="divide-y">
            {list.map((e) => (
              <div key={`${e.date}-${e.time}-${e.name}`} className="p-4 flex items-center gap-3">
                <span aria-hidden>{e.status === 'taken' ? '✅' : e.status === 'missed' ? '❌' : '⏭️'}</span>
                <div className="flex-1"><p className="text-gray-900">{e.name} <span className="text-gray-600">{e.dosage}</span></p><p className="text-xs text-gray-500">Scheduled {clock(e.time)}{e.takenAt ? ` · recorded ${fmtTime(e.takenAt)}` : ''}</p></div>
                <Badge variant={e.status === 'taken' ? 'secondary' : e.status === 'missed' ? 'destructive' : 'outline'} className="capitalize">{e.status}</Badge>
              </div>
            ))}
          </Card>
        </section>
      ))}
    </div>
  );
}
