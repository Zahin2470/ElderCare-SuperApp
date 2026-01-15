import { useState } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { AdminAuthProvider } from './components/admin/AdminAuthContext';
import { NavigationProvider, useNavigation } from './components/navigation/NavigationContext';
import AuthFlow from './components/auth/AuthFlow';
import { AdminPortal } from './components/admin/AdminPortal';
import Dashboard from './components/Dashboard';
import ElderLink from './components/ElderLink';
import SilverBox from './components/SilverBox';
import AgeWellLiving from './components/AgeWellLiving';
import Care360 from './components/Care360';
import GoldenCareJobs from './components/GoldenCareJobs';
import NutriSenior from './components/NutriSenior';
import TeleHealth from './components/TeleHealth';
import CommunityActivities from './components/CommunityActivities';
import RewardsLoyalty from './components/RewardsLoyalty';
// import BrandShowcase from './components/brand/BrandShowcase';
// import InteractionMap from './components/navigation/InteractionMap';
// ElderLink Frames
import {
  EL01_SearchResults,
  EL02_Caregiver_Profile,
  EL03_ScheduleVisit,
  EL04_ChatSession,
  EL05_Booking_Confirmation,
} from './components/frames/ElderLinkFrames';
// NutriSenior Frames
import {
  NS01_MenuOverview,
  NS02_SelectPlan,
  NS03_PlaceOrder,
  NS04_TrackDelivery,
  NS05_Dietitian_Chat,
} from './components/frames/NutriSeniorFrames';
// SilverBox Frames
import {
  SB01_MedsOverview,
  SB02_MarkAsTaken,
  SB03_TakeNow,
  SB04_Med_History,
} from './components/frames/SilverBoxFrames';
// Care360 Frames
import {
  C360_RecordsList,
  C360_UploadRecord,
  C360_ViewRecord,
  C360_ShareWithDoctor,
  C360_RequestRefill,
  C360_ScheduleAppt,
} from './components/frames/Care360Frames';
// AgeWell Frames
import {
  AW01_CommunityChatRoom,
  AW02_EventDetail,
  AW03_VirtualTour,
  AW04_ApplyNow,
  AW05_ModifyApplication,
} from './components/frames/AgeWellFrames';
import { Home, Users, Pill, Building2, Heart, Briefcase, Utensils, Video, Calendar, Gift, Menu, LogOut, Map, Palette, ShieldCheck } from 'lucide-react';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import { Toaster } from './components/ui/sonner';
import { LogoCompact } from './components/brand/LogoImage';

function MainApp() {
  const { user, logout } = useAuth();
  const { currentNavigation, navigateToFrame } = useNavigation();
  const [userRole, setUserRole] = useState<'senior' | 'family'>('senior');
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  // Show admin portal if requested
  if (showAdminPortal) {
    return <AdminPortal />;
  }

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, emoji: '🏠' },
    // { id: 'interactionmap', name: 'Interaction Map', icon: Map, emoji: '🗺️' },
    { id: 'elderlink', name: 'ElderLink', icon: Users, emoji: '💛' },
    { id: 'silverbox', name: 'SilverBox', icon: Pill, emoji: '💊' },
    { id: 'agewell', name: 'AgeWell Living', icon: Building2, emoji: '🏡' },
    { id: 'care360', name: 'Care360', icon: Heart, emoji: '👨‍⚕️' },
    { id: 'goldencares', name: 'GoldenCare Jobs', icon: Briefcase, emoji: '🥇' },
    { id: 'nutrisenior', name: 'NutriSenior', icon: Utensils, emoji: '🍱' },
    { id: 'telehealth', name: 'TeleHealth', icon: Video, emoji: '📺' },
    { id: 'communityactivities', name: 'Community Activities', icon: Calendar, emoji: '📅' },
    { id: 'rewardsloyalty', name: 'Rewards & Loyalty', icon: Gift, emoji: '🎁' },
    // { id: 'brandshowcase', name: 'Brand System', icon: Palette, emoji: '🎨' },
  ];

  // Render frame based on navigation state
  const renderFrame = () => {
    const { module, frame } = currentNavigation;

    // ElderLink Frames
    if (module === 'elderlink') {
      switch (frame) {
        case 'EL01_SearchResults':
          return <EL01_SearchResults />;
        case 'EL02_Caregiver_Profile':
          return <EL02_Caregiver_Profile />;
        case 'EL03_ScheduleVisit':
          return <EL03_ScheduleVisit />;
        case 'EL04_ChatSession':
          return <EL04_ChatSession />;
        case 'EL05_Booking_Confirmation':
          return <EL05_Booking_Confirmation />;
        default:
          return <ElderLink />;
      }
    }

    // NutriSenior Frames
    if (module === 'nutrisenior') {
      switch (frame) {
        case 'NS01_MenuOverview':
          return <NS01_MenuOverview />;
        case 'NS02_SelectPlan':
          return <NS02_SelectPlan />;
        case 'NS03_PlaceOrder':
          return <NS03_PlaceOrder />;
        case 'NS04_TrackDelivery':
          return <NS04_TrackDelivery />;
        case 'NS05_Dietitian_Chat':
          return <NS05_Dietitian_Chat />;
        default:
          return <NutriSenior />;
      }
    }

    // SilverBox Frames
    if (module === 'silverbox') {
      switch (frame) {
        case 'SB01_MedsOverview':
          return <SB01_MedsOverview />;
        case 'SB02_MarkAsTaken':
          return <SB02_MarkAsTaken />;
        case 'SB03_TakeNow':
          return <SB03_TakeNow />;
        case 'SB04_Med_History':
          return <SB04_Med_History />;
        default:
          return <SilverBox userRole={userRole} />;
      }
    }

    // Care360 Frames
    if (module === 'care360') {
      switch (frame) {
        case 'C360_RecordsList':
          return <C360_RecordsList />;
        case 'C360_UploadRecord':
          return <C360_UploadRecord />;
        case 'C360_ViewRecord':
          return <C360_ViewRecord />;
        case 'C360_ShareWithDoctor':
          return <C360_ShareWithDoctor />;
        case 'C360_RequestRefill':
          return <C360_RequestRefill />;
        case 'C360_ScheduleAppt':
          return <C360_ScheduleAppt />;
        default:
          return <Care360 userRole={userRole} />;
      }
    }

    // AgeWell Frames
    if (module === 'agewell') {
      switch (frame) {
        case 'AW01_CommunityChatRoom':
          return <AW01_CommunityChatRoom />;
        case 'AW02_EventDetail':
          return <AW02_EventDetail />;
        case 'AW03_VirtualTour':
          return <AW03_VirtualTour />;
        case 'AW04_ApplyNow':
          return <AW04_ApplyNow />;
        case 'AW05_ModifyApplication':
          return <AW05_ModifyApplication />;
        default:
          return <AgeWellLiving />;
      }
    }

    // Module routing (no deep frame)
    switch (module) {
      case 'dashboard':
        return <Dashboard userRole={userRole} />;
      case 'interactionmap':
        return <InteractionMap />;
      case 'elderlink':
        return <ElderLink />;
      case 'silverbox':
        return <SilverBox userRole={userRole} />;
      case 'agewell':
        return <AgeWellLiving />;
      case 'care360':
        return <Care360 userRole={userRole} />;
      case 'goldencares':
        return <GoldenCareJobs />;
      case 'nutrisenior':
        return <NutriSenior />;
      case 'telehealth':
        return <TeleHealth />;
      case 'communityactivities':
        return <CommunityActivities />;
      case 'rewardsloyalty':
        return <RewardsLoyalty />;
      case 'brandshowcase':
        return <BrandShowcase />;
      default:
        return <Dashboard userRole={userRole} />;
    }
  };

  const Sidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'p-4' : 'p-6'} h-full flex flex-col bg-gradient-to-b from-purple-50 to-blue-50`}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => navigateToFrame('dashboard', null)}>
          <LogoCompact size="md" onClick={() => navigateToFrame('dashboard', null)} />
          <div>
            <h1 className="text-[#4A90E2] leading-tight">ElderCare</h1>
            <p className="text-xs text-gray-600">Care. Connect. Comfort.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={userRole === 'senior' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUserRole('senior')}
            className="flex-1"
          >
            Senior
          </Button>
          <Button
            variant={userRole === 'family' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUserRole('family')}
            className="flex-1"
          >
            Family
          </Button>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = currentNavigation.module === module.id;
          return (
            <button
              key={module.id}
              onClick={() => navigateToFrame(module.id, null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white hover:bg-purple-100 text-gray-700'
              }`}
            >
              <span className="text-xl">{module.emoji}</span>
              <span className="flex-1 text-left">{module.name}</span>
              {isActive && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 space-y-3">
        <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Logged in as</p>
          <p className="font-medium text-purple-700">
            {user?.fullName || 'User'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdminPortal(true)}
          className="w-full text-[#4A90E2] hover:text-[#3569B0] hover:bg-blue-50"
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          Admin Portal
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-80 border-r bg-white shadow-lg">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoCompact size="sm" onClick={() => navigateToFrame('dashboard', null)} />
            <div>
              <h2 className="text-[#4A90E2] leading-tight">ElderCare</h2>
              <p className="text-xs text-gray-600">
                {modules.find(m => m.id === currentNavigation.module)?.name}
              </p>
            </div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80" aria-describedby={undefined}>
              <div className="sr-only">
                <h2>Navigation Menu</h2>
              </div>
              <Sidebar isMobile />
            </SheetContent>
          </Sheet>
        </div>

        <div className="p-4 md:p-8">
          {renderFrame()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <NavigationProvider>
          <AppContent />
          <Toaster />
        </NavigationProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthFlow />;
  }

  return <MainApp />;
}