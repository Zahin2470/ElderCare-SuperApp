import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  MapPin,
  Clock,
  CheckCircle,
  MessageCircle,
  Send,
  Truck,
  Star,
} from 'lucide-react';
import { useNavigation } from '../navigation/NavigationContext';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

// NS01: Menu Overview - Full menu with filtering
export function NS01_MenuOverview() {
  const { navigateToFrame, navigateBack } = useNavigation();
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  const menuItems = [
    {
      id: 1,
      name: 'Grilled Salmon with Vegetables',
      description: 'Heart-healthy omega-3 rich salmon with steamed broccoli and carrots',
      price: 299.99,
      category: 'Main Course',
      calories: 450,
      dietary: ['Low-Sodium', 'Heart-Healthy'],
      image: '🐟',
    },
    {
      id: 2,
      name: 'Mediterranean Chicken Bowl',
      description: 'Grilled chicken with quinoa, olives, and fresh vegetables',
      price: 299.99,
      category: 'Main Course',
      calories: 520,
      dietary: ['Gluten-Free', 'High-Protein'],
      image: '🍗',
    },
    {
      id: 3,
      name: 'Vegetable Stir-Fry',
      description: 'Colorful mix of vegetables in light garlic sauce',
      price: 99.99,
      category: 'Main Course',
      calories: 380,
      dietary: ['Vegetarian', 'Low-Calorie'],
      image: '🥗',
    },
    {
      id: 4,
      name: 'Diabetic-Friendly Oatmeal',
      description: 'Steel-cut oats with berries and almonds',
      price: 99.99,
      category: 'Breakfast',
      calories: 320,
      dietary: ['Diabetic-Friendly', 'High-Fiber'],
      image: '🥣',
    },
  ];

  const addToCart = (itemId: number) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    toast.success('Added to cart');
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const cartTotal = Object.entries(cart).reduce((total, [itemId, quantity]) => {
    const item = menuItems.find((m) => m.id === parseInt(itemId));
    return total + (item?.price || 0) * quantity;
  }, 0);

  const cartItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={navigateBack} className="mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-gray-900 mb-2">🍱 NutriSenior Menu</h1>
          <p className="text-gray-600">Healthy, delicious meals tailored for seniors</p>
        </div>
        {cartItemCount > 0 && (
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => navigateToFrame('nutrisenior', 'NS03_PlaceOrder', { cart, menuItems })}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart ({cartItemCount}) - ৳{cartTotal.toFixed(2)}
          </Button>
        )}
      </div>

      {/* Subscription Banner */}
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
        <div className="flex items-start gap-4">
          <div className="text-5xl">✨</div>
          <div className="flex-1">
            <h3 className="text-gray-900 mb-2">Save with Meal Plans</h3>
            <p className="text-gray-700 mb-3">
              Subscribe to weekly or monthly plans and save up to 20% on your meals
            </p>
            <Button
              variant="outline"
              onClick={() => navigateToFrame('nutrisenior', 'NS02_SelectPlan')}
            >
              View Meal Plans
            </Button>
          </div>
        </div>
      </Card>

      {/* Menu Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Card key={item.id} className="p-6 hover:shadow-lg transition-all">
            <div className="flex gap-4">
              <div className="text-6xl">{item.image}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <p className="text-xl text-purple-700 ml-4">৳{item.price}</p>
                </div>

                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Badge variant="outline">{item.category}</Badge>
                  <span>•</span>
                  <span>{item.calories} cal</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {item.dietary.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {cart[item.id] ? (
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-gray-900 min-w-8 text-center">{cart[item.id]}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToCart(item.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="text-gray-600 ml-2">
                      ৳{(item.price * cart[item.id]).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => addToCart(item.id)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// NS02: Select Plan - Plans & subscription
export function NS02_SelectPlan() {
  const { navigateToFrame, navigateBack } = useNavigation();

  const plans = [
    {
      name: 'Weekly Plan',
      price: 1149,
      period: 'week',
      meals: 14,
      description: '2 meals per day, 7 days a week',
      savings: 'Save 15%',
      features: ['Custom meal selection', 'Dietary restrictions supported', 'Free delivery'],
    },
    {
      name: 'Monthly Plan',
      price: 2499,
      period: 'month',
      meals: 60,
      description: '2 meals per day, 30 days',
      savings: 'Save 20%',
      popular: true,
      features: [
        'Custom meal selection',
        'Priority delivery',
        'Dietitian consultation',
        'Free delivery',
      ],
    },
    {
      name: 'Full Board',
      price: 3899,
      period: 'month',
      meals: 90,
      description: '3 meals per day, 30 days',
      savings: 'Save 25%',
      features: [
        'All meals included',
        'Priority support',
        'Weekly dietitian check-ins',
        'Free delivery',
        'Snacks included',
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div>
        <Button variant="ghost" onClick={navigateBack} className="mb-2 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>
        <h1 className="text-gray-900 mb-2">💳 Meal Plans</h1>
        <p className="text-gray-600">Choose a plan that fits your lifestyle and save money</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, idx) => (
          <Card
            key={idx}
            className={`p-6 relative ${
              plan.popular ? 'border-2 border-purple-500 shadow-lg' : ''
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600">
                Most Popular
              </Badge>
            )}

            <div className="text-center mb-6">
              <h3 className="text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl text-purple-700">৳{plan.price}</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
              <Badge variant="secondary" className="mb-2">
                {plan.savings}
              </Badge>
              <p className="text-sm text-gray-600">{plan.description}</p>
              <p className="text-gray-900 mt-2">{plan.meals} meals included</p>
            </div>

            <div className="space-y-3 mb-6">
              {plan.features.map((feature, featureIdx) => (
                <div key={featureIdx} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              className={`w-full ${
                plan.popular ? 'bg-purple-600 hover:bg-purple-700' : ''
              }`}
              variant={plan.popular ? 'default' : 'outline'}
              onClick={() => {
                toast.success(`Selected ${plan.name}!`);
                navigateToFrame('nutrisenior', 'NS03_PlaceOrder', { plan });
              }}
            >
              Select Plan
            </Button>
          </Card>
        ))}
      </div>

      {/* Dietitian Section */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="text-5xl">👨‍⚕️</div>
          <div className="flex-1">
            <h3 className="text-gray-900 mb-2">Need Help Choosing?</h3>
            <p className="text-gray-700 mb-3">
              Chat with our registered dietitian to create a personalized meal plan
            </p>
            <Button
              variant="outline"
              onClick={() => navigateToFrame('nutrisenior', 'NS05_Dietitian_Chat')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Dietitian
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// NS03: Place Order - Cart + payment
export function NS03_PlaceOrder() {
  const { navigateToFrame, navigateBack, currentNavigation } = useNavigation();
  const { cart, menuItems, plan } = currentNavigation.data || {};
  const [deliveryTime, setDeliveryTime] = useState('12:00 PM');

  const orderItems = cart
    ? Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems?.find((m: any) => m.id === parseInt(itemId));
        return { ...item, quantity };
      })
    : [];

  const subtotal = orderItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );
  const delivery = plan ? 0 : 4.99;
  const total = subtotal + delivery;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <Button variant="ghost" onClick={navigateBack} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div>
        <h1 className="text-gray-900 mb-2">🛒 Complete Order</h1>
        <p className="text-gray-600">Review your order and select delivery time</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="md:col-span-2 space-y-4">
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {plan ? (
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h4 className="text-gray-900 mb-2">{plan.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                  <p className="text-2xl text-purple-700">৳{plan.price}</p>
                </div>
              ) : (
                orderItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start pb-4 border-b">
                    <div className="flex gap-3">
                      <span className="text-3xl">{item.image}</span>
                      <div>
                        <p className="text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-gray-900">৳{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Delivery Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Delivery Address</label>
                <Input placeholder="Enter delivery address" defaultValue="123 Main St, Dhaka" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Preferred Delivery Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {['10:00 AM', '12:00 PM', '6:00 PM'].map((time) => (
                    <Button
                      key={time}
                      variant={deliveryTime === time ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDeliveryTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Special Instructions</label>
                <Textarea placeholder="Any dietary notes or delivery instructions..." rows={3} />
              </div>
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="p-6 bg-purple-50 border-2 border-purple-200 sticky top-4">
            <h3 className="text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className="text-gray-900">
                  {delivery === 0 ? 'Free' : `৳${delivery.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-3 border-t flex justify-between">
                <span className="text-gray-900">Total</span>
                <span className="text-2xl text-purple-700">৳{total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                toast.success('Order placed successfully!');
                navigateToFrame('nutrisenior', 'NS04_TrackDelivery', { orderTotal: total });
              }}
            >
              Place Order
            </Button>

            <p className="text-xs text-gray-600 mt-4 text-center">
              By placing order, you agree to our terms
            </p>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// NS04: Track Delivery - Live tracker with ETA
export function NS04_TrackDelivery() {
  const { navigateBack, currentNavigation } = useNavigation();
  const { orderTotal } = currentNavigation.data || {};

  const deliverySteps = [
    { status: 'Order Confirmed', time: '10:30 AM', completed: true },
    { status: 'Preparing Your Meal', time: '10:45 AM', completed: true },
    { status: 'Out for Delivery', time: '11:30 AM', completed: true, active: true },
    { status: 'Delivered', time: 'Est. 12:15 PM', completed: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <Button variant="ghost" onClick={navigateBack} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Menu
      </Button>

      <Card className="p-8 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
        <div className="text-center mb-8">
          <Truck className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-gray-900 mb-2">🚚 Your Order is On the Way!</h1>
          <p className="text-gray-600">Estimated delivery: 12:15 PM (25 mins)</p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-6 mb-8">
          {deliverySteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : step.active
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                {idx < deliverySteps.length - 1 && (
                  <div
                    className={`absolute left-1/2 top-10 w-0.5 h-10 -translate-x-1/2 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-2">
                <p className="text-gray-900">{step.status}</p>
                <p className="text-sm text-gray-600">{step.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Driver Info */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-purple-200 text-purple-700">AH</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-gray-900">Ahmed Hassan</p>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span>4.9 (230 deliveries)</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact
            </Button>
          </div>
        </Card>

        {/* Order Summary */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Order Total</span>
            <span className="text-2xl text-purple-700">৳{orderTotal?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// NS05: Dietitian Chat
export function NS05_Dietitian_Chat() {
  const { navigateBack } = useNavigation();
  const [message, setMessage] = useState('');

  const messages = [
    {
      sender: 'Dr. Fatima Rahman',
      text: 'Hello! I\'m Dr. Fatima, your registered dietitian. How can I help you today?',
      time: '2:15 PM',
      isDietitian: true,
    },
    {
      sender: 'You',
      text: 'Hi! I\'m looking for a meal plan for my father who has diabetes.',
      time: '2:16 PM',
      isDietitian: false,
    },
    {
      sender: 'Dr. Fatima Rahman',
      text: 'I\'d be happy to help! Can you tell me about his current dietary restrictions and any medications he\'s taking?',
      time: '2:17 PM',
      isDietitian: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col"
    >
      <div className="mb-4">
        <Button variant="ghost" onClick={navigateBack} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-blue-200 text-blue-700">DR</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-gray-900">Dr. Fatima Rahman</h3>
              <p className="text-sm text-gray-600">Registered Dietitian • Available now</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.isDietitian ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-md p-4 rounded-lg ${
                  msg.isDietitian
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-purple-600 text-white'
                }`}
              >
                <p className="mb-1">{msg.text}</p>
                <p
                  className={`text-xs ${
                    msg.isDietitian ? 'text-gray-500' : 'text-purple-200'
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <Input
              placeholder="Ask about meal plans, dietary needs..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && message.trim()) {
                  toast.success('Message sent to dietitian');
                  setMessage('');
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={() => {
                if (message.trim()) {
                  toast.success('Message sent to dietitian');
                  setMessage('');
                }
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}