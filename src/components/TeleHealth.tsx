import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import DoctorCard from './telehealth/DoctorCard';
import VideoControls from './telehealth/VideoControls';
import { 
  Search, Video, Calendar, Clock, MessageSquare, FileText, 
  Heart, Brain, Bone, Eye, Stethoscope, Phone, X, Send,
  CheckCircle2, Star, DollarSign, CreditCard
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';

type ViewType = 'home' | 'profile' | 'booking' | 'call' | 'summary';

export default function TeleHealth() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Video call states
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00');
  const [chatOpen, setChatOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const specialties = [
    { id: 1, name: 'Cardiology', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-50' },
    { id: 2, name: 'Neurology', icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { id: 3, name: 'Orthopedics', icon: Bone, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { id: 4, name: 'Ophthalmology', icon: Eye, color: 'text-green-500', bgColor: 'bg-green-50' },
    { id: 5, name: 'General', icon: Stethoscope, color: 'text-orange-500', bgColor: 'bg-orange-50' },
  ];

  const doctors = [
    {
      id: 1,
      name: 'Professor Ali Hasan',
      specialty: 'Cardiology',
      designation: 'Senior Consultant',
      hospital: 'Square Hospital, Dhaka',
      rating: 4.9,
      reviews: 234,
      experience: '25 years',
      nextAvailable: 'Today 3:00 PM',
      fee: '৳1300',
      about: 'Renowned cardiologist with expertise in geriatric heart care and preventive cardiology.',
      education: ['MBBS - Dhaka Medical College', 'MD Cardiology - BSMMU'],
      languages: ['English', 'Bengali', 'Hindi'],
    },
    {
      id: 2,
      name: 'Dr. Nusrat Ahmed',
      specialty: 'General Medicine',
      designation: 'Consultant Physician',
      hospital: 'United Hospital, Dhaka',
      rating: 4.8,
      reviews: 189,
      experience: '15 years',
      nextAvailable: 'Tomorrow 10:00 AM',
      fee: '৳1500',
      about: 'Experienced in managing chronic conditions in elderly patients.',
      education: ['MBBS - Chittagong Medical College', 'FCPS Medicine'],
      languages: ['English', 'Bengali'],
    },
    {
      id: 3,
      name: 'Dr. Rahman Chowdhury',
      specialty: 'Neurology',
      designation: 'Associate Professor',
      hospital: 'BIRDEM Hospital, Dhaka',
      rating: 5.0,
      reviews: 156,
      experience: '18 years',
      nextAvailable: 'Oct 22, 2:00 PM',
      fee: '৳1600',
      about: 'Specialist in dementia, stroke prevention, and cognitive health.',
      education: ['MBBS - DMC', 'MD Neurology - BSMMU'],
      languages: ['English', 'Bengali'],
    },
  ];

  const upcomingAppointments = [
    {
      id: 1,
      doctor: 'Professor Ali Hasan',
      speciality: 'Cardiology',
      date: 'Today',
      time: '3:00 PM',
      type: 'Video Consultation',
      status: 'confirmed',
    },
    {
      id: 2,
      doctor: 'Dr. Fatima Rahman',
      speciality: 'General Medicine',
      date: 'Tomorrow',
      time: '10:00 AM',
      type: 'Video Consultation',
      status: 'confirmed',
    },
  ];

  const pastConsults = [
    {
      id: 1,
      doctor: 'Professor Ali Hasan',
      date: 'Oct 10, 2025',
      diagnosis: 'Hypertension - well controlled',
      prescription: 'Continue current medications',
      notes: 'Blood pressure stable, lifestyle modifications discussed',
    },
    {
      id: 2,
      doctor: 'Dr. Fatima Rahman',
      date: 'Sep 28, 2025',
      diagnosis: 'Routine checkup',
      prescription: 'Vitamin D supplement added',
      notes: 'Overall health good, recommended annual screening',
    },
  ];

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  const handleBookAppointment = (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor);
    setCurrentView('profile');
  };

  const handleProceedToBooking = () => {
    setCurrentView('booking');
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }
    toast.success('Appointment booked successfully!');
    setCurrentView('home');
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleJoinCall = () => {
    setCurrentView('call');
    // Simulate call duration timer
    let seconds = 0;
    const timer = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      setCallDuration(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
  };

  const handleEndCall = () => {
    setCurrentView('summary');
    setCallDuration('00:00');
  };

  // T01: TeleHealth Home
  const renderHome = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 mb-2">TeleHealth</h1>
        <p className="text-gray-600">Connect with doctors anytime, anywhere</p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search doctors by name, speciality..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>Search</Button>
        </div>
      </Card>

      {/* Specialties */}
      <div>
        <h2 className="text-gray-900 mb-4">Specialties</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {specialties.map((specialty) => {
            const Icon = specialty.icon;
            return (
              <Card
                key={specialty.id}
                className={`p-4 ${specialty.bgColor} border-2 hover:border-purple-300 cursor-pointer transition-all hover:shadow-md`}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-12 h-12 rounded-full ${specialty.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${specialty.color}`} />
                  </div>
                  <p className="text-sm text-gray-900">{specialty.name}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h2 className="text-gray-900 mb-4">Upcoming Appointments</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingAppointments.map((apt) => (
              <Card key={apt.id} className="p-5 border-l-4 border-l-purple-500">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-gray-900">{apt.doctor}</h3>
                    <p className="text-sm text-gray-600">{apt.speciality}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    {apt.status}
                  </Badge>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{apt.date} at {apt.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Video className="w-4 h-4" />
                    <span>{apt.type}</span>
                  </div>
                </div>
                <Button className="w-full" onClick={handleJoinCall}>
                  <Video className="w-4 h-4 mr-2" />
                  Join Video Call
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Doctors */}
      <div>
        <h2 className="text-gray-900 mb-4">Available Doctors</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onBook={handleBookAppointment}
            />
          ))}
        </div>
      </div>

      {/* Past Consultations */}
      <div>
        <h2 className="text-gray-900 mb-4">Recent Consultations</h2>
        <Card className="divide-y">
          {pastConsults.map((consult) => (
            <div key={consult.id} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-gray-900">{consult.doctor}</h4>
                  <p className="text-sm text-gray-500">{consult.date}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-sm"><span className="text-gray-600">Diagnosis:</span> {consult.diagnosis}</p>
                <p className="text-sm"><span className="text-gray-600">Notes:</span> {consult.notes}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );

  // T02: Doctor Profile
  const renderDoctorProfile = () => {
    if (!selectedDoctor) return null;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setCurrentView('home')}>
          ← Back to Doctors
        </Button>

        <Card className="p-6">
          <div className="flex gap-6 mb-6">
            <Avatar className="w-24 h-24 border-4 border-purple-200">
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-2xl">
                {selectedDoctor.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-gray-900 mb-2">{selectedDoctor.name}</h1>
              <p className="text-gray-600 mb-3">{selectedDoctor.speciality}</p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-900">{selectedDoctor.rating}</span>
                  <span className="text-sm text-gray-500">({selectedDoctor.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Stethoscope className="w-5 h-5" />
                  <span>{selectedDoctor.experience} experience</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-gray-900">{selectedDoctor.fee}</span>
                  <span>per session</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleProceedToBooking}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Quick Chat
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-gray-900 mb-2">About</h3>
              <p className="text-gray-600">{selectedDoctor.about}</p>
            </div>

            <div>
              <h3 className="text-gray-900 mb-2">Education</h3>
              <ul className="space-y-1">
                {selectedDoctor.education.map((edu: string, idx: number) => (
                  <li key={idx} className="text-gray-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {edu}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-gray-900 mb-2">Languages</h3>
              <div className="flex gap-2">
                {selectedDoctor.languages.map((lang: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{lang}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-gray-900 mb-3">Next Available</h3>
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">{selectedDoctor.nextAvailable}</span>
                  <Button size="sm" className="ml-auto">Book This Slot</Button>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // T03: Booking Slot
  const renderBooking = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => setCurrentView('profile')}>
        ← Back to Profile
      </Button>

      <Card className="p-6">
        <h2 className="text-gray-900 mb-6">Schedule Appointment</h2>

        {selectedDoctor && (
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg mb-6">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white">
                {selectedDoctor.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-gray-900">{selectedDoctor.name}</h4>
              <p className="text-sm text-gray-600">{selectedDoctor.speciality}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-gray-900">{selectedDoctor.fee}</p>
              <p className="text-xs text-gray-500">Consultation Fee</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-gray-900 mb-3">Select Date</label>
            <div className="grid grid-cols-4 gap-2">
              {['Oct 20', 'Oct 21', 'Oct 22', 'Oct 23', 'Oct 24', 'Oct 25', 'Oct 26', 'Oct 27'].map((date) => (
                <Button
                  key={date}
                  variant={selectedDate === date ? 'default' : 'outline'}
                  className="h-auto py-3"
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="text-center">
                    <div className="text-sm">{date.split(' ')[0]}</div>
                    <div>{date.split(' ')[1]}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-900 mb-3">Select Time</label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-gray-900 mb-2">Pre-call Checks</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Camera access enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Microphone working</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Stable internet connection</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Consultation Fee</span>
              <span className="text-gray-900">{selectedDoctor?.fee}</span>
            </div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-900">Total</span>
              <span className="text-2xl text-purple-600">{selectedDoctor?.fee}</span>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Later
              </Button>
              <Button className="flex-1" onClick={handleConfirmBooking}>
                Confirm & Pay
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // T05: Video Call
  const renderVideoCall = () => (
    <div className="fixed inset-0 bg-gray-900 z-50">
      <div className="h-full flex flex-col">
        {/* Main video area */}
        <div className="flex-1 relative">
          {/* Doctor's video (main) */}
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white">
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-4xl">
                  AH
                </AvatarFallback>
              </Avatar>
              <h3 className="text-white text-2xl mb-2">Professor Ali Hasan</h3>
              <Badge className="bg-green-500">Connected</Badge>
            </div>
          </div>

          {/* Your video (PiP) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-white shadow-xl overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
              {cameraOn ? (
                <div className="text-white text-center">
                  <div className="text-sm">Your Camera</div>
                </div>
              ) : (
                <div className="text-white text-center">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-xs">Camera Off</div>
                </div>
              )}
            </div>
          </div>

          {/* Chat sidebar */}
          {chatOpen && (
            <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-xl flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-gray-900">Chat</h3>
                <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-900">How are you feeling today?</p>
                  <p className="text-xs text-gray-500 mt-1">Professor Ali Hasan</p>
                </div>
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input placeholder="Type a message..." />
                  <Button size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notes sidebar */}
          {notesOpen && (
            <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-xl flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-gray-900">Notes</h3>
                <Button variant="ghost" size="icon" onClick={() => setNotesOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 p-4">
                <Textarea
                  placeholder="Doctor's notes will appear here..."
                  className="h-full resize-none"
                  defaultValue="Patient reports feeling well. Blood pressure stable. Continue current medication regimen."
                />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6">
          <VideoControls
            muted={muted}
            cameraOn={cameraOn}
            screenSharing={screenSharing}
            onToggleMute={() => setMuted(!muted)}
            onToggleCamera={() => setCameraOn(!cameraOn)}
            onToggleScreenShare={() => setScreenSharing(!screenSharing)}
            onEndCall={handleEndCall}
            onOpenChat={() => {
              setChatOpen(!chatOpen);
              setNotesOpen(false);
            }}
            onOpenNotes={() => {
              setNotesOpen(!notesOpen);
              setChatOpen(false);
            }}
            callDuration={callDuration}
          />
        </div>
      </div>
    </div>
  );

  // T06: Consult Summary
  const renderSummary = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center py-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-gray-900 mb-2">Consultation Complete</h1>
        <p className="text-gray-600">Your consultation summary is ready</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 pb-6 border-b">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-xl">
              AH
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-gray-900">Professor Ali Hasan</h3>
            <p className="text-sm text-gray-600">Cardiology</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Date</p>
            <p className="text-gray-900">Oct 19, 2025</p>
          </div>
        </div>

        <div className="space-y-6 py-6">
          <div>
            <h4 className="text-gray-900 mb-2">Diagnosis</h4>
            <p className="text-gray-600">Hypertension - well controlled with current medication regimen</p>
          </div>

          <div>
            <h4 className="text-gray-900 mb-3">Prescriptions</h4>
            <div className="space-y-2">
              <Card className="p-4 bg-purple-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-900">Lisinopril 10mg</p>
                    <p className="text-sm text-gray-600">Once daily, morning</p>
                  </div>
                  <Badge>Continue</Badge>
                </div>
              </Card>
              <Card className="p-4 bg-purple-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-900">Aspirin 75mg</p>
                    <p className="text-sm text-gray-600">Once daily, evening</p>
                  </div>
                  <Badge>Continue</Badge>
                </div>
              </Card>
            </div>
          </div>

          <div>
            <h4 className="text-gray-900 mb-2">Doctor's Notes</h4>
            <Card className="p-4 bg-gray-50">
              <p className="text-gray-600">
                Patient reports feeling well overall. Blood pressure readings are stable. 
                Encouraged to continue current lifestyle modifications including regular 
                walking and low-sodium diet. Follow-up in 3 months or sooner if any concerns.
              </p>
            </Card>
          </div>

          <div>
            <h4 className="text-gray-900 mb-2">Next Steps</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-600">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Continue current medications
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Monitor blood pressure weekly
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Follow-up appointment in 3 months
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="text-gray-900 mb-1">Care360 Integration</h4>
                <p className="text-sm text-gray-600 mb-3">
                  This consultation summary has been automatically saved to your Care360 health records.
                </p>
                <Button variant="outline" size="sm">
                  View in Care360
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t">
          <Button variant="outline" className="flex-1">
            <FileText className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button className="flex-1" onClick={() => setCurrentView('home')}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );

  // Render based on current view
  return (
    <div className="min-h-screen">
      {currentView === 'home' && renderHome()}
      {currentView === 'profile' && renderDoctorProfile()}
      {currentView === 'booking' && renderBooking()}
      {currentView === 'call' && renderVideoCall()}
      {currentView === 'summary' && renderSummary()}
    </div>
  );
}