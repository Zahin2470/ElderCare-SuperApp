import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import {
  ArrowLeft,
  Pill,
  Clock,
  CheckCircle,
  Calendar,
  Bell,
  Camera,
  Search,
  Filter,
} from 'lucide-react';
import { useNavigation } from '../navigation/NavigationContext';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

// SB01: Meds Overview - Daily schedule
export function SB01_MedsOverview() {
  const { navigateToFrame, navigateBack } = useNavigation();

  const medications = [
    {
      id: 1,
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      time: '8:00 AM',
      takenToday: false,
      status: 'overdue',
      purpose: 'Blood Pressure',
      instructions: 'Take with breakfast',
    },
    {
      id: 2,
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      time: '8:00 AM, 8:00 PM',
      takenToday: true,
      status: 'taken',
      purpose: 'Diabetes',
      instructions: 'Take with meals',
    },
    {
      id: 3,
      name: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily',
      time: '8:00 PM',
      takenToday: false,
      status: 'upcoming',
      purpose: 'Cholesterol',
      instructions: 'Take before bedtime',
    },
    {
      id: 4,
      name: 'Aspirin',
      dosage: '81mg',
      frequency: 'Once daily',
      time: '8:00 AM',
      takenToday: true,
      status: 'taken',
      purpose: 'Heart Health',
      instructions: 'Take with food',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'taken':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'upcoming':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge variant="destructive" className="text-xs">
            Overdue
          </Badge>
        );
      case 'taken':
        return (
          <Badge className="bg-green-600 text-xs">Taken</Badge>
        );
      case 'upcoming':
        return (
          <Badge variant="outline" className="text-xs">
            Upcoming
          </Badge>
        );
      default:
        return null;
    }
  };

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
          <h1 className="text-gray-900 mb-2">💊 Today's Medications</h1>
          <p className="text-gray-600">Sunday, Oct 19, 2025</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigateToFrame('silverbox', 'SB04_Med_History')}
        >
          View History
        </Button>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl text-gray-900">4</p>
              <p className="text-sm text-gray-600">Total Meds Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl text-gray-900">2</p>
              <p className="text-sm text-gray-600">Taken</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <Bell className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl text-gray-900">1</p>
              <p className="text-sm text-gray-600">Overdue</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Medication List */}
      <div className="space-y-4">
        {medications.map((med) => (
          <Card
            key={med.id}
            className={`p-6 border-2 ${getStatusColor(med.status)} transition-all`}
          >
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white rounded-lg">
                <Pill className="w-8 h-8 text-purple-600" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-gray-900 flex items-center gap-2">
                      {med.name} {med.dosage}
                      {getStatusBadge(med.status)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{med.purpose}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Schedule</p>
                      <p className="text-gray-900">{med.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Frequency</p>
                      <p className="text-gray-900">{med.frequency}</p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600">Instructions</p>
                    <p className="text-gray-900">{med.instructions}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {!med.takenToday && (
                    <>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() =>
                          navigateToFrame('silverbox', 'SB02_MarkAsTaken', med)
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Taken
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigateToFrame('silverbox', 'SB03_TakeNow', med)
                        }
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Take Now
                      </Button>
                    </>
                  )}
                  {med.takenToday && (
                    <Badge className="bg-green-600 py-2 px-4">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Taken at 8:05 AM
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// SB02: Mark as Taken - Confirm flow + log
export function SB02_MarkAsTaken() {
  const { navigateBack, currentNavigation } = useNavigation();
  const med = currentNavigation.data || { name: 'Medication', dosage: '10mg' };
  const [notes, setNotes] = useState('');
  const [withFood, setWithFood] = useState(false);

  const handleConfirm = () => {
    toast.success(`${med.name} marked as taken!`);
    navigateBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <Button variant="ghost" onClick={navigateBack} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="p-8 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Pill className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Mark Medication as Taken</h1>
          <p className="text-gray-600">Confirm you've taken this medication</p>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="text-center mb-4">
            <h3 className="text-gray-900">{med.name}</h3>
            <p className="text-xl text-purple-700">{med.dosage}</p>
            <p className="text-sm text-gray-600 mt-2">{med.purpose}</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Current Time</p>
              <p className="text-gray-900">{new Date().toLocaleTimeString()}</p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="withFood"
                checked={withFood}
                onCheckedChange={(checked) => setWithFood(checked as boolean)}
              />
              <label htmlFor="withFood" className="text-gray-700 cursor-pointer">
                Taken with food
              </label>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Notes (optional)
              </label>
              <Input
                placeholder="Any side effects or observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleConfirm}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Taken
          </Button>
          <Button variant="outline" className="w-full" onClick={navigateBack}>
            Cancel
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// SB03: Take Now - Start immediate reminder + camera/photo proof optional
export function SB03_TakeNow() {
  const { navigateToFrame, navigateBack, currentNavigation } = useNavigation();
  const med = currentNavigation.data || { name: 'Medication', dosage: '10mg' };
  const [photoTaken, setPhotoTaken] = useState(false);

  const handleTakePhoto = () => {
    setPhotoTaken(true);
    toast.success('Photo captured!');
  };

  const handleComplete = () => {
    navigateToFrame('silverbox', 'SB02_MarkAsTaken', med);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <Button variant="ghost" onClick={navigateBack} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="text-center mb-6">
          <Bell className="w-20 h-20 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h1 className="text-gray-900 mb-2">🔔 Time to Take Medication</h1>
          <p className="text-gray-600">Follow the steps below to take your medication safely</p>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-gray-900 mb-2">{med.name}</h2>
            <p className="text-2xl text-purple-700 mb-2">{med.dosage}</p>
            <Badge variant="outline">{med.purpose}</Badge>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="text-gray-900 mb-1">Prepare your medication</p>
                <p className="text-sm text-gray-600">
                  Get a glass of water and your {med.name} pill
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="text-gray-900 mb-1">Take the medication</p>
                <p className="text-sm text-gray-600">
                  {med.instructions || 'Take with water'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="text-gray-900 mb-1">Capture proof (optional)</p>
                <p className="text-sm text-gray-600 mb-3">
                  Take a photo for your family member to verify
                </p>
                {!photoTaken ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTakePhoto}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Photo captured</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={handleComplete}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          I've Taken This Medication
        </Button>
      </Card>
    </motion.div>
  );
}

// SB04: Med History - Filterable list
export function SB04_Med_History() {
  const { navigateBack } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const historyEntries = [
    {
      date: 'Today, 8:05 AM',
      medication: 'Metformin 500mg',
      status: 'taken',
      notes: 'Taken with breakfast',
      takenBy: 'Md. Mosarraf Hossain',
    },
    {
      date: 'Today, 8:05 AM',
      medication: 'Aspirin 81mg',
      status: 'taken',
      notes: 'Taken with food',
      takenBy: 'Md. Mosarraf Hossain',
    },
    {
      date: 'Yesterday, 8:00 PM',
      medication: 'Metformin 500mg',
      status: 'taken',
      notes: 'Taken with dinner',
      takenBy: 'Md. Mosarraf Hossain',
    },
    {
      date: 'Yesterday, 8:00 PM',
      medication: 'Atorvastatin 20mg',
      status: 'taken',
      notes: 'Before bedtime',
      takenBy: 'Md. Mosarraf Hossain',
    },
    {
      date: 'Yesterday, 8:00 AM',
      medication: 'Lisinopril 10mg',
      status: 'missed',
      notes: 'Missed - family notified',
      takenBy: '-',
    },
    {
      date: 'Oct 17, 8:05 AM',
      medication: 'Metformin 500mg',
      status: 'taken',
      notes: 'Taken with breakfast',
      takenBy: 'Md. Mosarraf Hossain',
    },
  ];

  const filteredHistory = historyEntries.filter((entry) => {
    const matchesSearch = entry.medication.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div>
        <Button variant="ghost" onClick={navigateBack} className="mb-2 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </Button>
        <h1 className="text-gray-900 mb-2">📋 Medication History</h1>
        <p className="text-gray-600">Complete log of all medication activities</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search medications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className="flex-1"
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'taken' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('taken')}
              className="flex-1"
            >
              Taken
            </Button>
            <Button
              variant={filterStatus === 'missed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('missed')}
              className="flex-1"
            >
              Missed
            </Button>
          </div>
        </div>
      </Card>

      {/* History List */}
      <Card className="divide-y">
        {filteredHistory.map((entry, idx) => (
          <div key={idx} className="p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    entry.status === 'taken'
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}
                >
                  {entry.status === 'taken' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Bell className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-gray-900 mb-1">{entry.medication}</h3>
                  <p className="text-sm text-gray-600 mb-2">{entry.date}</p>
                  {entry.notes && (
                    <p className="text-sm text-gray-700">
                      <span className="text-gray-500">Note:</span> {entry.notes}
                    </p>
                  )}
                  {entry.takenBy !== '-' && (
                    <p className="text-sm text-gray-600 mt-1">
                      By: {entry.takenBy}
                    </p>
                  )}
                </div>
              </div>
              <Badge
                className={
                  entry.status === 'taken'
                    ? 'bg-green-600'
                    : 'bg-red-600'
                }
              >
                {entry.status === 'taken' ? 'Taken' : 'Missed'}
              </Badge>
            </div>
          </div>
        ))}
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-green-50 border-2 border-green-200">
          <h3 className="text-gray-900 mb-2">This Week</h3>
          <p className="text-4xl text-green-600 mb-1">95%</p>
          <p className="text-sm text-gray-600">Adherence Rate</p>
        </Card>
        <Card className="p-6 bg-blue-50 border-2 border-blue-200">
          <h3 className="text-gray-900 mb-2">Total Taken</h3>
          <p className="text-4xl text-blue-600 mb-1">28</p>
          <p className="text-sm text-gray-600">Last 7 days</p>
        </Card>
        <Card className="p-6 bg-red-50 border-2 border-red-200">
          <h3 className="text-gray-900 mb-2">Missed</h3>
          <p className="text-4xl text-red-600 mb-1">2</p>
          <p className="text-sm text-gray-600">Last 7 days</p>
        </Card>
      </div>
    </motion.div>
  );
}
