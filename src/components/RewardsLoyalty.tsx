import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import PointsCard from './rewards/PointsCard';
import RewardTile from './rewards/RewardTile';
import {
  Star, Gift, TrendingUp, Share2, Heart, Utensils, 
  Video, Calendar, ShoppingBag, CheckCircle2, Copy,
  ExternalLink, Sparkles, Trophy, Award, Crown, MessageCircle
} from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';

type ViewType = 'home' | 'earn' | 'redeem' | 'referral';

export default function RewardsLoyalty() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [userPoints, setUserPoints] = useState(3450);
  const [copiedCode, setCopiedCode] = useState(false);

  const userTier = 'Silver';
  const nextTierPoints = 5000;

  const recentActivity = [
    {
      id: 1,
      action: 'TeleHealth consultation',
      points: 100,
      date: 'Oct 19, 2025',
      type: 'earned' as const,
    },
    {
      id: 2,
      action: 'NutriSenior meal order',
      points: 50,
      date: 'Oct 18, 2025',
      type: 'earned' as const,
    },
    {
      id: 3,
      action: 'Redeemed: Free Yoga Session',
      points: -500,
      date: 'Oct 17, 2025',
      type: 'redeemed' as const,
    },
    {
      id: 4,
      action: 'Community event attendance',
      points: 75,
      date: 'Oct 16, 2025',
      type: 'earned' as const,
    },
    {
      id: 5,
      action: 'Health check-in streak (7 days)',
      points: 200,
      date: 'Oct 15, 2025',
      type: 'earned' as const,
    },
  ];

  const earnActions = [
    {
      id: 1,
      title: 'Complete Health Check-in',
      description: 'Log your daily vitals in Care360',
      points: 25,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      available: true,
    },
    {
      id: 2,
      title: 'Order from NutriSenior',
      description: 'Order a healthy meal',
      points: 50,
      icon: Utensils,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      available: true,
    },
    {
      id: 3,
      title: 'Attend TeleHealth Appointment',
      description: 'Complete a video consultation',
      points: 100,
      icon: Video,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      available: true,
    },
    {
      id: 4,
      title: 'Join Community Event',
      description: 'Participate in activities',
      points: 75,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      available: true,
    },
    {
      id: 5,
      title: 'Refer a Friend',
      description: 'Invite someone to join',
      points: 500,
      icon: Share2,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      available: true,
    },
    {
      id: 6,
      title: 'Weekly Active Streak',
      description: 'Stay active for 7 consecutive days',
      points: 200,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      available: false,
    },
  ];

  const rewards = [
    {
      id: 1,
      title: 'Free NutriSenior Meal',
      description: 'Redeem for any meal from our menu',
      cost: 500,
      category: 'Food',
      image: null,
      available: true,
    },
    {
      id: 2,
      title: '20% Off ElderLink Service',
      description: 'Discount on your next caregiver booking',
      cost: 300,
      category: 'Discount',
      image: null,
      available: true,
    },
    {
      id: 3,
      title: 'Free Yoga Session',
      description: 'Complimentary community yoga class',
      cost: 250,
      category: 'Activity',
      image: null,
      available: true,
    },
    {
      id: 4,
      title: 'Free TeleHealth Consultation',
      description: 'One free video consultation with any doctor',
      cost: 1000,
      category: 'Healthcare',
      image: null,
      available: true,
    },
    {
      id: 5,
      title: 'SilverBox Medication Discount',
      description: '15% off your next medication order',
      cost: 400,
      category: 'Discount',
      image: null,
      available: true,
    },
    {
      id: 6,
      title: 'Premium Event Pass',
      description: 'VIP access to exclusive community events',
      cost: 750,
      category: 'Activity',
      image: null,
      available: true,
    },
    {
      id: 7,
      title: 'Monthly Meal Plan Upgrade',
      description: 'Upgrade to premium meal plan for one month',
      cost: 2000,
      category: 'Food',
      image: null,
      available: true,
    },
    {
      id: 8,
      title: 'Gold Membership Upgrade',
      description: 'Instant upgrade to Gold tier status',
      cost: 5000,
      category: 'Premium',
      image: null,
      available: false,
    },
  ];

  const tierBenefits = {
    Silver: [
      'Earn 1x points on all activities',
      'Access to standard rewards catalog',
      'Monthly bonus: 50 points',
    ],
    Gold: [
      'Earn 1.5x points on all activities',
      'Early access to new rewards',
      'Monthly bonus: 150 points',
      'Priority customer support',
    ],
    Platinum: [
      'Earn 2x points on all activities',
      'Exclusive premium rewards',
      'Monthly bonus: 300 points',
      'Dedicated care coordinator',
      'Free annual health assessment',
    ],
  };

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText('MOSARRAF-REF-2025');
    setCopiedCode(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRedeemReward = (rewardId: number) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && userPoints >= reward.cost) {
      setUserPoints(userPoints - reward.cost);
      toast.success(`Successfully redeemed: ${reward.title}`);
    }
  };

  // R01: Rewards Home
  const renderHome = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 mb-2">Rewards & Loyalty</h1>
        <p className="text-gray-600">Earn points for healthy living, redeem for great rewards</p>
      </div>

      {/* Points Balance Card */}
      <PointsCard 
        points={userPoints} 
        tier={userTier}
        nextTierPoints={nextTierPoints}
      />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 bg-gradient-to-br from-purple-50 to-white hover:border-purple-300"
          onClick={() => setCurrentView('earn')}
        >
          <Star className="w-8 h-8 text-purple-600" />
          <span>Earn Points</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 bg-gradient-to-br from-blue-50 to-white hover:border-blue-300"
          onClick={() => setCurrentView('redeem')}
        >
          <Gift className="w-8 h-8 text-blue-600" />
          <span>Redeem Rewards</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 bg-gradient-to-br from-green-50 to-white hover:border-green-300"
          onClick={() => setCurrentView('referral')}
        >
          <Share2 className="w-8 h-8 text-green-600" />
          <span>Refer & Earn</span>
        </Button>
      </div>

      {/* Featured Rewards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900">Featured Rewards</h2>
          <Button variant="ghost" onClick={() => setCurrentView('redeem')}>
            View All →
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {rewards.slice(0, 3).map((reward) => (
            <RewardTile
              key={reward.id}
              reward={reward}
              userPoints={userPoints}
              onRedeem={handleRedeemReward}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-gray-900 mb-4">Recent Activity</h2>
        <Card className="divide-y">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'earned' ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {activity.type === 'earned' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <Gift className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div>
                  <p className="text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.date}</p>
                </div>
              </div>
              <div className={`text-right ${
                activity.type === 'earned' ? 'text-green-600' : 'text-orange-600'
              }`}>
                <p className="font-medium">
                  {activity.type === 'earned' ? '+' : ''}{activity.points} pts
                </p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Tier Benefits */}
      <div>
        <h2 className="text-gray-900 mb-4">Your Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className={`p-5 ${userTier === 'Silver' ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-white' : 'opacity-60'}`}>
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-8 h-8 text-gray-500" />
              <h3 className="text-gray-900">Silver</h3>
              {userTier === 'Silver' && <Badge>Current</Badge>}
            </div>
            <ul className="space-y-2">
              {tierBenefits.Silver.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <h3 className="text-gray-900">Gold</h3>
              <Badge variant="outline">{nextTierPoints - userPoints} pts to unlock</Badge>
            </div>
            <ul className="space-y-2">
              {tierBenefits.Gold.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-purple-600" />
              <h3 className="text-gray-900">Platinum</h3>
            </div>
            <ul className="space-y-2">
              {tierBenefits.Platinum.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );

  // R02: Earn Points
  const renderEarnPoints = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => setCurrentView('home')}>
        ← Back to Rewards
      </Button>

      <div>
        <h1 className="text-gray-900 mb-2">Earn Points</h1>
        <p className="text-gray-600">Complete activities to earn points and unlock rewards</p>
      </div>

      {/* Points Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl text-gray-900">{userPoints}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Earned This Month</p>
              <p className="text-2xl text-gray-900">+450</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Multiplier</p>
              <p className="text-2xl text-gray-900">1x</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Ways to Earn */}
      <div>
        <h2 className="text-gray-900 mb-4">Ways to Earn Points</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {earnActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.id}
                className={`p-5 ${action.available ? 'hover:shadow-lg hover:border-purple-300' : 'opacity-60'} transition-all`}
              >
                <div className={`w-14 h-14 ${action.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-7 h-7 ${action.color}`} />
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-gray-900">{action.title}</h3>
                  <Badge className="bg-purple-600">+{action.points}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                <Button
                  size="sm"
                  variant={action.available ? 'default' : 'outline'}
                  className="w-full"
                  disabled={!action.available}
                >
                  {action.available ? 'Start Activity' : 'Locked'}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Daily Bonus */}
      <Card className="p-6 bg-gradient-to-r from-orange-500 to-pink-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-white text-xl mb-1">Daily Login Bonus</h3>
              <p className="text-white/90">Come back tomorrow for +25 points!</p>
            </div>
          </div>
          <Button variant="secondary" className="bg-white text-purple-600 hover:bg-white/90">
            Claim Tomorrow
          </Button>
        </div>
      </Card>

      {/* Healthy Habits Tracker */}
      <div>
        <h2 className="text-gray-900 mb-4">Weekly Challenges</h2>
        <Card className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-gray-900">Log vitals 5 times this week</p>
                <p className="text-sm text-gray-500">3 of 5 completed</p>
              </div>
              <Badge>+100 pts</Badge>
            </div>
            <Progress value={60} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-gray-900">Attend 2 community events</p>
                <p className="text-sm text-gray-500">1 of 2 completed</p>
              </div>
              <Badge>+150 pts</Badge>
            </div>
            <Progress value={50} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-gray-900">Order from NutriSenior 3 times</p>
                <p className="text-sm text-gray-500">0 of 3 completed</p>
              </div>
              <Badge>+200 pts</Badge>
            </div>
            <Progress value={0} className="h-2" />
          </div>
        </Card>
      </div>
    </div>
  );

  // R03: Redeem Catalog
  const renderRedeem = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => setCurrentView('home')}>
        ← Back to Rewards
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Redeem Rewards</h1>
          <p className="text-gray-600">Use your points for exclusive benefits</p>
        </div>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Available Points</p>
          <p className="text-2xl text-purple-600">{userPoints}</p>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Rewards</TabsTrigger>
          <TabsTrigger value="food">Food & Meals</TabsTrigger>
          <TabsTrigger value="discount">Discounts</TabsTrigger>
          <TabsTrigger value="activity">Activities</TabsTrigger>
          <TabsTrigger value="healthcare">Healthcare</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rewards.map((reward) => (
              <RewardTile
                key={reward.id}
                reward={reward}
                userPoints={userPoints}
                onRedeem={handleRedeemReward}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="food" className="space-y-4">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rewards.filter(r => r.category === 'Food').map((reward) => (
              <RewardTile
                key={reward.id}
                reward={reward}
                userPoints={userPoints}
                onRedeem={handleRedeemReward}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discount" className="space-y-4">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rewards.filter(r => r.category === 'Discount').map((reward) => (
              <RewardTile
                key={reward.id}
                reward={reward}
                userPoints={userPoints}
                onRedeem={handleRedeemReward}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rewards.filter(r => r.category === 'Activity').map((reward) => (
              <RewardTile
                key={reward.id}
                reward={reward}
                userPoints={userPoints}
                onRedeem={handleRedeemReward}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="healthcare" className="space-y-4">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rewards.filter(r => r.category === 'Healthcare').map((reward) => (
              <RewardTile
                key={reward.id}
                reward={reward}
                userPoints={userPoints}
                onRedeem={handleRedeemReward}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // R04: Referral & Share
  const renderReferral = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => setCurrentView('home')}>
        ← Back to Rewards
      </Button>

      <div className="text-center py-6">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Share2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-gray-900 mb-2">Refer Friends & Family</h1>
        <p className="text-gray-600">Earn 500 points for each successful referral!</p>
      </div>

      {/* Referral Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 text-center bg-gradient-to-br from-purple-50 to-white">
          <p className="text-3xl text-purple-600 mb-1">2</p>
          <p className="text-sm text-gray-600">Successful Referrals</p>
        </Card>
        <Card className="p-5 text-center bg-gradient-to-br from-green-50 to-white">
          <p className="text-3xl text-green-600 mb-1">+1,000</p>
          <p className="text-sm text-gray-600">Points Earned</p>
        </Card>
        <Card className="p-5 text-center bg-gradient-to-br from-blue-50 to-white">
          <p className="text-3xl text-blue-600 mb-1">3</p>
          <p className="text-sm text-gray-600">Pending Invites</p>
        </Card>
      </div>

      {/* Referral Code */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4">Your Referral Code</h3>
        <div className="flex gap-3 mb-4">
          <Input
            value="MOSARRAF-REF-2025"
            readOnly
            className="text-lg text-center tracking-wider"
          />
          <Button onClick={handleCopyReferralCode}>
            {copiedCode ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copiedCode ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Share this code with friends and family. They'll get 250 bonus points on signup!
        </p>
      </Card>

      {/* How it Works */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4">How It Works</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600">1</span>
            </div>
            <div>
              <p className="text-gray-900 mb-1">Share your code</p>
              <p className="text-sm text-gray-600">Send your unique referral code to friends and family</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600">2</span>
            </div>
            <div>
              <p className="text-gray-900 mb-1">They sign up</p>
              <p className="text-sm text-gray-600">Your friend creates an account using your referral code</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600">3</span>
            </div>
            <div>
              <p className="text-gray-900 mb-1">You both get rewarded</p>
              <p className="text-sm text-gray-600">You earn 500 points, they get 250 bonus points</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Share Options */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4">Share via</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4">
            <ExternalLink className="w-5 h-5 mr-3" />
            Share via Email
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <MessageCircle className="w-5 h-5 mr-3" />
            Share via WhatsApp
          </Button>
        </div>
      </Card>

      {/* Referral History */}
      <div>
        <h3 className="text-gray-900 mb-4">Referral History</h3>
        <Card className="divide-y">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-900">Abrar Hossain Zahin</p>
              <p className="text-sm text-gray-500">Joined Oct 1, 2025</p>
            </div>
            <Badge className="bg-green-500">+500 pts</Badge>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-900">Sarah Johnson</p>
              <p className="text-sm text-gray-500">Joined Sep 15, 2025</p>
            </div>
            <Badge className="bg-green-500">+500 pts</Badge>
          </div>
          <div className="p-5 flex items-center justify-between opacity-60">
            <div>
              <p className="text-gray-900">Pending invitation</p>
              <p className="text-sm text-gray-500">Sent Oct 10, 2025</p>
            </div>
            <Badge variant="outline">Pending</Badge>
          </div>
        </Card>
      </div>
    </div>
  );

  // Render based on current view
  return (
    <div>
      {currentView === 'home' && renderHome()}
      {currentView === 'earn' && renderEarnPoints()}
      {currentView === 'redeem' && renderRedeem()}
      {currentView === 'referral' && renderReferral()}
    </div>
  );
}