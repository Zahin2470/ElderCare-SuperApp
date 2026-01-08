import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText, Upload, Share2, Download, Calendar, Activity, Heart, Pill, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Care360Props {
  userRole: 'senior' | 'family';
}

export default function Care360({ userRole }: Care360Props) {
  const medicalRecords = [
    {
      type: 'Lab Results',
      title: 'Complete Blood Count',
      date: 'Oct 10, 2025',
      provider: 'Professor Ali Hasan - IBN Sina Hospital',
      status: 'reviewed',
      category: 'Labs',
    },
    {
      type: 'Prescription',
      title: 'Lisinopril 10mg Refill',
      date: 'Oct 8, 2025',
      provider: 'Dr. Sarah Hossain',
      status: 'active',
      category: 'Medications',
    },
    {
      type: 'Visit Summary',
      title: 'Cardiology Follow-up',
      date: 'Oct 5, 2025',
      provider: 'Professor Ali Hasan - Cardiology',
      status: 'completed',
      category: 'Visits',
    },
    {
      type: 'Imaging',
      title: 'Chest X-Ray',
      date: 'Sep 28, 2025',
      provider: 'IBN Sina\'s Radiology',
      status: 'reviewed',
      category: 'Imaging',
    },
  ];

  const prescriptions = [
    {
      medication: 'Lisinopril',
      dosage: '10mg daily',
      prescribedBy: 'Dr. Sarah Hossain',
      startDate: 'Jan 15, 2024',
      refills: '3 remaining',
      status: 'active',
    },
    {
      medication: 'Metformin',
      dosage: '500mg twice daily',
      prescribedBy: 'Dr. Sarah Hossain',
      startDate: 'Mar 10, 2024',
      refills: '5 remaining',
      status: 'active',
    },
    {
      medication: 'Atorvastatin',
      dosage: '20mg daily',
      prescribedBy: 'Professor Ali Hasan',
      startDate: 'Feb 20, 2024',
      refills: '0 remaining',
      status: 'refill needed',
    },
  ];

  const upcomingAppointments = [
    {
      doctor: 'Professor Ali Hasan',
      specialty: 'Cardiology',
      date: 'Oct 13, 2025',
      time: '2:00 PM',
      location: 'IBN Sina\'s Hospital',
      type: 'Follow-up',
    },
    {
      doctor: 'Dr. Sarah Hossain',
      specialty: 'Primary Care',
      date: 'Oct 20, 2025',
      time: '10:30 AM',
      location: 'Community Health Center',
      type: 'Annual Physical',
    },
  ];

  const healthMetrics = [
    { label: 'Blood Pressure', value: '125/82 mmHg', date: 'Today', trend: 'stable', status: 'normal' },
    { label: 'Blood Sugar', value: '105 mg/dL', date: 'Today', trend: 'up', status: 'normal' },
    { label: 'Weight', value: '152 lbs', date: 'Yesterday', trend: 'stable', status: 'normal' },
    { label: 'Heart Rate', value: '72 bpm', date: 'Today', trend: 'stable', status: 'normal' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">👨‍⚕️ Care360</h1>
          <p className="text-gray-600">
            {userRole === 'senior' 
              ? 'Your complete digital health records' 
              : 'Mosarraf\'s medical history and health data'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => toast.info('Opening file upload...')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Record
          </Button>
          <Button 
            variant="outline"
            onClick={() => toast.success('Sharing records with healthcare provider...')}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share with Doctor
          </Button>
        </div>
      </div>

      {/* Health Metrics Overview */}
      <div>
        <h2 className="text-gray-900 mb-4">Recent Health Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {healthMetrics.map((metric, idx) => (
            <Card key={idx} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <Activity className="w-6 h-6 text-purple-600" />
                <Badge variant={metric.status === 'normal' ? 'secondary' : 'destructive'}>
                  {metric.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
              <p className="text-2xl text-gray-900 mb-1">{metric.value}</p>
              <p className="text-xs text-gray-500">{metric.date}</p>
            </Card>
          ))}
        </div>
      </div>

      <Tabs defaultValue="records" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">Medical Records</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.info('Opening filter options...')}
              >
                Filter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.info('Sorting records...')}
              >
                Sort
              </Button>
            </div>
          </div>

          {medicalRecords.map((record, idx) => (
            <Card key={idx} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-gray-900">{record.title}</h3>
                      <Badge variant="outline">{record.category}</Badge>
                      <Badge variant={record.status === 'active' ? 'default' : 'secondary'}>
                        {record.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>{record.type}</p>
                      <p>{record.provider}</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{record.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.success(`Downloading ${record.title}...`)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info(`Opening ${record.title}...`)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">Active Prescriptions</h2>
            <Button onClick={() => toast.success('Requesting prescription refill...')}>
              Request Refill
            </Button>
          </div>

          {prescriptions.map((rx, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Pill className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-gray-900">{rx.medication}</h3>
                      {rx.status === 'refill needed' && (
                        <Badge variant="destructive">Refill Needed</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Dosage: {rx.dosage}</p>
                      <p>Prescribed by: {rx.prescribedBy}</p>
                      <p>Started: {rx.startDate}</p>
                      <p>Refills: {rx.refills}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {rx.status === 'refill needed' ? (
                    <Button 
                      size="sm"
                      onClick={() => toast.success(`Ordering refill for ${rx.medication}...`)}
                    >
                      Order Refill
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast.info(`Viewing details for ${rx.medication}...`)}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Pill className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-blue-900 mb-2">Synced with SilverBox</h3>
                <p className="text-blue-700">
                  All prescription data is automatically synced with your SilverBox medication manager 
                  for automated reminders and tracking.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">Upcoming Appointments</h2>
            <Button onClick={() => toast.info('Opening appointment scheduler...')}>
              Schedule New
            </Button>
          </div>

          {upcomingAppointments.map((apt, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Heart className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-gray-900">{apt.doctor}</h3>
                      <Badge variant="outline">{apt.specialty}</Badge>
                      <Badge>{apt.type}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{apt.date} at {apt.time}</span>
                      </div>
                      <p>{apt.location}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info(`Rescheduling appointment with ${apt.doctor}...`)}
                  >
                    Reschedule
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.warning(`Canceling appointment with ${apt.doctor}...`)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sharing" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Authorized Healthcare Providers</h3>
            <div className="space-y-3">
              {['Dr. Sarah Hossain - Primary Care', 'Professor Ali Hasan - Cardiology', 'IBN Sina\'s Hospital'].map((provider, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Share2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-900">{provider}</p>
                      <p className="text-sm text-gray-600">Full access granted</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Manage Access</Button>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4">Add Healthcare Provider</Button>
          </Card>

          {userRole === 'family' && (
            <Card className="p-6 bg-purple-50 border-purple-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-purple-900 mb-2">Family Access</h3>
                  <p className="text-purple-700 mb-3">
                    You have been granted access to view and manage medical records. 
                    All actions are logged and visible to the patient.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toast.info('Opening access log...')}
                    >
                      View Access Log
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toast.info('Opening privacy settings...')}
                    >
                      Privacy Settings
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
