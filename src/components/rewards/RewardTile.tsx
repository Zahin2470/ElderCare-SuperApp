import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Sparkles, Lock } from 'lucide-react';

interface RewardTileProps {
  reward: {
    id: number;
    title: string;
    description: string;
    cost: number;
    image?: string;
    category: string;
    available: boolean;
  };
  userPoints: number;
  onRedeem?: (id: number) => void;
}

export default function RewardTile({ reward, userPoints, onRedeem }: RewardTileProps) {
  const canAfford = userPoints >= reward.cost;
  const isAvailable = reward.available && canAfford;

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all ${
      !isAvailable ? 'opacity-60' : 'hover:border-purple-300'
    }`}>
      <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 relative">
        {reward.image ? (
          <ImageWithFallback 
            src={reward.image} 
            alt={reward.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-purple-400" />
          </div>
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        )}
        <Badge className="absolute top-2 right-2 bg-purple-600">
          {reward.cost} pts
        </Badge>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-gray-900 flex-1">{reward.title}</h4>
          <Badge variant="outline" className="text-xs ml-2">
            {reward.category}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {reward.description}
        </p>

        <Button 
          className="w-full" 
          disabled={!isAvailable}
          onClick={() => onRedeem?.(reward.id)}
        >
          {!canAfford ? `Need ${reward.cost - userPoints} more pts` : 
           !reward.available ? 'Out of Stock' : 'Redeem Now'}
        </Button>
      </div>
    </Card>
  );
}
