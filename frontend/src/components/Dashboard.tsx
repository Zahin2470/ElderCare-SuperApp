import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, Activity, Clock, Heart, HeartPulse, Droplet, Scale, Gift } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useAuth } from './auth/AuthContext';
import { useNavigation } from './navigation/NavigationContext';
import { DailyDigestCard } from './ai/DailyDigestCard';
import { FamilyInvite, FamilyRequests } from './family/FamilyLinks';
import { ApiError, errorMessage, post } from '../lib/api';
import { fmtDateTime, fmtLongToday, clock } from '../lib/format';
import { keys, Metric, useDashboard, useDosesToday, useMedications } from '../lib/queries';

const ICONS = { blood_pressure: Heart, heart_rate: HeartPulse, blood_sugar: Droplet, weight: Scale } as const;
const STATUS_STYLE: Record<Metric['status'], { badge: 'secondary' | 'destructive' | 'outline'; text: string; bg: string; color: string }> = {
  normal: { badge: 'secondary', text: 'Normal', bg: 'bg-green-50', color: 'text-green-700' },
  elevated: { badge: 'outline', text: 'Above usual', bg: 'bg-yellow-50', color: 'text-yellow-700' },
  high: { badge: 'destructive', text: 'High', bg: 'bg-red-50', color: 'text-red-700' },
  low: { badge: 'outline', text: 'Low', bg: 'bg-blue-50', color: 'text-blue-700' },
  recorded: { badge: 'secondary', text: 'Recorded', bg: 'bg-gray-50', color: 'text-gray-700' },
};
const TREND: Record<Metric['trend'], string> = { up: '↑ rising', down: '↓ falling', stable: '→ stable' };
const fmtMetric = (m: Metric) => (m.value2 != null ? `${m.value1}/${m.value2}` : String(m.value1));

const QUICK_ACTIONS = [
  { icon: '💊', label: 'My Medications', module: 'silverbox' },
  { icon: '🤝', label: 'Find a Caregiver', module: 'elderlink' },
  { icon: '🍱', label: 'Order a Meal', module: 'nutrisenior' },
  { icon: '📺', label: 'See a Doctor', module: 'telehealth' },
] as const;

function CheckInDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<Metric['kind']>('blood_pressure');
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const save = useMutation({
    mutationFn: () => post<{ status: Metric['status']; pointsAwarded: number }>('/care360/metrics', { kind, value1: Number(v1), value2: kind === 'blood_pressure' ? Number(v2) : undefined }),
    onSuccess: (r) => {
      toast.success(r.pointsAwarded ? `Saved. +${r.pointsAwarded} reward points!` : 'Reading saved.');
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: ['ai'] });
      qc.invalidateQueries({ queryKey: ['rewards'] });
      setV1(''); setV2(''); onOpenChange(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const labels: Record<Metric['kind'], string> = { blood_pressure: 'Blood pressure (mmHg)', heart_rate: 'Heart rate (bpm)', blood_sugar: 'Blood sugar (mg/dL)', weight: 'Weight (kg)' };
  const valid = Number(v1) > 0 && (kind !== 'blood_pressure' || Number(v2) > 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Daily health check-in</DialogTitle><DialogDescription>Record a reading. You earn reward points for your first check-in each day.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate(); }} className="space-y-4">
          <div>
            <Label htmlFor="ci-kind">What did you measure?</Label>
            <select id="ci-kind" value={kind} onChange={(e) => { setKind(e.target.value as Metric['kind']); setV1(''); setV2(''); }} className="mt-1 w-full h-12 rounded-md border px-3 bg-white">
              {(Object.keys(labels) as Metric['kind'][]).map((k) => <option key={k} value={k}>{labels[k]}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1"><Label htmlFor="ci-v1">{kind === 'blood_pressure' ? 'Top number (systolic)' : 'Value'}</Label><Input id="ci-v1" inputMode="decimal" value={v1} onChange={(e) => setV1(e.target.value)} className="h-12" /></div>
            {kind === 'blood_pressure' && <div className="flex-1"><Label htmlFor="ci-v2">Bottom number (diastolic)</Label><Input id="ci-v2" inputMode="decimal" value={v2} onChange={(e) => setV2(e.target.value)} className="h-12" /></div>}
          </div>
          <Button type="submit" className="w-full h-12" disabled={!valid || save.isPending}>{save.isPending ? 'Saving…' : 'Save reading'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard({ userRole }: { userRole: 'senior' | 'family' }) {
  const { user, linkedSeniors } = useAuth();
  const { navigateToFrame } = useNavigation();
  const [checkIn, setCheckIn] = useState(false);
  const dash = useDashboard();
  const doses = useDosesToday();
  const meds = useMedications();
  const firstName = (user?.fullName ?? 'there').split(' ')[0];
  const subject = userRole === 'family' ? linkedSeniors[0]?.fullName.split(' ')[0] ?? 'your loved one' : 'you';

  // A family account with no accepted link has nothing to show yet.
  if (dash.error instanceof ApiError && dash.error.status === 404) {
    return <div className="max-w-7xl mx-auto space-y-6"><h1 className="text-gray-900">Welcome, {firstName}!</h1><FamilyInvite /></div>;
  }
  if (dash.isLoading) return <div className="max-w-7xl mx-auto p-6 text-gray-500" role="status">Loading your dashboard…</div>;
  if (dash.isError || !dash.data) return <div className="max-w-7xl mx-auto p-6" role="alert"><p className="text-red-700 mb-3">{errorMessage(dash.error)}</p><Button onClick={() => dash.refetch()}>Try again</Button></div>;

  const d = dash.data;
  const alerts: { message: string; when?: string }[] = [
    ...(doses.data ?? []).filter((x) => x.status === 'missed').map((x) => ({ message: `${x.name} ${x.dosage} (${clock(x.time)}) has not been marked as taken`, when: 'Today' })),
    ...(meds.data ?? []).filter((m) => m.stockStatus !== 'good').map((m) => ({ message: `${m.name} is running ${m.stockStatus === 'critical' ? 'very ' : ''}low — ${m.stockRemaining} left`, when: m.refillDate ? `Refill by ${fmtDateTime(m.refillDate).split(',')[0]}` : undefined })),
    ...d.metrics.filter((m) => ['high', 'elevated', 'low'].includes(m.status)).map((m) => ({ message: `Latest ${m.label.toLowerCase()} (${fmtMetric(m)} ${m.unit}) is outside the usual range — consider mentioning it to a doctor`, when: undefined })),
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">{userRole === 'senior' ? `Welcome back, ${firstName}!` : `Caring for ${subject}`}</h1>
          <p className="text-gray-600">{userRole === 'senior' ? "Here's your health overview for today" : "A quick look at how they're doing"}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-gray-900">{fmtLongToday()}</p>
          <button onClick={() => navigateToFrame('rewardsloyalty', null)} className="mt-1 inline-flex items-center gap-1 text-sm text-purple-700 hover:underline"><Gift className="w-4 h-4" aria-hidden />{d.points.toLocaleString()} points</button>
        </div>
      </div>

      {userRole === 'senior' && <FamilyRequests />}
      <DailyDigestCard />

      {alerts.length > 0 && (
        <Card className="p-6 border-l-4 border-l-orange-500 bg-orange-50/50" role="region" aria-label="Alerts">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" aria-hidden />
            <div className="flex-1 space-y-3">
              <h3 className="text-orange-900">{userRole === 'family' ? 'Care alerts' : 'Reminders & alerts'}</h3>
              {alerts.map((a) => (
                <div key={a.message} className="flex items-start justify-between gap-4"><p className="text-orange-800">{a.message}</p>{a.when && <span className="text-sm text-orange-600 whitespace-nowrap">{a.when}</span>}</div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900">Health overview</h2>
          <Button variant="outline" size="sm" onClick={() => setCheckIn(true)}>+ Log a reading</Button>
        </div>
        {d.metrics.length === 0 ? <Card className="p-6 text-gray-600">No readings yet. Log your first one to start tracking.</Card> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {d.metrics.map((m) => {
              const Icon = ICONS[m.kind]; const st = STATUS_STYLE[m.status];
              return (
                <Card key={m.kind} className={`p-6 ${st.bg} border-2`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 ${st.bg} rounded-lg`}><Icon className={`w-6 h-6 ${st.color}`} aria-hidden /></div>
                    <Badge variant={st.badge} className="text-xs">{st.text}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{m.label}</p>
                  <p className={`text-2xl ${st.color} mb-1`}>{fmtMetric(m)} <span className="text-sm">{m.unit}</span></p>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Activity className="w-4 h-4" aria-hidden /><span>{TREND[m.trend]}</span></div>
                  <p className="text-xs text-gray-400 mt-1">{fmtDateTime(m.recordedAt)}</p>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-gray-900 mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Button key={a.label} variant="outline" className="h-24 flex flex-col gap-2 bg-white hover:bg-purple-50 hover:border-purple-300" onClick={() => navigateToFrame(a.module, null)}>
              <span className="text-3xl" aria-hidden>{a.icon}</span><span>{a.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-gray-900 mb-4">{userRole === 'senior' ? 'Coming up' : `${subject}'s upcoming`}</h2>
        {d.upcoming.length === 0 ? <Card className="p-6 text-gray-600">Nothing scheduled. Book a doctor, a caregiver visit or a community activity.</Card> : (
          <Card className="divide-y">
            {d.upcoming.map((u) => (
              <div key={`${u.type}-${u.startsAt}-${u.title}`} className="p-5 flex items-center gap-4 hover:bg-gray-50">
                <div className="text-center min-w-24"><Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" aria-hidden /><p className="text-sm text-gray-900">{fmtDateTime(u.startsAt)}</p></div>
                <div className="flex-1"><p className="text-gray-900 mb-1">{u.title}</p><p className="text-sm text-gray-500">{u.location}</p></div>
                <Badge variant="outline" className="capitalize">{u.type}</Badge>
              </div>
            ))}
          </Card>
        )}
      </div>

      <CheckInDialog open={checkIn} onOpenChange={setCheckIn} />
    </div>
  );
}
