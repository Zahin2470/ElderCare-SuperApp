import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, Star, Clock, MapPin, Calendar, MessageCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function ElderLink() {
  const [selectedCaregiver, setSelectedCaregiver] = useState<number | null>(null);

  const caregivers = [
    {
      id: 1,
      name: 'Nelufa Yeasmin',
      rating: 4.5,
      reviews: 127,
      experience: '8 years',
      specialties: ['Companionship', 'Mobility Assistance', 'Meal Prep'],
      rate: '৳3,850/hr',
      availability: 'Available Today',
      image: null,
      distance: '2.3 miles away',
      verified: true,
    },
    {
      id: 2,
      name: 'Abrar Hossain Zahin',
      rating: 5,
      reviews: 194,
      experience: '10 years',
      specialties: ['Personal Care', 'Transportation', 'Light Housekeeping'],
      rate: '৳3,520/hr',
      availability: 'Available Tomorrow',
      image: null,
      distance: '3.1 miles away',
      verified: true,
    },
    {
      id: 3,
      name: 'Faisal Ahmed',
      rating: 4.5,
      reviews: 156,
      experience: '7 years',
      specialties: ['Medical Care', 'Dementia Care', 'Physical Therapy'],
      rate: '৳2,950/hr',
      availability: 'Next Week',
      image: null,
      distance: '1.8 miles away',
      verified: true,
    },
  ];

  const upcomingVisits = [
    {
      caregiver: 'Nelufa Yeasmin',
      date: 'Tomorrow, Oct 13',
      time: '2:00 PM - 5:00 PM',
      services: ['Companionship', 'Meal Prep'],
      status: 'confirmed',
    },
    {
      caregiver: 'Abrar Hossain Zahin',
      date: 'Oct 15, 2025',
      time: '10:00 AM - 2:00 PM',
      services: ['Transportation', 'Light Housekeeping'],
      status: 'pending',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">💛 ElderLink</h1>
        <p className="text-gray-600">Book trusted caregivers for your loved ones</p>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Bar */}
          <Card className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by service, specialty, or location..."
                  className="pl-10"
                />
              </div>
              <Button onClick={() => toast.info('Searching for caregivers...')}>Search</Button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-purple-100"
                onClick={() => toast.info('Filtering by Companionship')}
              >
                Companionship
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-purple-100"
                onClick={() => toast.info('Filtering by Personal Care')}
              >
                Personal Care
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-purple-100"
                onClick={() => toast.info('Filtering by Medical Care')}
              >
                Medical Care
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-purple-100"
                onClick={() => toast.info('Filtering by Transportation')}
              >
                Transportation
              </Badge>
            </div>
          </Card>

          {/* Caregiver Listings */}
          <div className="space-y-4">
            {caregivers.map((caregiver) => (
              <Card key={caregiver.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xl">
                      {caregiver.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-gray-900">{caregiver.name}</h3>
                          {caregiver.verified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{caregiver.rating}</span>
                            <span className="text-gray-400">({caregiver.reviews} reviews)</span>
                          </div>
                          <span>•</span>
                          <span>{caregiver.experience} experience</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-purple-600 text-xl">{caregiver.rate}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {caregiver.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-50">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{caregiver.distance}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{caregiver.availability}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setSelectedCaregiver(caregiver.id);
                          toast.success(`Scheduling visit with ${caregiver.name}...`);
                        }}
                        className="flex-1 md:flex-initial"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Visit
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => toast.info(`Opening chat with ${caregiver.name}...`)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => toast.info(`Viewing ${caregiver.name}'s profile...`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">Upcoming Visits</h2>
            <Button 
              variant="outline"
              onClick={() => toast.info('Opening caregiver scheduling...')}
            >
              Schedule New Visit
            </Button>
          </div>

          {upcomingVisits.map((visit, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {visit.caregiver.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-gray-900 mb-1">{visit.caregiver}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{visit.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{visit.time}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={visit.status === 'confirmed' ? 'default' : 'secondary'}>
                  {visit.status}
                </Badge>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Services:</p>
                <div className="flex gap-2">
                  {visit.services.map((service, i) => (
                    <Badge key={i} variant="outline">{service}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast.info(`Rescheduling visit with ${visit.caregiver}...`)}
                >
                  Reschedule
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast.warning(`Canceling visit with ${visit.caregiver}...`)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast.info(`Opening chat with ${visit.caregiver}...`)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-8 text-center">
            <p className="text-gray-600">No past visits yet</p>
            <Button 
              className="mt-4"
              onClick={() => toast.success('Let\'s find a caregiver for you!')}
            >
              Book Your First Visit
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}