import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { TrendingUp, Gift, Star } from 'lucide-react';
import { Badge } from '../ui/badge';

interface PointsCardProps {
  /** Spendable balance. */
  points: number;
  /** Total ever earned — tiers are based on this, so spending points never drops your tier. */
  lifetimeEarned: number;
  tier: string;
  /** Lifetime-points threshold where the current tier began. */
  tierFrom: number;
  /** The next tier up, or undefined when already at the top. */
  next?: { name: string; from: number };
  earnedThisMonth: number;
  redeemedCount: number;
}

export default function PointsCard({ points, lifetimeEarned, tier, tierFrom, next, earnedThisMonth, redeemedCount }: PointsCardProps) {
  const progress = next ? Math.min(100, Math.max(0, ((lifetimeEarned - tierFrom) / (next.from - tierFrom)) * 100)) : 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" aria-hidden />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" aria-hidden />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-purple-100 text-sm mb-1">Points balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-white text-4xl">{points.toLocaleString()}</p>
              <Star className="w-6 h-6 fill-yellow-300 text-yellow-300" aria-hidden />
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">{tier} Member</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-100">{next ? `Progress to ${next.name}` : 'Top tier reached'}</span>
            {next && <span className="text-white">{Math.max(0, next.from - lifetimeEarned).toLocaleString()} points to go</span>}
          </div>
          <Progress value={progress} aria-label={next ? `Progress to ${next.name} tier` : 'Top tier reached'} className="h-2 bg-white/20" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><TrendingUp className="w-5 h-5" aria-hidden /></div>
            <div><p className="text-xs text-purple-100">Earned this month</p><p className="text-white">+{earnedThisMonth.toLocaleString()} pts</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Gift className="w-5 h-5" aria-hidden /></div>
            <div><p className="text-xs text-purple-100">Redeemed</p><p className="text-white">{redeemedCount} reward{redeemedCount === 1 ? '' : 's'}</p></div>
          </div>
        </div>
      </div>
    </Card>
  );
}
