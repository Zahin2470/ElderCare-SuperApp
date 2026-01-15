import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Calendar } from '../ui/calendar';
import { 
  ArrowLeft, Star, MapPin, Clock, DollarSign, CheckCircle, 
  MessageCircle, Send, Calendar as CalendarIcon, Shield 
} from 'lucide-react';
import { useNavigation } from '../navigation/NavigationContext';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

// EL01: Search Results - List of Caregivers
export function EL01_SearchResults() {
  const { navigateToFrame, navigateBack } = useNavigation();

  const caregivers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      rating: 4.9,
      reviews: 127,
      experience: '8 years',
      specialties: ['Companionship', 'Mobility Assistance', 'Meal Prep'],
      rate: '৳3,850/hr',
      availability: 'Available Today',
      distance: '2.3 miles away',
      verified: true,
    },
    {
      id: 2,
      name: 'Michael Chen',
      rating: 4.8,
      reviews: 94,
      experience: '5 years',
      specialties: ['Personal Care', 'Transportation', 'Light Housekeeping'],
      rate: '৳3,520/hr',
      availability: 'Available Tomorrow',
      distance: '3.1 miles away',
      verified: true,
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      rating: 5.0,
      reviews: 156,
      experience: '12 years',
      specialties: ['Medical Care', 'Dementia Care', 'Physical Therapy'],
      rate: '৳4,950/hr',
      availability: 'Next Week',
      distance: '1.8 miles away',
      verified: true,
    },
  ];

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
          <h1 className="text-gray-900 mb-2">💛 Find Caregivers</h1>
          <p className="text-gray-600">Browse and connect with trusted caregivers near you</p>
        </div>
      </div>

      {/* Search Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Search by name or specialty..." />
          <Input placeholder="Location (ZIP code)" />
          <Button className="bg-purple-600 hover:bg-purple-700">
            Search Caregivers
          </Button>
        </div>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <p className="text-gray-700">{caregivers.length} caregivers found near you</p>
        
        {caregivers.map((caregiver) => (
          <Card
            key={caregiver.id}
            className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300"
            onClick={() => navigateToFrame('elderlink', 'EL02_Caregiver_Profile', caregiver)}
          >
            <div className="flex gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-purple-100 text-purple-700 text-xl">
                  {caregiver.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-gray-900 flex items-center gap-2">
                      {caregiver.name}
                      {caregiver.verified && (
                        <Shield className="w-4 h-4 text-blue-600" />
                      )}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {caregiver.rating} ({caregiver.reviews} reviews)
                      </span>
                      <span>•</span>
                      <span>{caregiver.experience} experience</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl text-purple-700">{caregiver.rate}</p>
                    <Badge variant="outline" className="mt-1">
                      {caregiver.availability}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {caregiver.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {caregiver.distance}
                  </p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToFrame('elderlink', 'EL02_Caregiver_Profile', caregiver);
                    }}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// EL02: Caregiver Profile - Full profile with reviews
export function EL02_Caregiver_Profile() {
  const { navigateToFrame, navigateBack, currentNavigation } = useNavigation();
  const caregiver = currentNavigation.data || {
    name: 'Sarah Johnson',
    rating: 4.9,
    reviews: 127,
    experience: '8 years',
    specialties: ['Companionship', 'Mobility Assistance', 'Meal Prep'],
    rate: '৳3,850/hr',
    availability: 'Available Today',
    distance: '2.3 miles away',
    verified: true,
  };

  const reviews = [
    {
      author: 'Md. Mosarraf Hossain',
      rating: 5,
      date: 'Oct 10, 2025',
      comment: 'Sarah is wonderful! Very caring and professional. My family feels safe with her.',
    },
    {
      author: 'Abrar Hossain Zahin',
      rating: 5,
      date: 'Sep 28, 2025',
      comment: 'Excellent caregiver. Always on time and very attentive to Dad\'s needs.',
    },
    {
      author: 'Jennifer Smith',
      rating: 4,
      date: 'Sep 15, 2025',
      comment: 'Great service. Would recommend to anyone looking for reliable care.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <Button variant="ghost" onClick={navigateBack} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Search
      </Button>

      {/* Profile Header */}
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex gap-6">
          <Avatar className="w-32 h-32">
            <AvatarFallback className="bg-purple-200 text-purple-700 text-4xl">
              {caregiver.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-gray-900 mb-2 flex items-center gap-2">
              {caregiver.name}
              {caregiver.verified && (
                <Badge className="bg-blue-600">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-xl text-gray-900">{caregiver.rating}</span>
                <span className="text-gray-600">({caregiver.reviews} reviews)</span>
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-700">{caregiver.experience} experience</span>
            </div>

            <div className="flex gap-3 mb-4">
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => navigateToFrame('elderlink', 'EL03_ScheduleVisit', caregiver)}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Schedule Visit
              </Button>
              <Button
                variant="outline"
                onClick={() => navigateToFrame('elderlink', 'EL04_ChatSession', caregiver)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Hourly Rate</p>
                <p className="text-2xl text-purple-700">{caregiver.rate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Availability</p>
                <Badge variant="outline" className="mt-1">
                  {caregiver.availability}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Specialties */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4">Specialties & Services</h3>
        <div className="flex flex-wrap gap-2">
          {caregiver.specialties.map((specialty: string, idx: number) => (
            <Badge key={idx} variant="secondary" className="text-sm py-2 px-4">
              {specialty}
            </Badge>
          ))}
        </div>
      </Card>

      {/* About */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4">About {caregiver.name.split(' ')[0]}</h3>
        <p className="text-gray-700 leading-relaxed">
          With {caregiver.experience} of professional caregiving experience, I'm dedicated to providing 
          compassionate and reliable care to seniors. I specialize in creating a warm, supportive 
          environment while ensuring all daily needs are met with dignity and respect. My approach 
          focuses on building meaningful connections with both clients and their families.
        </p>
      </Card>

      {/* Reviews */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4">Reviews ({caregiver.reviews})</h3>
        <div className="space-y-4">
          {reviews.map((review, idx) => (
            <div key={idx} className="pb-4 border-b last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-gray-900">{review.author}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

// EL03: Schedule Visit - Choose date/time and services
export function EL03_ScheduleVisit() {
  const { navigateToFrame, navigateBack, currentNavigation } = useNavigation();
  const caregiver = currentNavigation.data || { name: 'Sarah Johnson', rate: '৳3,850/hr' };
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [duration, setDuration] = useState('3');
  const [services, setServices] = useState<string[]>(['Companionship']);

  const availableServices = [
    'Companionship',
    'Meal Prep',
    'Mobility Assistance',
    'Personal Care',
    'Light Housekeeping',
    'Transportation',
  ];

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  const toggleService = (service: string) => {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleSchedule = () => {
    navigateToFrame('elderlink', 'EL05_Booking_Confirmation', {
      caregiver,
      date: selectedDate,
      time: selectedTime,
      duration,
      services,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <Button variant="ghost" onClick={navigateBack} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Profile
      </Button>

      <div>
        <h1 className="text-gray-900 mb-2">📅 Schedule Visit</h1>
        <p className="text-gray-600">Book a visit with {caregiver.name}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Date & Time Selection */}
        <Card className="p-6">
          <h3 className="text-gray-900 mb-4">Select Date & Time</h3>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Date</p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Time Slot</p>
            <div className="grid grid-cols-4 gap-2">
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

          <div>
            <p className="text-sm text-gray-600 mb-2">Duration (hours)</p>
            <div className="grid grid-cols-4 gap-2">
              {['2', '3', '4', '6'].map((hrs) => (
                <Button
                  key={hrs}
                  variant={duration === hrs ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDuration(hrs)}
                  className="w-full"
                >
                  {hrs}h
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Services & Summary */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Select Services</h3>
            <div className="space-y-2">
              {availableServices.map((service) => (
                <label
                  key={service}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-purple-50 transition-colors"
                  style={{
                    borderColor: services.includes(service) ? '#9333ea' : '#e5e7eb',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={services.includes(service)}
                    onChange={() => toggleService(service)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">{service}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-purple-50 border-2 border-purple-200">
            <h3 className="text-gray-900 mb-4">Booking Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Caregiver</span>
                <span className="text-gray-900">{caregiver.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="text-gray-900">
                  {selectedDate?.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="text-gray-900">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="text-gray-900">{duration} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Services</span>
                <span className="text-gray-900">{services.length} selected</span>
              </div>
              <div className="pt-3 border-t flex justify-between">
                <span className="text-gray-900">Total Cost</span>
                <span className="text-2xl text-purple-700">
                  ৳{(3850 * parseInt(duration)).toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
              onClick={handleSchedule}
            >
              Continue to Booking
            </Button>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// EL04: Chat Session - In-app chat with message history
export function EL04_ChatSession() {
  const { navigateBack, currentNavigation } = useNavigation();
  const caregiver = currentNavigation.data || { name: 'Sarah Johnson' };
  const [message, setMessage] = useState('');

  const messages = [
    {
      sender: 'Sarah Johnson',
      text: 'Hello! Thanks for reaching out. How can I help you today?',
      time: '10:23 AM',
      isCaregiver: true,
    },
    {
      sender: 'You',
      text: 'Hi Sarah! I wanted to ask about your availability for next week.',
      time: '10:25 AM',
      isCaregiver: false,
    },
    {
      sender: 'Sarah Johnson',
      text: 'I have availability on Tuesday, Thursday, and Friday next week. What time works best for you?',
      time: '10:27 AM',
      isCaregiver: true,
    },
    {
      sender: 'You',
      text: 'Thursday afternoon would be perfect. Around 2 PM?',
      time: '10:28 AM',
      isCaregiver: false,
    },
    {
      sender: 'Sarah Johnson',
      text: 'That works great! I can do Thursday at 2 PM. How many hours would you like to book?',
      time: '10:30 AM',
      isCaregiver: true,
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      toast.success('Message sent to ' + caregiver.name);
      setMessage('');
    }
  };

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
              <AvatarFallback className="bg-purple-200 text-purple-700">
                {caregiver.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-gray-900">{caregiver.name}</h3>
              <p className="text-sm text-gray-600">Active now</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.isCaregiver ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-md p-4 rounded-lg ${
                  msg.isCaregiver
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-purple-600 text-white'
                }`}
              >
                <p className="mb-1">{msg.text}</p>
                <p
                  className={`text-xs ${
                    msg.isCaregiver ? 'text-gray-500' : 'text-purple-200'
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
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} className="bg-purple-600 hover:bg-purple-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// EL05: Booking Confirmation
export function EL05_Booking_Confirmation() {
  const { navigateBack, currentNavigation } = useNavigation();
  const booking = currentNavigation.data || {};

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h1 className="text-gray-900 mb-2">🎉 Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your visit has been scheduled successfully
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 text-left space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Caregiver</span>
            <span className="text-gray-900">{booking.caregiver?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date</span>
            <span className="text-gray-900">
              {booking.date?.toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time</span>
            <span className="text-gray-900">{booking.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration</span>
            <span className="text-gray-900">{booking.duration} hours</span>
          </div>
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600 mb-2">Services</p>
            <div className="flex flex-wrap gap-2">
              {booking.services?.map((service: string, idx: number) => (
                <Badge key={idx} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              toast.success('Confirmation sent to your email!');
              navigateBack();
            }}
          >
            Done
          </Button>
          <Button variant="outline" className="w-full" onClick={navigateBack}>
            View My Bookings
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}