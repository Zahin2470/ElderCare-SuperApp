import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Users,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  Home,
  Play,
  FileText,
  Edit,
} from 'lucide-react';
import { useNavigation } from '../navigation/NavigationContext';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

// AW01: Community Chat Room - Group chat + moderation tools
export function AW01_CommunityChatRoom() {
  const { navigateBack } = useNavigation();
  const [message, setMessage] = useState('');

  const messages = [
    {
      sender: 'Fatima Rahman',
      text: 'Good morning everyone! The gardens are looking beautiful today 🌸',
      time: '8:45 AM',
      isMe: false,
    },
    {
      sender: 'Ahmed Khan',
      text: 'Indeed! I enjoyed my morning walk there. The roses are in full bloom.',
      time: '8:47 AM',
      isMe: false,
    },
    {
      sender: 'Md. Mosarraf Hossain',
      text: 'Has anyone seen the announcement about tomorrow\'s music night?',
      time: '8:50 AM',
      isMe: true,
    },
    {
      sender: 'Sarah Johnson',
      text: 'Yes! It starts at 7 PM in the main hall. Looking forward to it!',
      time: '8:52 AM',
      isMe: false,
    },
    {
      sender: 'Community Manager',
      text: '📢 Reminder: Yoga class at 10 AM in the wellness center. All levels welcome!',
      time: '9:00 AM',
      isMe: false,
      isAnnouncement: true,
    },
  ];

  const onlineMembers = [
    { name: 'Fatima Rahman', status: 'online' },
    { name: 'Ahmed Khan', status: 'online' },
    { name: 'Sarah Johnson', status: 'online' },
    { name: 'Community Manager', status: 'online' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto h-[calc(100vh-200px)] flex flex-col"
    >
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={navigateBack} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Badge variant="outline">
          <Users className="w-3 h-3 mr-1" />
          {onlineMembers.length} online
        </Badge>
      </div>

      <div className="flex-1 grid md:grid-cols-4 gap-6">
        {/* Chat Area */}
        <Card className="md:col-span-3 flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
            <h2 className="text-gray-900 flex items-center gap-2">
              💬 Community Chat Room
            </h2>
            <p className="text-sm text-gray-600">
              AgeWell Gardens Community • Open conversation
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-md ${msg.isAnnouncement ? 'w-full' : ''}`}>
                  {!msg.isMe && !msg.isAnnouncement && (
                    <p className="text-sm text-gray-600 mb-1 ml-2">{msg.sender}</p>
                  )}
                  <div
                    className={`p-4 rounded-lg ${
                      msg.isAnnouncement
                        ? 'bg-blue-50 border-2 border-blue-200 text-center'
                        : msg.isMe
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="mb-1">{msg.text}</p>
                    <p
                      className={`text-xs ${
                        msg.isAnnouncement
                          ? 'text-blue-600'
                          : msg.isMe
                          ? 'text-purple-200'
                          : 'text-gray-500'
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && message.trim()) {
                    toast.success('Message sent to community');
                    setMessage('');
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (message.trim()) {
                    toast.success('Message sent to community');
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

        {/* Online Members Sidebar */}
        <Card className="p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Online Members
          </h3>
          <div className="space-y-3">
            {onlineMembers.map((member, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{member.name}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Online</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm text-gray-600 mb-3">Community Guidelines</h4>
            <ul className="text-xs text-gray-700 space-y-2">
              <li>• Be respectful and kind</li>
              <li>• No spam or advertising</li>
              <li>• Keep conversations appropriate</li>
              <li>• Report inappropriate behavior</li>
            </ul>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

// AW02: Event Detail - Join event + RSVP
export function AW02_EventDetail() {
  const { navigateBack } = useNavigation();
  const [isRegistered, setIsRegistered] = useState(false);
  const [guestCount, setGuestCount] = useState(1);

  const event = {
    title: 'Music Night Under the Stars',
    date: 'Friday, October 25, 2025',
    time: '7:00 PM - 10:00 PM',
    location: 'Main Hall, AgeWell Gardens',
    description:
      'Join us for a magical evening of live music featuring local artists and community performers. Enjoy refreshments, socialize with neighbors, and create beautiful memories under our beautifully decorated main hall.',
    organizer: 'Community Events Team',
    capacity: 50,
    registered: 32,
    highlights: [
      'Live music performances',
      'Light refreshments included',
      'Wheelchair accessible',
      'Family members welcome',
    ],
  };

  const handleRSVP = () => {
    setIsRegistered(true);
    toast.success('Successfully registered for the event!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <Button variant="ghost" onClick={navigateBack} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Button>

      {/* Event Header */}
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="text-6xl">🎵</div>
          <div className="flex-1">
            <h1 className="text-gray-900 mb-3">{event.title}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-4 h-4 text-purple-600" />
                <span>
                  {event.registered}/{event.capacity} registered
                </span>
              </div>
            </div>
          </div>
        </div>

        <Badge variant="secondary" className="mb-4">
          Organized by {event.organizer}
        </Badge>
      </Card>

      {/* Event Description */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-3">About This Event</h3>
        <p className="text-gray-700 leading-relaxed mb-6">{event.description}</p>

        <h4 className="text-gray-900 mb-3">Event Highlights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {event.highlights.map((highlight, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">{highlight}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* RSVP Section */}
      {!isRegistered ? (
        <Card className="p-6 bg-purple-50 border-2 border-purple-200">
          <h3 className="text-gray-900 mb-4">Register for This Event</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Number of Guests (including yourself)
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                >
                  -
                </Button>
                <span className="text-2xl text-gray-900 min-w-12 text-center">
                  {guestCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGuestCount(Math.min(4, guestCount + 1))}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-2">Maximum 4 guests per registration</p>
            </div>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleRSVP}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Registration
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-green-50 border-2 border-green-200">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-gray-900 mb-2">You're Registered!</h3>
            <p className="text-gray-700 mb-4">
              Registration confirmed for {guestCount} {guestCount === 1 ? 'person' : 'people'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setIsRegistered(false)}>
                Modify Registration
              </Button>
              <Button
                variant="outline"
                className="text-red-600"
                onClick={() => {
                  setIsRegistered(false);
                  toast.info('Registration cancelled');
                }}
              >
                Cancel Registration
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Other Attendees */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4">Other Attendees</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Fatima R.', 'Ahmed K.', 'Sarah J.', 'Michael C.'].map((name, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                  {name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700">{name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-sm">+28 more</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// AW03: Virtual Tour - Gallery + video
export function AW03_VirtualTour() {
  const { navigateBack } = useNavigation();
  const [activeView, setActiveView] = useState<'gallery' | 'video'>('gallery');

  const galleryImages = [
    { title: 'Main Entrance', description: 'Welcoming entrance with 24/7 security', emoji: '🏛️' },
    { title: 'Garden & Terrace', description: 'Beautiful landscaped gardens', emoji: '🌳' },
    { title: 'Dining Hall', description: 'Spacious dining area with gourmet meals', emoji: '🍽️' },
    { title: 'Wellness Center', description: 'Fully equipped fitness and yoga studio', emoji: '💪' },
    { title: 'Library', description: 'Extensive collection of books and quiet spaces', emoji: '📚' },
    { title: 'Private Suites', description: 'Comfortable and modern living spaces', emoji: '🛏️' },
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
            Back
          </Button>
          <h1 className="text-gray-900 mb-2">🏡 Virtual Tour - AgeWell Gardens</h1>
          <p className="text-gray-600">Explore our beautiful community from the comfort of home</p>
        </div>
      </div>

      {/* View Switcher */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            variant={activeView === 'gallery' ? 'default' : 'outline'}
            onClick={() => setActiveView('gallery')}
            className="flex-1"
          >
            Gallery View
          </Button>
          <Button
            variant={activeView === 'video' ? 'default' : 'outline'}
            onClick={() => setActiveView('video')}
            className="flex-1"
          >
            Video Tour
          </Button>
        </div>
      </Card>

      {activeView === 'gallery' ? (
        <>
          {/* Gallery Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {galleryImages.map((image, idx) => (
              <Card
                key={idx}
                className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300"
              >
                <div className="text-center mb-4">
                  <div className="text-6xl mb-4">{image.emoji}</div>
                  <h3 className="text-gray-900 mb-2">{image.title}</h3>
                  <p className="text-sm text-gray-600">{image.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info('Opening full view...')}
                >
                  View Details
                </Button>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Video Player */}
          <Card className="p-8">
            <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-6">
              <div className="text-center">
                <Play className="w-24 h-24 text-purple-600 mx-auto mb-4" />
                <h3 className="text-gray-900 mb-2">Full Video Tour</h3>
                <p className="text-gray-600 mb-4">15 minute comprehensive tour</p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Play className="w-4 h-4 mr-2" />
                  Play Video
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-gray-900 mb-2">Tour Highlights</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• All facilities walkthrough</li>
                  <li>• Resident testimonials</li>
                  <li>• Activity showcase</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-gray-900 mb-2">Duration</h4>
                <p className="text-sm text-gray-700">15:30 minutes</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-gray-900 mb-2">Language</h4>
                <p className="text-sm text-gray-700">English with subtitles</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* CTA Section */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex items-start gap-4">
          <div className="text-5xl">✨</div>
          <div className="flex-1">
            <h3 className="text-gray-900 mb-2">Ready to Apply?</h3>
            <p className="text-gray-700 mb-4">
              Schedule an in-person tour or submit your application today to join our wonderful
              community
            </p>
            <div className="flex gap-3">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Apply Now
              </Button>
              <Button variant="outline">Schedule In-Person Tour</Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// AW04: Apply Now - Application form
export function AW04_ApplyNow() {
  const { navigateToFrame, navigateBack } = useNavigation();
  const [formData, setFormData] = useState({
    fullName: 'Md. Mosarraf Hossain',
    dateOfBirth: '',
    phone: '+880',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalConditions: '',
    moveInDate: '',
    roomPreference: 'Private Suite',
  });

  const handleSubmit = () => {
    if (!formData.fullName || !formData.phone || !formData.emergencyContact) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Application submitted successfully!');
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
        Back
      </Button>

      <div>
        <h1 className="text-gray-900 mb-2">📝 Application Form</h1>
        <p className="text-gray-600">Join the AgeWell Gardens Community</p>
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Full Name *</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Date of Birth *</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Phone Number *</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Email Address</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Emergency Contact Name *
                </label>
                <Input
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContact: e.target.value })
                  }
                  placeholder="Abrar Hossain Zahin"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Emergency Contact Phone *
                </label>
                <Input
                  value={formData.emergencyPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyPhone: e.target.value })
                  }
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <h3 className="text-gray-900 mb-4">Medical Information</h3>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Medical Conditions (optional)
              </label>
              <Textarea
                value={formData.medicalConditions}
                onChange={(e) =>
                  setFormData({ ...formData, medicalConditions: e.target.value })
                }
                placeholder="Please list any medical conditions, allergies, or special care requirements..."
                rows={4}
              />
            </div>
          </div>

          {/* Housing Preferences */}
          <div>
            <h3 className="text-gray-900 mb-4">Housing Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Room Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Private Suite', 'Shared Room', 'Studio', 'Apartment'].map((type) => (
                    <Button
                      key={type}
                      variant={formData.roomPreference === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, roomPreference: type })}
                      className="w-full"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Preferred Move-in Date
                </label>
                <Input
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={handleSubmit}
            >
              <FileText className="w-4 h-4 mr-2" />
              Submit Application
            </Button>
            <Button variant="outline" onClick={navigateBack}>
              Save Draft
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-4 text-center">
            By submitting, you agree to our terms and privacy policy
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

// AW05: Modify Application - Edit + save
export function AW05_ModifyApplication() {
  const { navigateBack } = useNavigation();
  const [formData, setFormData] = useState({
    status: 'Under Review',
    submittedDate: 'Oct 10, 2025',
    roomPreference: 'Private Suite',
    moveInDate: '2025-11-01',
    notes: 'Looking forward to joining the community!',
  });

  const handleUpdate = () => {
    toast.success('Application updated successfully!');
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
        Back
      </Button>

      <div>
        <h1 className="text-gray-900 mb-2">✏️ Modify Application</h1>
        <p className="text-gray-600">Update your housing application details</p>
      </div>

      {/* Application Status */}
      <Card className="p-6 bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <FileText className="w-8 h-8 text-blue-600" />
          <div className="flex-1">
            <h3 className="text-gray-900 mb-2">Application Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Status</p>
                <Badge className="mt-1 bg-blue-600">{formData.status}</Badge>
              </div>
              <div>
                <p className="text-gray-600">Submitted</p>
                <p className="text-gray-900 mt-1">{formData.submittedDate}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Editable Fields */}
      <Card className="p-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-gray-900 mb-4">Housing Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Room Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Private Suite', 'Shared Room', 'Studio', 'Apartment'].map((type) => (
                    <Button
                      key={type}
                      variant={formData.roomPreference === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, roomPreference: type })}
                      className="w-full"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Move-in Date</label>
                <Input
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Additional Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information or special requests..."
              rows={4}
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex gap-3">
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={handleUpdate}
          >
            <Edit className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button
            variant="outline"
            className="text-red-600"
            onClick={() => {
              toast.info('Application withdrawn');
              navigateBack();
            }}
          >
            Withdraw Application
          </Button>
        </div>
      </Card>

      {/* Contact Support */}
      <Card className="p-6 bg-purple-50 border-2 border-purple-200">
        <h3 className="text-gray-900 mb-3">Need Help?</h3>
        <p className="text-gray-700 mb-4">
          If you have questions about your application, our team is here to help
        </p>
        <Button variant="outline">
          <MessageCircle className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
      </Card>
    </motion.div>
  );
}
