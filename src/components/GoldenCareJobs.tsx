import React from 'react';
import { useNavigate } from 'react-router-dom'; // primary navigation
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Search, Star, Briefcase, Clock, DollarSign, MessageCircle, Video } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const figmaDocUrl = '/mnt/data/IT Project Management and Entrepreneurship.docx'; // uploaded file path (fallback)

function navigateTo(targetRoute?: string, figmaTarget?: string) {
  try {
    const _navigate = (window as any).__app_navigate as ((p: string) => void) | undefined;
    if (_navigate && targetRoute) {
      _navigate(targetRoute);
      return;
    }
    if (targetRoute) {
      window.location.href = targetRoute; // fallback to regular navigation
      return;
    }
  } catch (err) {
  }

  // Figma / local doc fallback (copies to clipboard & opens fragment if allowed)
  const frag = figmaTarget ? `#${encodeURIComponent(figmaTarget)}` : '';
  const payload = `${figmaDocUrl}${frag}`;
  try {
    navigator.clipboard?.writeText(payload);
    toast.info(`Open Figma mapping: ${figmaTarget || 'GC_Main'} (copied path)`);
  } catch {
    window.open(payload, '_blank', 'noopener,noreferrer');
  }
}

export default function GoldenCareJobs() {
  // useNavigate from react-router-dom if present in your project
  let navigateHook: ((p: string) => void) | undefined;
  try {
    navigateHook = (window as any).__app_navigate;
  } catch {
    navigateHook = undefined;
  }

  const mentors = [
    {
      id: 1,
      name: 'Mohammod Zahin Khan',
      expertise: 'Financial Planning',
      experience: '35 years in wealth management',
      skills: ['Investment Strategy', 'Retirement Planning', 'Tax Planning'],
      rate: '৳5,500/hour',
      rating: 4.9,
      reviews: 45,
      availability: 'Available this week',
      verified: true,
      age: 63,
      bio: 'Senior wealth manager who has advised families and institutions across three decades.',
    },
    {
      id: 2,
      name: 'Azra Zabin Maisha',
      expertise: 'Career Coaching',
      experience: '30 years in HR and talent development',
      skills: ['Resume Writing', 'Interview Prep', 'Career Transition'],
      rate: '৳4,400/hour',
      rating: 5.0,
      reviews: 62,
      availability: 'Available today',
      verified: true,
      age: 58,
      bio: 'Former HR director with deep expertise in career transitions and interview coaching.',
    },
    {
      id: 3,
      name: 'Saif Ali Khan',
      expertise: 'Business Consulting',
      experience: '40 years building and selling businesses',
      skills: ['Startup Strategy', 'Sales', 'Leadership'],
      rate: '৳8,250/hour',
      rating: 4.8,
      reviews: 38,
      availability: 'Available next week',
      verified: true,
      age: 67,
      bio: 'Serial entrepreneur and adviser who has scaled multiple startups to exits.',
    },
  ];

  const skillCategories = [
    { name: 'Business & Entrepreneurship', count: 45, icon: '💼' },
    { name: 'Financial Planning', count: 32, icon: '💰' },
    { name: 'Career Development', count: 28, icon: '📈' },
    { name: 'Arts & Crafts', count: 56, icon: '🎨' },
    { name: 'Technology & Computing', count: 18, icon: '💻' },
    { name: 'Health & Wellness', count: 24, icon: '🧘' },
  ];

  const myBookings = [
    {
      id: 'bk-001',
      mentor: 'Mohammod Zahin Khan',
      topic: 'Retirement Portfolio Review',
      date: 'Oct 14, 2025',
      time: '3:00 PM',
      duration: '1 hour',
      status: 'confirmed',
      type: 'video',
    },
    {
      id: 'bk-002',
      mentor: 'Azra Zabin Maisha',
      topic: 'Resume Review Session',
      date: 'Oct 18, 2025',
      time: '2:00 PM',
      duration: '45 minutes',
      status: 'pending',
      type: 'chat',
    },
  ];

  const handleOpenProfile = (mentorId: number, mentorName: string) => {
    toast.info(`Opening ${mentorName}'s profile...`);
    const route = `/goldencare/mentors/${mentorId}`;
    if (navigateHook) return navigateHook(route);
    navigateTo(route, 'GC_MentorProfile');
  };

  const handleBookSession = (mentorId: number, mentorName: string) => {
    toast.success(`Booking session with ${mentorName}...`);
    const route = `/goldencare/book/${mentorId}`;
    if (navigateHook) return navigateHook(route);
    navigateTo(route, 'GC_Booking_Start');
  };

  const handleMessage = (mentorId: number, mentorName: string) => {
    toast.info(`Opening chat with ${mentorName}...`);
    const route = `/goldencare/chat/${mentorId}`;
    if (navigateHook) return navigateHook(route);
    navigateTo(route, 'GC_Chat');
  };

  const handleJoinSession = (bookingId: string, bookingType: string, mentorName: string) => {
    if (bookingType === 'video') {
      toast.success(`Joining video session with ${mentorName}...`);
      const route = `/goldencare/session/${bookingId}`;
      if (navigateHook) return navigateHook(route);
      navigateTo(route, 'GC_Session_Room');
    } else {
      toast.success(`Opening chat session with ${mentorName}...`);
      const route = `/goldencare/session/${bookingId}/chat`;
      if (navigateHook) return navigateHook(route);
      navigateTo(route, 'GC_Chat');
    }
  };

  const handleReschedule = (bookingId: string) => {
    toast.info('Rescheduling session...');
    const route = `/goldencare/session/${bookingId}/reschedule`;
    if (navigateHook) return navigateHook(route);
    navigateTo(route, 'GC_Reschedule');
  };

  const handleCancel = (bookingId: string) => {
    toast.warning('Canceling session...');
    const route = `/goldencare/session/${bookingId}/cancel`;
    if (navigateHook) return navigateHook(route);
    navigateTo(route, 'GC_Cancel_Confirm');
  };

  const handleBrowseCategory = (categoryName: string) => {
    toast.info(`Exploring ${categoryName} mentors...`);
    const route = `/goldencare/categories/${encodeURIComponent(categoryName)}`;
    if (navigateHook) return navigateHook(route);
    navigateTo(route, 'GC_Main');
  };

  const handleApplyMentor = () => {
    toast.success('Opening mentor application form...');
    const route = `/goldencare/apply`;
    if (navigateHook) return navigateHook(route);
    navigateTo(route, 'GC_ApplyMentor_Form');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" data-figma-src={figmaDocUrl}>
      <div>
        <h1 className="text-gray-900 mb-2">🥇 GoldenCare Jobs</h1>
        <p className="text-gray-600">Connect with experienced retired mentors and professionals</p>
      </div>

      <Tabs defaultValue="search" className="space-y-6" data-figma-target="GC_Main">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="search">Find Mentors</TabsTrigger>
          <TabsTrigger value="bookings">My Sessions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Bar */}
          <Card className="p-4" data-figma-target="GC_Main_Search">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by skill, expertise, or industry..."
                  className="pl-10"
                  data-figma-target="GC_Search_Input"
                />
              </div>
              <Button
                onClick={() => {
                  toast.info('Searching for mentors...');
                  const route = `/goldencare/search`;
                  if (navigateHook) return navigateHook(route);
                  navigateTo(route, 'GC_Main');
                }}
                data-figma-target="GC_Search_Button"
              >
                Search
              </Button>
            </div>
          </Card>

          {/* Mentor Listings */}
          <div className="space-y-6" data-figma-target="GC_MentorList">
            {mentors.map((mentor) => (
              <Card
                key={mentor.id}
                className="p-6 hover:shadow-lg transition-shadow"
                data-figma-target={`GC_MentorCard_${mentor.id}`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 text-2xl">
                      {mentor.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-gray-900">{mentor.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            Age {mentor.age}
                          </Badge>
                        </div>
                        <p className="text-purple-600 mb-2">{mentor.expertise}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{mentor.rating}</span>
                            <span className="text-gray-400">({mentor.reviews} reviews)</span>
                          </div>
                          <span>•</span>
                          <span>{mentor.experience}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl text-purple-600">{mentor.rate}</p>
                        <Badge variant="secondary" className="mt-1">
                          {mentor.availability}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{mentor.bio}</p>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Skills & Expertise:</p>
                      <div className="flex flex-wrap gap-2">
                        {mentor.skills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-purple-50"
                            data-figma-target={`GC_SkillBadge_${mentor.id}_${idx}`}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleBookSession(mentor.id, mentor.name)}
                        data-figma-target={`GC_BookSession_CTA_${mentor.id}`}
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Book Session
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleMessage(mentor.id, mentor.name)}
                        data-figma-target={`GC_Message_CTA_${mentor.id}`}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleOpenProfile(mentor.id, mentor.name)}
                        data-figma-target={`GC_ViewProfile_CTA_${mentor.id}`}
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

        <TabsContent value="bookings" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">Upcoming Mentorship Sessions</h2>
            <Button
              variant="outline"
              onClick={() => {
                toast.info('Browsing available mentors...');
                const route = `/goldencare`;
                if (navigateHook) return navigateHook(route);
                navigateTo(route, 'GC_Main');
              }}
              data-figma-target="GC_BrowseMentors_Button"
            >
              Browse Mentors
            </Button>
          </div>

          {myBookings.map((booking, idx) => (
            <Card key={idx} className="p-6" data-figma-target={`GC_BookingCard_${booking.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {booking.mentor.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-gray-900 mb-1">{booking.mentor}</h3>
                    <p className="text-purple-600 mb-2">{booking.topic}</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{booking.date} at {booking.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Duration: {booking.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.type === 'video' ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <MessageCircle className="w-4 h-4" />
                        )}
                        <span className="capitalize">{booking.type} session</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                  {booking.status}
                </Badge>
              </div>

              <div className="flex gap-3">
                {booking.status === 'confirmed' && (
                  <Button
                    size="sm"
                    onClick={() => handleJoinSession(booking.id, booking.type, booking.mentor)}
                    data-figma-target={`GC_JoinSession_CTA_${booking.id}`}
                  >
                    {booking.type === 'video' ? (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Join Session
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Open Chat
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReschedule(booking.id)}
                  data-figma-target={`GC_Reschedule_CTA_${booking.id}`}
                >
                  Reschedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(booking.id)}
                  data-figma-target={`GC_Cancel_CTA_${booking.id}`}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div>
            <h2 className="text-gray-900 mb-4">Browse by Skill Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillCategories.map((category, idx) => (
                <Card
                  key={idx}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer hover:border-purple-300"
                  onClick={() => handleBrowseCategory(category.name)}
                  data-figma-target={`GC_CategoryCard_${idx}`}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">{category.icon}</div>
                    <h3 className="text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.count} mentors available</p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrowseCategory(category.name);
                      }}
                      data-figma-target={`GC_Category_Explore_${idx}`}
                    >
                      Explore
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50" data-figma-target="GC_BecomeMentorCard">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2">Become a Mentor</h3>
                <p className="text-gray-700 mb-4">
                  Share your lifetime of experience and earn income helping others.
                  Set your own schedule and rates.
                </p>
                <Button
                  onClick={handleApplyMentor}
                  data-figma-target="GC_ApplyMentor_CTA"
                >
                  Apply to be a Mentor
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}