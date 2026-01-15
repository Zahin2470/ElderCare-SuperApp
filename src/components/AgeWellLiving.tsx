import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Home, Users, Calendar, MessageSquare, Video, MapPin, Coffee } from 'lucide-react';

export default function AgeWellLiving() {
  const communityEvents = [
    {
      title: 'Morning Yoga Class',
      date: 'Tomorrow, 9:00 AM',
      location: 'Community Center',
      attendees: 12,
      type: 'Wellness',
      image: null,
    },
    {
      title: 'Book Club Meeting',
      date: 'Oct 14, 2:00 PM',
      location: 'Library Room',
      attendees: 8,
      type: 'Social',
      image: null,
    },
    {
      title: 'Cooking Workshop',
      date: 'Oct 15, 11:00 AM',
      location: 'Main Kitchen',
      attendees: 15,
      type: 'Activity',
      image: null,
    },
  ];

  const availableRooms = [
    {
      id: 1,
      name: 'Serenity Gardens Retirement Community',
      type: 'Independent Living',
      size: '450 sq ft',
      floor: '2nd Floor',
      features: ['Wheelchair Accessible', 'Private Bath', 'Kitchenette'],
      price: '৳35,200/month',
      available: 'Available Now',
      image: null,
    },
    {
      id: 2,
      name: 'Golden Years Residence',
      type: 'Assisted Living',
      size: '650 sq ft',
      floor: '1st Floor',
      features: ['Balcony', 'Full Kitchen', 'Emergency Call System'],
      price: '৳45,100/month',
      available: 'Available Nov 1',
      image: null,
    },
  ];

  const myBookings = [
    {
      facility: 'Community Room',
      date: 'Oct 14, 2025',
      time: '3:00 PM - 5:00 PM',
      purpose: 'Family Visit',
      status: 'confirmed',
    },
    {
      facility: 'Game Room',
      date: 'Oct 16, 2025',
      time: '1:00 PM - 3:00 PM',
      purpose: 'Card Game with Friends',
      status: 'pending',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">🏡 AgeWell Living</h1>
        <p className="text-gray-600">Co-living management and community engagement</p>
      </div>

      <Tabs defaultValue="community" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="rooms">Virtual Tour</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="community" className="space-y-6">
          {/* Community Feed Header */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 mb-1">Welcome to Harmony Gardens</h2>
                <p className="text-gray-600">15 active members • 8 events this week</p>
              </div>
              <Button>
                <MessageSquare className="w-4 h-4 mr-2" />
                Community Chat
              </Button>
            </div>
          </Card>

          {/* Upcoming Events */}
          <div>
            <h2 className="text-gray-900 mb-4">Upcoming Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityEvents.map((event, idx) => (
                <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-40 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-purple-300" />
                  </div>
                  <div className="p-5">
                    <Badge variant="outline" className="mb-3">
                      {event.type}
                    </Badge>
                    <h3 className="text-gray-900 mb-2">{event.title}</h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.attendees} attending</span>
                      </div>
                    </div>
                    <Button className="w-full">Join Event</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Community Features */}
          <div>
            <h2 className="text-gray-900 mb-4">Amenities & Services</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
                <Coffee className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                <h3 className="text-gray-900 mb-2">Cafe & Dining</h3>
                <p className="text-sm text-gray-600">Three daily meals included</p>
              </Card>
              <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
                <Home className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h3 className="text-gray-900 mb-2">24/7 Care Staff</h3>
                <p className="text-sm text-gray-600">Always here to help</p>
              </Card>
              <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
                <Users className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h3 className="text-gray-900 mb-2">Social Activities</h3>
                <p className="text-sm text-gray-600">Daily programs & events</p>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">Available Living Spaces</h2>
            <Button variant="outline">
              <Video className="w-4 h-4 mr-2" />
              Schedule Virtual Tour
            </Button>
          </div>

          <div className="space-y-6">
            {availableRooms.map((room, idx) => (
              <Card key={idx} className="overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3 h-64 md:h-auto bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Home className="w-24 h-24 text-purple-300" />
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-gray-900 mb-1">{room.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{room.type}</span>
                          <span>•</span>
                          <span>{room.size}</span>
                          <span>•</span>
                          <span>{room.floor}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl text-purple-600">{room.price}</p>
                        <Badge variant="secondary" className="mt-1">
                          {room.available}
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {room.features.map((feature, i) => (
                          <Badge key={i} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button>
                        <Video className="w-4 h-4 mr-2" />
                        Virtual Tour
                      </Button>
                      <Button variant="outline">Schedule Visit</Button>
                      <Button variant="outline">Apply Now</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">My Room Bookings</h2>
            <Button>Book a Room</Button>
          </div>

          {myBookings.map((booking, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Home className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 mb-1">{booking.facility}</h3>
                    <div className="space-y-1 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{booking.time}</span>
                      </div>
                      <p>Purpose: {booking.purpose}</p>
                    </div>
                  </div>
                </div>
                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                  {booking.status}
                </Badge>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" size="sm">
                  Modify
                </Button>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}