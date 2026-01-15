import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, Heart, Pill, Utensils, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import { useNavigation } from './navigation/NavigationContext';
import { toast } from 'sonner@2.0.3';

interface DashboardProps {
  userRole: 'senior' | 'family';
}

export default function Dashboard({ userRole }: DashboardProps) {
  const { user } = useAuth();
  const { navigateToFrame } = useNavigation();
  
  // Extract first name for greeting
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };
  
  const userName = user?.fullName || 'User';
  const firstName = getFirstName(userName);

  const healthData = [
    { 
      label: 'Blood Pressure', 
      value: '125/82', 
      status: 'normal',
      trend: 'stable',
      icon: Heart,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      label: 'Medications', 
      value: '3 today', 
      status: 'pending',
      trend: '1 overdue',
      icon: Pill,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    { 
      label: 'Meals', 
      value: '2/3 eaten', 
      status: 'good',
      trend: 'dinner at 6pm',
      icon: Utensils,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'Appointments', 
      value: '1 upcoming', 
      status: 'scheduled',
      trend: 'Tomorrow 2pm',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
  ];

  const upcomingActivities = [
    { time: '2:00 PM', title: 'Professor Ali Hasan - Cardiology Checkup', type: 'appointment', location: 'IBN Sina\'s Hospital' },
    { time: '4:30 PM', title: 'Take Metformin (500mg)', type: 'medication', location: 'With dinner' },
    { time: '6:00 PM', title: 'Dinner Delivery - Grilled Salmon', type: 'meal', location: 'NutriSenior' },
  ];

  const alerts = userRole === 'family' ? [
    { message: 'Parents missed his morning medication (Lisinopril)', severity: 'high', time: '2 hours ago' },
    { message: 'Blood pressure reading was elevated (145/90)', severity: 'medium', time: '3 hours ago' },
    { message: 'Caregiver visit completed successfully', severity: 'low', time: '5 hours ago' },
  ] : [
    { message: 'Reminder: Take Lisinopril with breakfast', severity: 'high', time: 'Now' },
    { message: 'Your appointment with Professor Ali Hasan is tomorrow', severity: 'medium', time: '1 day' },
  ];

  const quickActions = userRole === 'senior' ? [
    { label: 'Book Caregiver', icon: '💛', module: 'elderlink', frame: 'EL01_SearchResults' },
    { label: 'Order Meal', icon: '🍱', module: 'nutrisenior', frame: 'NS01_MenuOverview' },
    { label: 'View Meds', icon: '💊', module: 'silverbox', frame: 'SB01_MedsOverview' },
    { label: 'Check Records', icon: '📋', module: 'care360', frame: 'C360_RecordsList' },
  ] : [
    { label: 'View Parents\'s Health', icon: '❤️', module: 'care360', frame: 'C360_RecordsList' },
    { label: 'Approve Bookings', icon: '✅', module: 'elderlink', frame: 'EL01_SearchResults' },
    { label: 'Med History', icon: '💊', module: 'silverbox', frame: 'SB04_Med_History' },
    { label: 'Activity Log', icon: '📊', module: 'dashboard', frame: null },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">
            {userRole === 'senior' ? `Welcome back, ${firstName}!` : `${firstName}'s Family Care Dashboard`}
          </h1>
          <p className="text-gray-600">
            {userRole === 'senior' 
              ? 'Here\'s your health overview for today' 
              : 'Monitor and manage your loved one\'s care and activities'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-gray-900">Sunday, Oct 19, 2025</p>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="p-6 border-l-4 border-l-orange-500 bg-orange-50/50">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-orange-900 mb-1">
                {userRole === 'family' ? 'Care Alerts' : 'Reminders & Alerts'}
              </h3>
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4">
                    <p className="text-orange-800">{alert.message}</p>
                    <span className="text-sm text-orange-600 whitespace-nowrap">{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Health Overview Cards */}
      <div>
        <h2 className="text-gray-900 mb-4">Health Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthData.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className={`p-6 ${item.bgColor} border-2 hover:shadow-lg transition-shadow`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 ${item.bgColor} rounded-lg`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <Badge variant={item.status === 'pending' ? 'destructive' : 'secondary'} className="text-xs">
                    {item.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                <p className={`text-2xl ${item.color} mb-2`}>{item.value}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="w-4 h-4" />
                  <span>{item.trend}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="h-24 flex flex-col gap-2 bg-white hover:bg-purple-50 hover:border-purple-300"
              onClick={() => {
                toast.success(`Opening ${action.label}...`);
                navigateToFrame(action.module, action.frame);
              }}
            >
              <span className="text-3xl">{action.icon}</span>
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Upcoming Activities */}
      <div>
        <h2 className="text-gray-900 mb-4">
          {userRole === 'senior' ? 'Today\'s Schedule' : 'Dad\'s Upcoming Activities'}
        </h2>
        <Card className="divide-y">
          {upcomingActivities.map((activity, idx) => (
            <div key={idx} className="p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="text-center min-w-20">
                <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                <p className="text-sm text-gray-900">{activity.time}</p>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 mb-1">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.location}</p>
              </div>
              <Badge variant="outline" className="capitalize">
                {activity.type}
              </Badge>
            </div>
          ))}
        </Card>
      </div>

      {/* Activity Summary for Family */}
      {userRole === 'family' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">This Week's Activity</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Caregiver Visits</span>
                <span className="text-gray-900">4 completed</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Medications Taken</span>
                <span className="text-gray-900">95% on time</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Doctor Appointments</span>
                <span className="text-gray-900">2 attended</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Meals Delivered</span>
                <span className="text-gray-900">18 of 21</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Pending Actions</h3>
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-gray-900 mb-1">Approve Caregiver Booking</p>
                <p className="text-sm text-gray-600">Nelufa Yeasmin - Oct 15, 2pm</p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => toast.success('Booking approved! Nelufa Yeasmin will be notified.')}
                >
                  Review & Approve
                </Button>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-gray-900 mb-1">Review Lab Results</p>
                <p className="text-sm text-gray-600">Blood work from Oct 10</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => toast.info('Opening lab results...')}
                >
                  View Results
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}