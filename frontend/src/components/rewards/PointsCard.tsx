import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { TrendingUp, Gift, Star } from 'lucide-react';
import { Badge } from '../ui/badge';

interface PointsCardProps {
  points: number;
  tier?: string;
  nextTierPoints?: number;
}

export default function PointsCard({ points, tier = "Silver", nextTierPoints = 5000 }: PointsCardProps) {
  const progress = (points / nextTierPoints) * 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-purple-100 text-sm mb-1">Total Points</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-white text-4xl">{points.toLocaleString()}</h2>
              <Star className="w-6 h-6 fill-yellow-300 text-yellow-300" />
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            {tier} Member
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-100">Progress to Gold</span>
            <span className="text-white">{nextTierPoints - points} points to go</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-purple-100">This Month</p>
              <p className="text-white">+450 pts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-purple-100">Redeemed</p>
              <p className="text-white">8 rewards</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
