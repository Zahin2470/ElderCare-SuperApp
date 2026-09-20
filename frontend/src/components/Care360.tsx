import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { QueryState } from './common/QueryState';
import { RecordRow, useRecords, usePrescriptions } from './frames/Care360Frames';
import { useNavigation } from './navigation/NavigationContext';
import { useDashboard } from '../lib/queries';
import { fmtDateTime } from '../lib/format';

export default function Care360({ userRole }: { userRole: 'senior' | 'family' }) {
  const { navigateToFrame } = useNavigation();
  const records = useRecords();
  const rx = usePrescriptions();
  const dash = useDashboard();
  const appts = (dash.data?.upcoming ?? []).filter((u) => u.type === 'appointment');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-gray-900 mb-2">Care360</h1><p className="text-gray-600">{userRole === 'senior' ? 'All your health information in one safe place' : 'Their health information, shared with their permission'}</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => navigateToFrame('care360', 'C360_UploadRecord')}>Upload record</Button><Button onClick={() => navigateToFrame('telehealth', null)}>Book appointment</Button></div>
      </div>

      <section aria-label="Latest readings">
        <h2 className="text-gray-900 mb-4">Latest readings</h2>
        <QueryState q={dash} isEmpty={(d) => !d.metrics.length} empty="No readings yet — log one from the Dashboard.">{(d) => (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{d.metrics.map((m) => (
            <Card key={m.kind} className="p-4"><p className="text-sm text-gray-600">{m.label}</p><p className="text-xl text-gray-900">{m.value2 != null ? `${m.value1}/${m.value2}` : m.value1} <span className="text-sm text-gray-500">{m.unit}</span></p><Badge variant={m.status === 'high' ? 'destructive' : 'secondary'} className="capitalize mt-1">{m.status === 'elevated' ? 'above usual' : m.status}</Badge></Card>
          ))}</div>
        )}</QueryState>
      </section>

      <section aria-label="Recent records">
        <div className="flex items-center justify-between mb-4"><h2 className="text-gray-900">Recent records</h2><Button variant="ghost" size="sm" onClick={() => navigateToFrame('care360', 'C360_RecordsList')}>See all →</Button></div>
        <QueryState q={records} isEmpty={(r) => !r.length} empty="No records yet.">{(r) => <div className="space-y-2">{r.slice(0, 4).map((x) => <RecordRow key={x.id} r={x} onOpen={(rec) => navigateToFrame('care360', 'C360_ViewRecord', rec)} />)}</div>}</QueryState>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section aria-label="Prescriptions">
          <div className="flex items-center justify-between mb-4"><h2 className="text-gray-900">Prescriptions</h2><Button variant="ghost" size="sm" onClick={() => navigateToFrame('care360', 'C360_RequestRefill')}>Refills →</Button></div>
          <QueryState q={rx} isEmpty={(r) => !r.length}>{(r) => <Card className="divide-y">{r.map((p) => <div key={p.id} className="p-4 flex justify-between"><div><p className="text-gray-900">{p.medication} <span className="text-gray-600">{p.dosage}</span></p><p className="text-xs text-gray-500">{p.prescribedBy}</p></div><Badge variant="outline">{p.refillsRemaining} refills</Badge></div>)}</Card>}</QueryState>
        </section>
        <section aria-label="Upcoming appointments">
          <h2 className="text-gray-900 mb-4">Upcoming appointments</h2>
          {appts.length === 0 ? <Card className="p-5 text-gray-600">No appointments booked.</Card> : <Card className="divide-y">{appts.map((a) => <div key={a.startsAt} className="p-4"><p className="text-gray-900">{a.title}</p><p className="text-sm text-gray-500">{fmtDateTime(a.startsAt)} · {a.location}</p></div>)}</Card>}
        </section>
      </div>
    </div>
  );
}
