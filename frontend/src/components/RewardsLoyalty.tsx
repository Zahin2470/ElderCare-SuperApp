import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import PointsCard from './rewards/PointsCard';
import RewardTile from './rewards/RewardTile';
import { errorMessage, get, post } from '../lib/api';
import { fmtDate } from '../lib/format';

interface Summary {
  balance: number; lifetimeEarned: number;
  recentActivity: { id: number; delta: number; reason: string; createdAt: string }[];
  earnActions: { key: string; title: string; description: string; points: number; available: boolean }[];
  rewards: { id: string; title: string; description: string; cost: number; category: string }[];
}

// Tier is derived from lifetime points earned, so spending points never drops your tier.
const TIERS = [
  { name: 'Silver', from: 0, perks: ['Earn points on every check-in', 'Redeem any reward', 'Community event access'] },
  { name: 'Gold', from: 5000, perks: ['Everything in Silver', 'Priority caregiver matching', 'Bonus points on events'] },
  { name: 'Platinum', from: 15000, perks: ['Everything in Gold', 'Dedicated care concierge', 'Exclusive partner offers'] },
] as const;

export default function RewardsLoyalty() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['rewards', 'summary'], queryFn: () => get<Summary>('/rewards/summary') });
  const [voucher, setVoucher] = useState<{ code: string; title: string } | null>(null);

  const redeem = useMutation({
    mutationFn: (rewardId: string) => post<{ code: string; title: string; balance: number }>('/rewards/redeem', { rewardId }),
    onSuccess: (r) => { setVoucher({ code: r.code, title: r.title }); qc.invalidateQueries({ queryKey: ['rewards'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (isLoading) return <p className="p-6 text-gray-500" role="status">Loading rewards…</p>;
  if (isError || !data) return <div className="p-6" role="alert"><p className="text-red-700 mb-3">{errorMessage(error)}</p><Button onClick={() => refetch()}>Try again</Button></div>;

  const tierIdx = TIERS.reduce((acc, t, i) => (data.lifetimeEarned >= t.from ? i : acc), 0);
  const next = TIERS[tierIdx + 1];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div><h1 className="text-gray-900 mb-2">Rewards & Loyalty</h1><p className="text-gray-600">Earn points for looking after your health and taking part</p></div>

      <PointsCard points={data.balance} tier={TIERS[tierIdx].name} nextTierPoints={next?.from ?? data.lifetimeEarned} />

      <section aria-label="Ways to earn">
        <h2 className="text-gray-900 mb-4">Earn points today</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {data.earnActions.map((a) => (
            <Card key={a.key} className={`p-5 ${a.available ? '' : 'opacity-70'}`}>
              <div className="flex items-start justify-between mb-2">
                {a.available ? <Circle className="w-5 h-5 text-purple-500" aria-hidden /> : <CheckCircle2 className="w-5 h-5 text-green-600" aria-label="Done today" />}
                <Badge variant="secondary">+{a.points}</Badge>
              </div>
              <p className="text-gray-900">{a.title}</p><p className="text-sm text-gray-600">{a.description}</p>
              <p className="text-xs text-gray-500 mt-2">{a.available ? 'Available once per day' : 'Earned today — back tomorrow'}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="Rewards">
        <h2 className="text-gray-900 mb-4">Redeem rewards</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.rewards.map((r) => <RewardTile key={r.id} reward={{ ...r, available: !redeem.isPending }} userPoints={data.balance} onRedeem={(id) => redeem.mutate(id)} />)}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section aria-label="Recent activity">
          <h2 className="text-gray-900 mb-4">Recent activity</h2>
          <Card className="divide-y">
            {data.recentActivity.length === 0 ? <p className="p-5 text-gray-600">No activity yet.</p> : data.recentActivity.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between"><div><p className="text-gray-900">{a.reason}</p><p className="text-xs text-gray-500">{fmtDate(a.createdAt)}</p></div>
                <span className={a.delta > 0 ? 'text-green-700' : 'text-gray-700'}>{a.delta > 0 ? '+' : ''}{a.delta}</span></div>
            ))}
          </Card>
        </section>
        <section aria-label="Membership tiers">
          <h2 className="text-gray-900 mb-4">Membership tiers</h2>
          <div className="space-y-3">
            {TIERS.map((t, i) => (
              <Card key={t.name} className={`p-4 ${i === tierIdx ? 'border-2 border-purple-500 bg-purple-50/50' : 'opacity-70'}`}>
                <div className="flex items-center justify-between mb-1"><h3 className="text-gray-900">{t.name}</h3>
                  {i === tierIdx ? <Badge>Current</Badge> : i > tierIdx ? <Badge variant="outline">{(t.from - data.lifetimeEarned).toLocaleString()} pts to unlock</Badge> : <Badge variant="secondary">Achieved</Badge>}</div>
                <ul className="text-sm text-gray-600 list-disc pl-5">{t.perks.map((p) => <li key={p}>{p}</li>)}</ul>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={!!voucher} onOpenChange={(o) => !o && setVoucher(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>🎉 Reward redeemed</DialogTitle><DialogDescription>{voucher?.title}</DialogDescription></DialogHeader>
          <p className="text-gray-600">Show this code when you use your reward:</p>
          <p className="text-center text-3xl font-mono tracking-widest text-purple-700 py-4 bg-purple-50 rounded-lg select-all">{voucher?.code}</p>
          <Button onClick={() => setVoucher(null)}>Done</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
