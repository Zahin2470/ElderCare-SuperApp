import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowRight, Home, Users, Pill, Building2, Heart, Utensils } from 'lucide-react';
import { useNavigation } from './NavigationContext';

export default function InteractionMap() {
  const { navigateToFrame, navigateBack } = useNavigation();

  const moduleMap = [
    {
      name: 'Dashboard',
      icon: Home,
      emoji: '🏠',
      color: 'purple',
      quickActions: [
        { label: 'Book Caregiver', target: 'ElderLink → EL01_SearchResults' },
        { label: 'Order Meal', target: 'NutriSenior → NS01_MenuOverview' },
        { label: 'View Meds', target: 'SilverBox → SB01_MedsOverview' },
        { label: 'Check Records', target: 'Care360 → C360_RecordsList' },
      ],
    },
    {
      name: 'ElderLink',
      icon: Users,
      emoji: '💛',
      color: 'yellow',
      frames: [
        'EL01_SearchResults (list of caregivers)',
        'EL02_Caregiver_Profile (full profile with reviews)',
        'EL03_ScheduleVisit (choose date/time, services)',
        'EL04_ChatSession (in-app chat with message history)',
        'EL05_Booking_Confirmation',
      ],
    },
    {
      name: 'NutriSenior',
      icon: Utensils,
      emoji: '🍱',
      color: 'orange',
      frames: [
        'NS01_MenuOverview (full menu)',
        'NS02_SelectPlan (plans & subscription)',
        'NS03_PlaceOrder (cart + payment)',
        'NS04_TrackDelivery (live tracker with ETA)',
        'NS05_Dietitian_Chat',
      ],
    },
    {
      name: 'SilverBox',
      icon: Pill,
      emoji: '💊',
      color: 'blue',
      frames: [
        'SB01_MedsOverview (daily schedule)',
        'SB02_MarkAsTaken (confirm flow + log)',
        'SB03_TakeNow (start immediate reminder + camera/photo proof optional)',
        'SB04_Med_History (filterable list)',
      ],
    },
    {
      name: 'Care360',
      icon: Heart,
      emoji: '👨‍⚕️',
      color: 'red',
      frames: [
        'C360_RecordsList (filterable list)',
        'C360_UploadRecord (upload modal for PDFs/images)',
        'C360_ViewRecord (viewer + download)',
        'C360_ShareWithDoctor (consent modal + share)',
        'C360_RequestRefill (refill request flow)',
        'C360_ScheduleAppt (book appointment, reschedule/cancel)',
      ],
    },
    {
      name: 'AgeWell Living',
      icon: Building2,
      emoji: '🏡',
      color: 'green',
      frames: [
        'AW01_CommunityChatRoom (group chat + moderation tools)',
        'AW02_EventDetail (join event + RSVP)',
        'AW03_VirtualTour (gallery + video)',
        'AW04_ApplyNow (application form)',
        'AW05_ModifyApplication (edit + save)',
      ],
    },
  ];

  const getColorClass = (color: string) => {
    const colors: { [key: string]: { bg: string; border: string; text: string } } = {
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    };
    return colors[color] || colors.purple;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">🗺️ Interaction Map</h1>
          <p className="text-gray-600">
            Complete navigation flow showing all Dashboard Quick Actions → Module Frame mappings
          </p>
        </div>
        <Button onClick={navigateBack} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      {/* Legend */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex items-start gap-3">
          <div className="text-4xl">📋</div>
          <div className="flex-1">
            <h3 className="text-gray-900 mb-2">How to Use This Map</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Dashboard Quick Actions</strong> connect directly to specific module frames</li>
              <li>• Each module has <strong>multiple inner frames</strong> for complete CRUD operations</li>
              <li>• Click any frame name to navigate there directly (when implemented)</li>
              <li>• <strong>Smart Animate</strong> transitions between frames for smooth UX</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Module Map Grid */}
      <div className="space-y-6">
        {moduleMap.map((module, idx) => {
          const Icon = module.icon;
          const colorClasses = getColorClass(module.color);

          return (
            <Card
              key={idx}
              className={`p-6 border-2 ${colorClasses.border} ${colorClasses.bg}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">{module.emoji}</div>
                <div className="flex-1">
                  <h2 className={`text-gray-900 mb-1 flex items-center gap-2`}>
                    {module.name}
                    <Badge variant="outline" className="ml-2">
                      {module.frames?.length || module.quickActions?.length || 0} frames
                    </Badge>
                  </h2>
                  {module.quickActions && (
                    <div className="space-y-2 mt-3">
                      <p className="text-sm text-gray-600">Dashboard Quick Actions:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {module.quickActions.map((action, actionIdx) => (
                          <div
                            key={actionIdx}
                            className="flex items-center gap-2 p-2 bg-white rounded-lg border"
                          >
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              <strong>{action.label}</strong> → {action.target}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {module.frames && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">Inner Frames:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {module.frames.map((frame, frameIdx) => (
                      <div
                        key={frameIdx}
                        className="p-3 bg-white rounded-lg border hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <code className="text-xs text-gray-700">{frame}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Technical Specs */}
      <Card className="p-6 bg-gray-50 border-2">
        <h3 className="text-gray-900 mb-4">📐 Technical Specifications</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="text-gray-900 mb-2">Desktop (Primary)</h4>
            <ul className="text-gray-700 space-y-1">
              <li>• Viewport: 1440×1024px</li>
              <li>• Full CRUD operations in frames</li>
              <li>• Smart Animate transitions</li>
              <li>• Modal confirmations</li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 mb-2">Mobile (Consumer)</h4>
            <ul className="text-gray-700 space-y-1">
              <li>• Viewport: 390×844px</li>
              <li>• Touch-optimized flows</li>
              <li>• Bottom sheets for actions</li>
              <li>• Swipe gestures</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
