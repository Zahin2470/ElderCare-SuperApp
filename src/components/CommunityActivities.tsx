import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import EventCard from './activity/EventCard';
import CalendarItem from './activity/CalendarItem';
import {
  Search, Calendar as CalendarIcon, Users, MapPin, Clock, 
  MessageCircle, Send, Filter, Heart, Music, Dumbbell, 
  Book, Paintbrush, Coffee, PartyPopper, Globe, CheckCircle2
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';

type ViewType = 'home' | 'event-detail' | 'booking' | 'group-chat' | 'my-events';

export default function CommunityActivities() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 1, name: 'Exercise', icon: Dumbbell, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { id: 2, name: 'Arts & Crafts', icon: Paintbrush, color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { id: 3, name: 'Book Club', icon: Book, color: 'text-green-500', bgColor: 'bg-green-50' },
    { id: 4, name: 'Music', icon: Music, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { id: 5, name: 'Social', icon: Coffee, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { id: 6, name: 'Celebrations', icon: PartyPopper, color: 'text-red-500', bgColor: 'bg-red-50' },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Morning Yoga & Meditation',
      date: 'Oct 20, 2025',
      time: '8:00 AM - 9:00 AM',
      location: 'AgeWell Community Center - Room 101',
      distance: '0.5 miles',
      attendees: 12,
      capacity: 15,
      type: 'in-person' as const,
      category: 'Exercise',
      description: 'Start your day with gentle yoga and guided meditation. Suitable for all levels.',
      host: 'Nilufa Yasmin',
      image: null,
    },
    {
      id: 2,
      title: 'Virtual Book Discussion: "The Midnight Library"',
      date: 'Oct 21, 2025',
      time: '3:00 PM - 4:30 PM',
      location: 'Zoom Meeting',
      attendees: 24,
      capacity: 30,
      type: 'online' as const,
      category: 'Book Club',
      description: 'Join fellow book lovers to discuss this month\'s selection.',
      host: 'Abrar Hossain Zahin',
      image: null,
    },
    {
      id: 3,
      title: 'Watercolor Painting Workshop',
      date: 'Oct 22, 2025',
      time: '2:00 PM - 4:00 PM',
      location: 'AgeWell Community Center - Art Studio',
      attendees: 8,
      capacity: 12,
      type: 'in-person' as const,
      category: 'Arts & Crafts',
      description: 'Learn basic watercolor techniques. All materials provided.',
      host: 'Faisal Ahmed',
      image: null,
    },
    {
      id: 4,
      title: 'Sunday Brunch Social',
      date: 'Oct 24, 2025',
      time: '11:00 AM - 1:00 PM',
      location: 'AgeWell Dining Hall',
      attendees: 32,
      capacity: 40,
      type: 'in-person' as const,
      category: 'Social',
      description: 'Enjoy a delicious brunch and make new friends!',
      host: 'Community Team',
      image: null,
    },
    {
      id: 5,
      title: 'Classical Music Appreciation',
      date: 'Oct 25, 2025',
      time: '4:00 PM - 5:30 PM',
      location: 'Virtual - Google Meet',
      attendees: 18,
      capacity: 25,
      type: 'online' as const,
      category: 'Music',
      description: 'Explore the works of Beethoven with music historian Dr. Williams.',
      host: 'Dr. Halima Sultana Munia',
      image: null,
    },
    {
      id: 6,
      title: 'Chair Exercise Class',
      date: 'Oct 26, 2025',
      time: '10:00 AM - 11:00 AM',
      location: 'AgeWell Community Center - Fitness Room',
      attendees: 15,
      capacity: 20,
      type: 'in-person' as const,
      category: 'Exercise',
      description: 'Low-impact exercises designed for seniors. Improve strength and flexibility.',
      host: 'Fitness Team',
      image: null,
    },
  ];

  const myRegisteredEvents = [
    {
      id: 1,
      title: 'Morning Yoga & Meditation',
      date: 'Oct 20, 2025',
      time: '8:00 AM',
      location: 'AgeWell Community Center',
      type: 'Exercise',
      reminder: true,
    },
    {
      id: 2,
      title: 'Virtual Book Discussion',
      date: 'Oct 21, 2025',
      time: '3:00 PM',
      location: 'Zoom Meeting',
      type: 'Book Club',
      reminder: true,
    },
    {
      id: 4,
      title: 'Sunday Brunch Social',
      date: 'Oct 24, 2025',
      time: '11:00 AM',
      location: 'AgeWell Dining Hall',
      type: 'Social',
      reminder: false,
    },
  ];

  const groupChats = [
    {
      id: 1,
      name: 'Yoga Enthusiasts',
      members: 12,
      lastMessage: 'See you all tomorrow morning!',
      lastMessageTime: '10 mins ago',
      unread: 2,
    },
    {
      id: 2,
      name: 'Book Club October',
      members: 24,
      lastMessage: 'What did everyone think of chapter 5?',
      lastMessageTime: '1 hour ago',
      unread: 5,
    },
  ];

  const handleJoinEvent = (eventId: number) => {
    const event = upcomingEvents.find(e => e.id === eventId);
    setSelectedEvent(event);
    setCurrentView('event-detail');
  };

  const handleBookEvent = () => {
    setCurrentView('booking');
  };

  const handleConfirmBooking = () => {
    toast.success('Successfully registered for the event!');
    setCurrentView('home');
  };

  const handleToggleReminder = (eventId: number) => {
    toast.success('Reminder updated!');
  };

  // C01: Activities Home
  const renderHome = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 mb-2">Community & Activities</h1>
        <p className="text-gray-600">Connect, learn, and have fun with your community</p>
      </div>

      {/* Search & Filter */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search events, classes, groups..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl text-gray-900">{myRegisteredEvents.length}</p>
              <p className="text-sm text-gray-600">Upcoming Events</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl text-gray-900">2</p>
              <p className="text-sm text-gray-600">Group Chats</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl text-gray-900">8</p>
              <p className="text-sm text-gray-600">Events Attended</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-gray-900 mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className={`p-4 ${category.bgColor} border-2 hover:border-purple-300 cursor-pointer transition-all hover:shadow-md`}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-12 h-12 rounded-full ${category.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <p className="text-sm text-gray-900">{category.name}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* My Registered Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900">My Registered Events</h2>
          <Button variant="ghost" onClick={() => setCurrentView('my-events')}>
            View All →
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {myRegisteredEvents.map((event) => (
            <CalendarItem
              key={event.id}
              event={event}
              compact
              onToggleReminder={handleToggleReminder}
            />
          ))}
        </div>
      </div>

      {/* Upcoming Events Feed */}
      <div>
        <h2 className="text-gray-900 mb-4">Upcoming Events</h2>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="in-person">In-Person</TabsTrigger>
            <TabsTrigger value="online">Online</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={handleJoinEvent}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in-person" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.filter(e => e.type === 'in-person').map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={handleJoinEvent}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="online" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.filter(e => e.type === 'online').map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={handleJoinEvent}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <Card className="p-8 text-center">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No events scheduled for today</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Group Chats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900">Group Chats</h2>
          <Button variant="ghost" onClick={() => setCurrentView('group-chat')}>
            View All →
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {groupChats.map((chat) => (
            <Card
              key={chat.id}
              className="p-5 hover:shadow-md transition-all cursor-pointer hover:border-purple-300"
              onClick={() => setCurrentView('group-chat')}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-gray-900">{chat.name}</h4>
                    {chat.unread > 0 && (
                      <Badge className="bg-red-500 text-white">{chat.unread}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{chat.members} members</p>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                  <p className="text-xs text-gray-400 mt-1">{chat.lastMessageTime}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // C02: Event Detail
  const renderEventDetail = () => {
    if (!selectedEvent) return null;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setCurrentView('home')}>
          ← Back to Events
        </Button>

        <Card className="overflow-hidden">
          {/* Event Header Image */}
          <div className="h-48 bg-gradient-to-br from-purple-400 via-blue-400 to-purple-500 flex items-center justify-center relative">
            <div className="text-center text-white">
              <div className="text-6xl mb-2">
                {selectedEvent.category === 'Exercise' ? '🧘' :
                 selectedEvent.category === 'Book Club' ? '📚' :
                 selectedEvent.category === 'Arts & Crafts' ? '🎨' :
                 selectedEvent.category === 'Music' ? '🎵' : '☕'}
              </div>
              <h1 className="text-white text-3xl">{selectedEvent.title}</h1>
            </div>
            <Badge className="absolute top-4 right-4 bg-white text-purple-700">
              {selectedEvent.category}
            </Badge>
          </div>

          <div className="p-6 space-y-6">
            {/* Event Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="text-gray-900">{selectedEvent.date}</p>
                    <p className="text-gray-900">{selectedEvent.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900">{selectedEvent.location}</p>
                    {selectedEvent.distance && (
                      <p className="text-sm text-gray-500">{selectedEvent.distance} away</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Attendance</p>
                    <p className="text-gray-900">
                      {selectedEvent.attendees} / {selectedEvent.capacity} registered
                    </p>
                    {selectedEvent.capacity - selectedEvent.attendees <= 5 && (
                      <p className="text-sm text-orange-600">
                        Only {selectedEvent.capacity - selectedEvent.attendees} spots left!
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Host</p>
                    <p className="text-gray-900">{selectedEvent.host}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-gray-900 mb-2">About This Event</h3>
              <p className="text-gray-600">{selectedEvent.description}</p>
            </div>

            {/* RSVP Section */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="text-gray-900 mb-3">Ready to join?</h4>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleBookEvent}>
                  Register for Event
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Join Group Chat
                </Button>
              </div>
            </div>

            {/* Similar Events */}
            <div>
              <h3 className="text-gray-900 mb-3">Similar Events</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {upcomingEvents
                  .filter(e => e.category === selectedEvent.category && e.id !== selectedEvent.id)
                  .slice(0, 2)
                  .map((event) => (
                    <Card key={event.id} className="p-4 hover:border-purple-300 cursor-pointer">
                      <h4 className="text-gray-900 mb-2">{event.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // C03: Event Booking
  const renderBooking = () => {
    if (!selectedEvent) return null;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setCurrentView('event-detail')}>
          ← Back to Event
        </Button>

        <Card className="p-6">
          <h2 className="text-gray-900 mb-6">Register for Event</h2>

          {/* Event Summary */}
          <Card className="p-4 bg-purple-50 mb-6">
            <h3 className="text-gray-900 mb-3">{selectedEvent.title}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <CalendarIcon className="w-4 h-4" />
                <span>{selectedEvent.date} at {selectedEvent.time}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{selectedEvent.location}</span>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            {/* Registration Options */}
            <div>
              <h3 className="text-gray-900 mb-3">Registration Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-gray-900">Add to calendar</p>
                    <p className="text-sm text-gray-500">Get reminders before the event</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-gray-900">Join group chat</p>
                    <p className="text-sm text-gray-500">Connect with other attendees</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            <div>
              <h3 className="text-gray-900 mb-3">Special Requirements (Optional)</h3>
              <Textarea
                placeholder="Any accessibility needs or dietary restrictions?"
                className="min-h-24"
              />
            </div>

            {/* Confirmation */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="text-gray-900 mb-1">Free Event</h4>
                  <p className="text-sm text-gray-600">
                    This is a complimentary event for AgeWell residents and community members.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setCurrentView('event-detail')}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleConfirmBooking}>
                Confirm Registration
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // C04: Group Chat
  const renderGroupChat = () => (
    <div className="max-w-5xl mx-auto">
      <Card className="h-[600px] flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView('home')}>
              ← 
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-gray-900">Yoga Enthusiasts</h3>
              <p className="text-sm text-gray-500">12 members</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            View Members
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-purple-200">SJ</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm text-gray-900">Sarah Johnson</span>
                <span className="text-xs text-gray-500">9:30 AM</span>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-gray-700">Good morning everyone! Looking forward to tomorrow's session. Don't forget to bring your yoga mats!</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-200">MC</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm text-gray-900">Michael Chen</span>
                <span className="text-xs text-gray-500">9:45 AM</span>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-gray-700">Thanks for the reminder! Should I bring anything else?</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-purple-200">SJ</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm text-gray-900">Sarah Johnson</span>
                <span className="text-xs text-gray-500">10:00 AM</span>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-gray-700">Just your mat and a water bottle. We provide everything else! See you all tomorrow morning! 🧘‍♀️</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <div className="flex-1 max-w-md">
              <div className="flex items-baseline gap-2 mb-1 justify-end">
                <span className="text-xs text-gray-500">10:15 AM</span>
                <span className="text-sm text-gray-900">You</span>
              </div>
              <div className="bg-purple-600 text-white p-3 rounded-lg shadow-sm">
                <p>Perfect! Can't wait. Thanks Sarah!</p>
              </div>
            </div>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-green-200">MH</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input placeholder="Type a message..." className="flex-1" />
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  // C05: My Events
  const renderMyEvents = () => (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => setCurrentView('home')}>
        ← Back to Activities
      </Button>

      <div>
        <h1 className="text-gray-900 mb-2">My Registered Events</h1>
        <p className="text-gray-600">View and manage your upcoming activities</p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {myRegisteredEvents.map((event) => (
              <CalendarItem
                key={event.id}
                event={event}
                onToggleReminder={handleToggleReminder}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <Card className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">You've attended 8 events this year!</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Render based on current view
  return (
    <div>
      {currentView === 'home' && renderHome()}
      {currentView === 'event-detail' && renderEventDetail()}
      {currentView === 'booking' && renderBooking()}
      {currentView === 'group-chat' && renderGroupChat()}
      {currentView === 'my-events' && renderMyEvents()}
    </div>
  );
}
