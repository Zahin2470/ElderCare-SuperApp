import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Share2,
  Search,
  Filter,
  CheckCircle,
  Calendar as CalendarIcon,
  Clock,
  User,
} from 'lucide-react';
import { useNavigation } from '../navigation/NavigationContext';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

// C360_RecordsList - Filterable list of health records
export function C360_RecordsList() {
  const { navigateToFrame, navigateBack } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const records = [
    {
      id: 1,
      type: 'Lab Report',
      title: 'Blood Work - Complete Panel',
      date: 'Oct 15, 2025',
      doctor: 'Professor Ali Hasan',
      size: '2.4 MB',
      status: 'reviewed',
    },
    {
      id: 2,
      type: 'Prescription',
      title: 'Cardiovascular Medications',
      date: 'Oct 10, 2025',
      doctor: 'Professor Ali Hasan',
      size: '186 KB',
      status: 'active',
    },
    {
      id: 3,
      type: 'Imaging',
      title: 'Chest X-Ray',
      date: 'Oct 5, 2025',
      doctor: 'Dr. Sarah Ahmed',
      size: '5.2 MB',
      status: 'reviewed',
    },
    {
      id: 4,
      type: 'Visit Summary',
      title: 'Cardiology Checkup - Sept',
      date: 'Sep 28, 2025',
      doctor: 'Professor Ali Hasan',
      size: '512 KB',
      status: 'reviewed',
    },
    {
      id: 5,
      type: 'Lab Report',
      title: 'HbA1c Test Results',
      date: 'Sep 20, 2025',
      doctor: 'Dr. Rahman Khan',
      size: '1.1 MB',
      status: 'reviewed',
    },
  ];

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.doctor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || record.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const recordTypes = ['all', 'Lab Report', 'Prescription', 'Imaging', 'Visit Summary'];

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
          <h1 className="text-gray-900 mb-2">📋 Health Records</h1>
          <p className="text-gray-600">Manage and access all medical documents</p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => navigateToFrame('care360', 'C360_UploadRecord')}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Record
        </Button>
      </div>

      {/* Search & Filter */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {recordTypes.map((type) => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type)}
                className="whitespace-nowrap"
              >
                {type === 'all' ? 'All Records' : type}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Records Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredRecords.map((record) => (
          <Card
            key={record.id}
            className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300"
            onClick={() => navigateToFrame('care360', 'C360_ViewRecord', record)}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 mb-1 truncate">{record.title}</h3>
                    <Badge variant="secondary" className="text-xs mb-2">
                      {record.type}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>👨‍⚕️ {record.doctor}</p>
                  <p>📅 {record.date}</p>
                  <p>📦 {record.size}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToFrame('care360', 'C360_ViewRecord', record);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToFrame('care360', 'C360_ShareWithDoctor', record);
                    }}
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <h3 className="text-gray-900 mb-3">📅 Schedule Appointment</h3>
          <p className="text-gray-600 mb-4 text-sm">
            Book, reschedule, or cancel appointments with Professor Ali Hasan
          </p>
          <Button
            variant="outline"
            onClick={() => navigateToFrame('care360', 'C360_ScheduleAppt')}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Manage Appointments
          </Button>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200">
          <h3 className="text-gray-900 mb-3">💊 Request Refill</h3>
          <p className="text-gray-600 mb-4 text-sm">
            Request prescription refills from your healthcare provider
          </p>
          <Button
            variant="outline"
            onClick={() => navigateToFrame('care360', 'C360_RequestRefill')}
          >
            Request Refill
          </Button>
        </Card>
      </div>
    </motion.div>
  );
}

// C360_UploadRecord - Upload modal for PDFs/images
export function C360_UploadRecord() {
  const { navigateBack } = useNavigation();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('Lab Report');
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState('');

  const handleUpload = () => {
    if (!title || !selectedFile) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Record uploaded successfully!');
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
        Back to Records
      </Button>

      <Card className="p-8">
        <div className="text-center mb-6">
          <Upload className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-gray-900 mb-2">📤 Upload Health Record</h1>
          <p className="text-gray-600">Add a new medical document to your records</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Record Title *
            </label>
            <Input
              placeholder="e.g., Blood Work - Complete Panel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Record Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Lab Report', 'Prescription', 'Imaging', 'Visit Summary'].map((type) => (
                <Button
                  key={type}
                  variant={recordType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecordType(type)}
                  className="w-full"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Doctor Name</label>
              <Input
                placeholder="e.g., Professor Ali Hasan"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Upload File (PDF, JPG, PNG) *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
              }`}
              onClick={() => {
                setSelectedFile('blood-work-report.pdf');
                toast.success('File selected');
              }}
            >
              {selectedFile ? (
                <div>
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-900">{selectedFile}</p>
                  <p className="text-sm text-gray-600 mt-1">2.4 MB</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-700 mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PDF, JPG, or PNG (max 10MB)</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Notes (optional)
            </label>
            <Textarea
              placeholder="Add any additional notes about this record..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={handleUpload}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Record
          </Button>
          <Button variant="outline" onClick={navigateBack}>
            Cancel
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// C360_ViewRecord - Viewer + download
export function C360_ViewRecord() {
  const { navigateToFrame, navigateBack, currentNavigation } = useNavigation();
  const record = currentNavigation.data || {
    title: 'Blood Work - Complete Panel',
    type: 'Lab Report',
    date: 'Oct 15, 2025',
    doctor: 'Professor Ali Hasan',
    size: '2.4 MB',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={navigateBack} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Records
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toast.success('Downloading record...')}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateToFrame('care360', 'C360_ShareWithDoctor', record)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Record Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-white rounded-lg">
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-gray-900 mb-2">{record.title}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Type</p>
                <Badge variant="secondary" className="mt-1">
                  {record.type}
                </Badge>
              </div>
              <div>
                <p className="text-gray-600">Date</p>
                <p className="text-gray-900 mt-1">{record.date}</p>
              </div>
              <div>
                <p className="text-gray-600">Doctor</p>
                <p className="text-gray-900 mt-1">{record.doctor}</p>
              </div>
              <div>
                <p className="text-gray-600">Size</p>
                <p className="text-gray-900 mt-1">{record.size}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Document Viewer */}
      <Card className="p-8 bg-white min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-900 mb-2">Document Preview</h3>
          <p className="text-gray-600 mb-6">
            {record.type} - {record.title}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => toast.success('Opening in new window...')}
            >
              Open in New Window
            </Button>
            <Button onClick={() => toast.success('Downloading...')}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// C360_ShareWithDoctor - Consent modal + share
export function C360_ShareWithDoctor() {
  const { navigateBack, currentNavigation } = useNavigation();
  const record = currentNavigation.data || { title: 'Medical Record' };
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);

  const doctors = ['Professor Ali Hasan', 'Dr. Sarah Ahmed', 'Dr. Rahman Khan'];

  const handleShare = () => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    if (!consent) {
      toast.error('Please provide consent to share');
      return;
    }
    toast.success(`Record shared with ${selectedDoctor}!`);
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

      <Card className="p-8">
        <div className="text-center mb-6">
          <Share2 className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-gray-900 mb-2">Share Medical Record</h1>
          <p className="text-gray-600">Send this record to your healthcare provider</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Sharing record:</p>
          <p className="text-gray-900">{record.title}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Select Doctor *
            </label>
            <div className="space-y-2">
              {doctors.map((doctor) => (
                <label
                  key={doctor}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedDoctor === doctor
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="doctor"
                    checked={selectedDoctor === doctor}
                    onChange={() => setSelectedDoctor(doctor)}
                    className="w-4 h-4"
                  />
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{doctor}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Message (optional)
            </label>
            <Textarea
              placeholder="Add a message for your doctor..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-5 h-5 mt-0.5"
              />
              <div className="text-sm">
                <p className="text-gray-900 mb-1">
                  <strong>Consent to Share Medical Information</strong>
                </p>
                <p className="text-gray-700">
                  I authorize the sharing of this medical record with the selected healthcare
                  provider. I understand this information will be used for my medical care and
                  treatment.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Record
          </Button>
          <Button variant="outline" onClick={navigateBack}>
            Cancel
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// C360_RequestRefill - Refill request flow
export function C360_RequestRefill() {
  const { navigateBack } = useNavigation();
  const [selectedMed, setSelectedMed] = useState('');
  const [pharmacy, setPharmacy] = useState('Dhaka Central Pharmacy');
  const [notes, setNotes] = useState('');

  const medications = [
    'Lisinopril 10mg',
    'Metformin 500mg',
    'Atorvastatin 20mg',
    'Aspirin 81mg',
  ];

  const handleRequest = () => {
    if (!selectedMed) {
      toast.error('Please select a medication');
      return;
    }
    toast.success('Refill request sent to Professor Ali Hasan!');
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
        Back to Records
      </Button>

      <Card className="p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-gray-900 mb-2">💊 Request Prescription Refill</h1>
          <p className="text-gray-600">Request a refill from your healthcare provider</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Select Medication *
            </label>
            <div className="space-y-2">
              {medications.map((med) => (
                <label
                  key={med}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedMed === med
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="medication"
                    checked={selectedMed === med}
                    onChange={() => setSelectedMed(med)}
                    className="w-4 h-4"
                  />
                  <div className="text-3xl">💊</div>
                  <span className="text-gray-900">{med}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Preferred Pharmacy
            </label>
            <Input
              value={pharmacy}
              onChange={(e) => setPharmacy(e.target.value)}
              placeholder="Enter pharmacy name"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Additional Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific instructions or concerns..."
              rows={3}
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Your refill request will be sent to Professor Ali Hasan.
              You'll receive a notification once it's approved. Please allow 24-48 hours for
              processing.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={handleRequest}
          >
            Send Refill Request
          </Button>
          <Button variant="outline" onClick={navigateBack}>
            Cancel
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// C360_ScheduleAppt - Book appointment, reschedule/cancel
export function C360_ScheduleAppt() {
  const { navigateBack } = useNavigation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('In-Person');
  const [reason, setReason] = useState('');

  const timeSlots = [
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
  ];

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Appointment scheduled successfully!');
    navigateBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <Button variant="ghost" onClick={navigateBack} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Records
      </Button>

      <div>
        <h1 className="text-gray-900 mb-2">📅 Schedule Appointment</h1>
        <p className="text-gray-600">Book an appointment with Professor Ali Hasan</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Date & Time Selection */}
        <Card className="p-6">
          <h3 className="text-gray-900 mb-4">Select Date & Time</h3>

          <div className="mb-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-3">Available Time Slots</p>
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className="w-full"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Appointment Details */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Appointment Details</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Appointment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['In-Person', 'Video Call'].map((type) => (
                    <Button
                      key={type}
                      variant={appointmentType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAppointmentType(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Reason for Visit *
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe your health concern or reason for visit..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-purple-50 border-2 border-purple-200">
            <h3 className="text-gray-900 mb-4">Appointment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor</span>
                <span className="text-gray-900">Professor Ali Hasan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="text-gray-900">
                  {selectedDate?.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="text-gray-900">{selectedTime || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="text-gray-900">{appointmentType}</span>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
              onClick={handleSchedule}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          </Card>
        </div>
      </div>

      {/* Existing Appointments */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4">Upcoming Appointments</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl text-purple-700">13</p>
                <p className="text-sm text-gray-600">Oct</p>
              </div>
              <div>
                <p className="text-gray-900">Cardiology Checkup</p>
                <p className="text-sm text-gray-600">2:00 PM • Professor Ali Hasan</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Reschedule
              </Button>
              <Button size="sm" variant="outline" className="text-red-600">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
