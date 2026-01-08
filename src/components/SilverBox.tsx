import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Pill, Clock, AlertTriangle, CheckCircle2, Bell, Wifi } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SilverBoxProps {
  userRole: 'senior' | 'family';
}

export default function SilverBox({ userRole }: SilverBoxProps) {
  const todaysMedications = [
    {
      name: 'Lisinopril',
      dosage: '10mg',
      time: '8:00 AM',
      status: 'missed',
      purpose: 'Blood Pressure',
      taken: false,
      reminder: true,
    },
    {
      name: 'Metformin',
      dosage: '500mg',
      time: '12:00 PM',
      status: 'upcoming',
      purpose: 'Diabetes',
      taken: false,
      reminder: true,
    },
    {
      name: 'Aspirin',
      dosage: '81mg',
      time: '8:00 AM',
      status: 'taken',
      purpose: 'Heart Health',
      taken: true,
      takenAt: '8:15 AM',
    },
    {
      name: 'Atorvastatin',
      dosage: '20mg',
      time: '9:00 PM',
      status: 'scheduled',
      purpose: 'Cholesterol',
      taken: false,
      reminder: true,
    },
  ];

  const medicationInventory = [
    { name: 'Lisinopril 10mg', remaining: 8, total: 30, refillDate: 'Oct 18, 2025', status: 'low' },
    { name: 'Metformin 500mg', remaining: 45, total: 90, refillDate: 'Nov 5, 2025', status: 'good' },
    { name: 'Aspirin 81mg', remaining: 22, total: 30, refillDate: 'Oct 25, 2025', status: 'good' },
    { name: 'Atorvastatin 20mg', remaining: 3, total: 30, refillDate: 'Oct 14, 2025', status: 'critical' },
  ];

  const adherenceStats = {
    thisWeek: 92,
    thisMonth: 88,
    onTime: 85,
    missed: 3,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">💊 SilverBox</h1>
          <p className="text-gray-600">IoT-linked medication manager synced with Care360</p>
        </div>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="w-5 h-5 text-green-600" />
            <span className="text-green-700">Connected</span>
          </div>
          <p className="text-sm text-green-600">Last sync: 2 min ago</p>
        </Card>
      </div>

      {/* Adherence Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-blue-700 mb-1">This Week</p>
          <p className="text-3xl text-blue-900 mb-1">{adherenceStats.thisWeek}%</p>
          <p className="text-xs text-blue-600">Adherence Rate</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-purple-700 mb-1">This Month</p>
          <p className="text-3xl text-purple-900 mb-1">{adherenceStats.thisMonth}%</p>
          <p className="text-xs text-purple-600">Adherence Rate</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-green-700 mb-1">On Time</p>
          <p className="text-3xl text-green-900 mb-1">{adherenceStats.onTime}%</p>
          <p className="text-xs text-green-600">Taken on Schedule</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-orange-50 to-orange-100">
          <p className="text-sm text-orange-700 mb-1">Missed</p>
          <p className="text-3xl text-orange-900 mb-1">{adherenceStats.missed}</p>
          <p className="text-xs text-orange-600">This Week</p>
        </Card>
      </div>

      {/* Today's Timeline */}
      <div>
        <h2 className="text-gray-900 mb-4">Today's Medication Timeline</h2>
        <div className="space-y-3">
          {todaysMedications.map((med, idx) => (
            <Card
              key={idx}
              className={`p-5 ${
                med.status === 'missed'
                  ? 'border-l-4 border-l-red-500 bg-red-50'
                  : med.status === 'taken'
                  ? 'border-l-4 border-l-green-500 bg-green-50'
                  : med.status === 'upcoming'
                  ? 'border-l-4 border-l-orange-500 bg-orange-50'
                  : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`p-3 rounded-full ${
                      med.status === 'missed'
                        ? 'bg-red-100'
                        : med.status === 'taken'
                        ? 'bg-green-100'
                        : 'bg-blue-100'
                    }`}
                  >
                    {med.status === 'missed' ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : med.status === 'taken' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Pill className="w-6 h-6 text-blue-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-gray-900">{med.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {med.dosage}
                      </Badge>
                      {med.status === 'missed' && (
                        <Badge variant="destructive">Missed</Badge>
                      )}
                      {med.status === 'taken' && (
                        <Badge className="bg-green-600">Taken</Badge>
                      )}
                      {med.status === 'upcoming' && (
                        <Badge className="bg-orange-600">Due Soon</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Scheduled: {med.time}</span>
                      </div>
                      {med.takenAt && <span>• Taken at {med.takenAt}</span>}
                      <span>• {med.purpose}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!med.taken && (
                    <Button 
                      size="sm" 
                      variant={med.status === 'missed' ? 'destructive' : 'default'}
                      onClick={() => toast.success(`${med.name} marked as taken!`)}
                    >
                      {med.status === 'missed' ? 'Mark as Taken' : 'Take Now'}
                    </Button>
                  )}
                  {med.reminder && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toast.info(`Reminder set for ${med.name}`)}
                    >
                      <Bell className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Medication Inventory */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900">Medication Inventory</h2>
          <Button 
            variant="outline"
            onClick={() => toast.success('Redirecting to pharmacy for refills...')}
          >
            Order Refills
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {medicationInventory.map((item, idx) => (
            <Card key={idx} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600">
                    {item.remaining} of {item.total} pills remaining
                  </p>
                </div>
                <Badge
                  variant={
                    item.status === 'critical'
                      ? 'destructive'
                      : item.status === 'low'
                      ? 'secondary'
                      : 'outline'
                  }
                  className={
                    item.status === 'low' ? 'bg-orange-100 text-orange-700' : ''
                  }
                >
                  {item.status === 'critical'
                    ? 'Critical'
                    : item.status === 'low'
                    ? 'Low Stock'
                    : 'Good'}
                </Badge>
              </div>

              <Progress value={(item.remaining / item.total) * 100} className="mb-3" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Refill by: {item.refillDate}</span>
                {item.status !== 'good' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toast.success(`Ordering refill for ${item.name}...`)}
                  >
                    Order Refill
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Care360 Integration Notice */}
      {userRole === 'family' && (
        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-purple-900 mb-2">Synced with Care360</h3>
              <p className="text-purple-700 mb-3">
                All medication data is automatically shared with healthcare providers. You'll
                receive alerts for missed doses or abnormal patterns.
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => toast.info('Opening Care360 health records...')}
              >
                View in Care360
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
