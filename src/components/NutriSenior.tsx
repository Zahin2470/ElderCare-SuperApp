import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Truck, ChefHat, Heart, Clock, Star, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function NutriSenior() {
  const [selectedMeal, setSelectedMeal] = useState<number | null>(null);

  const mealPlans = [
    {
      id: 1,
      name: 'Heart Healthy Plan',
      meals: ['Greek Salmon', 'Quinoa Salad', 'Vegetable Soup'],
      dietitian: 'Dr. Mohammad Abrar, RD',
      tags: ['Low Sodium', 'Heart Healthy', 'Omega-3'],
      price: '৳4,950/day',
      rating: 4.9,
    },
    {
      id: 2,
      name: 'Diabetes Care Plan',
      meals: ['Grilled Chicken', 'Roasted Vegetables', 'Berry Parfait'],
      dietitian: 'Dr. Mohammad Kabir, RD',
      tags: ['Low Carb', 'High Fiber', 'Blood Sugar Friendly'],
      price: '৳4,620/day',
      rating: 4.8,
    },
    {
      id: 3,
      name: 'Soft Foods Plan',
      meals: ['Meatloaf', 'Mashed Potatoes', 'Soft Bread Pudding'],
      dietitian: 'Chef Maria Hossain',
      tags: ['Soft Texture', 'Comfort Food', 'Easy to Eat'],
      price: '৳4,180/day',
      rating: 5.0,
    },
  ];

  const upcomingDeliveries = [
    {
      meal: 'Grilled Salmon with Asparagus',
      type: 'Dinner',
      date: 'Today',
      time: '6:00 PM',
      status: 'out for delivery',
      dietitian: 'Dr. Sagor Rahman',
      calories: 450,
      protein: '35g',
    },
    {
      meal: 'Oatmeal with Berries',
      type: 'Breakfast',
      date: 'Tomorrow',
      time: '8:00 AM',
      status: 'scheduled',
      dietitian: 'Dr. Sagor Rahman',
      calories: 320,
      protein: '12g',
    },
    {
      meal: 'Chicken Caesar Salad',
      type: 'Lunch',
      date: 'Tomorrow',
      time: '12:00 PM',
      status: 'scheduled',
      dietitian: 'Dr. Sagor Rahman',
      calories: 380,
      protein: '28g',
    },
  ];

  const mealHistory = [
    { meal: 'Mediterranean Quinoa Bowl', date: 'Oct 11', rating: 5, feedback: 'Delicious!' },
    { meal: 'Baked Cod with Vegetables', date: 'Oct 11', rating: 4, feedback: 'Very good' },
    { meal: 'Turkey Sandwich', date: 'Oct 10', rating: 5, feedback: 'Perfect portion' },
  ];

  const nutritionStats = [
    { label: 'Daily Calories', value: '1,650', target: '1,800', status: 'on track' },
    { label: 'Protein', value: '68g', target: '70g', status: 'good' },
    { label: 'Sodium', value: '1,200mg', target: '1,500mg', status: 'excellent' },
    { label: 'Fiber', value: '28g', target: '25g', status: 'excellent' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">🍱 NutriSenior</h1>
        <p className="text-gray-600">Personalized meal planning and delivery with dietitian support</p>
      </div>

      {/* Nutrition Dashboard */}
      <div>
        <h2 className="text-gray-900 mb-4">Today's Nutrition</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {nutritionStats.map((stat, idx) => (
            <Card key={idx} className="p-5">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-2xl text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">/ {stat.target}</p>
              </div>
              <Badge
                variant={stat.status === 'excellent' ? 'default' : 'secondary'}
                className={stat.status === 'excellent' ? 'bg-green-600' : ''}
              >
                {stat.status}
              </Badge>
            </Card>
          ))}
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="plans">Meal Plans</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="dietitian">My Dietitian</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">Upcoming Deliveries</h2>
            <Button 
              variant="outline"
              onClick={() => toast.info('Opening delivery schedule...')}
            >
              Modify Schedule
            </Button>
          </div>

          {upcomingDeliveries.map((delivery, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-lg ${
                    delivery.status === 'out for delivery' 
                      ? 'bg-green-100' 
                      : 'bg-blue-100'
                  }`}>
                    {delivery.status === 'out for delivery' ? (
                      <Truck className="w-8 h-8 text-green-600" />
                    ) : (
                      <ChefHat className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-gray-900">{delivery.meal}</h3>
                      <Badge variant="outline">{delivery.type}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{delivery.date} at {delivery.time}</span>
                      </div>
                      <p>Prepared by: {delivery.dietitian}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-purple-600">{delivery.calories} cal</span>
                        <span className="text-blue-600">{delivery.protein} protein</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={delivery.status === 'out for delivery' ? 'default' : 'secondary'}
                  className={delivery.status === 'out for delivery' ? 'bg-green-600' : ''}
                >
                  {delivery.status}
                </Badge>
              </div>

              {delivery.status === 'out for delivery' && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <Truck className="w-5 h-5" />
                    <span>Driver is 5 minutes away</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="mt-3 bg-green-600"
                    onClick={() => toast.info('Opening live delivery tracking...')}
                  >
                    Track Delivery
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div>
            <h2 className="text-gray-900 mb-4">Recommended Meal Plans</h2>
            <div className="space-y-4">
              {mealPlans.map((plan, idx) => (
                <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-gray-900">{plan.name}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">{plan.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">Curated by: {plan.dietitian}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl text-purple-600">{plan.price}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Sample meals:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {plan.meals.map((meal, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-50">
                          {meal}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {plan.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => {
                      setSelectedMeal(idx);
                      toast.success(`Selected ${plan.name} meal plan!`);
                    }}>
                      Select Plan
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => toast.info(`Viewing full menu for ${plan.name}...`)}
                    >
                      View Full Menu
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => toast.info(`Connecting with ${plan.dietitian}...`)}
                    >
                      Talk to Dietitian
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">Meal History</h2>
            <Button 
              variant="outline"
              onClick={() => toast.info('Loading complete meal history...')}
            >
              View All
            </Button>
          </div>

          {mealHistory.map((item, idx) => (
            <Card key={idx} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 mb-1">{item.meal}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{item.date}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < item.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span>•</span>
                    <span className="text-green-600">"{item.feedback}"</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast.success(`Adding ${item.meal} to your order!`)}
                >
                  Order Again
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="dietitian" className="space-y-6">
          <Card className="p-6">
            <div className="flex gap-6">
              <div className="p-4 bg-purple-100 rounded-full h-fit">
                <Heart className="w-12 h-12 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2">Dr. Rachel Green, RD</h3>
                <p className="text-gray-600 mb-4">
                  Your personal dietitian specializing in senior nutrition and chronic disease management
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Specialties</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">Heart Health</Badge>
                      <Badge variant="outline">Diabetes</Badge>
                      <Badge variant="outline">Senior Nutrition</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Availability</p>
                    <p className="text-gray-900 mt-2">Mon-Fri, 9am-5pm</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => toast.success('Scheduling consultation with Dr. Rachel Green...')}>
                    Schedule Consultation
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => toast.info('Opening chat with Dr. Rachel Green...')}
                  >
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Recent Recommendations</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-900 mb-1">Increased omega-3 intake</p>
                  <p className="text-sm text-gray-600">
                    Added salmon twice weekly for heart health based on your recent checkup
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-900 mb-1">Reduced sodium to 1,500mg daily</p>
                  <p className="text-sm text-gray-600">
                    Coordinated with your Care360 records and medication list
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-900 mb-1">Added fiber-rich foods</p>
                  <p className="text-sm text-gray-600">
                    Supporting digestive health with more whole grains and vegetables
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}