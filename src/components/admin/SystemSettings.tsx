import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Settings,
  Bell,
  Database,
  Mail,
  MessageSquare,
  CreditCard,
  Lock,
  Globe,
  Zap,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export function SystemSettings() {
  const [featureFlags, setFeatureFlags] = useState({
    aiChatbot: true,
    videoConsultations: true,
    mealSubscriptions: true,
    franchiseBooking: false,
    mentorshipProgram: true,
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: true,
    pushNotifications: true,
    slackIntegration: false,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2D3D]">System Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure application settings and integrations
          </p>
        </div>
        <Button className="bg-gradient-to-r from-[#4A90E2] to-[#3569B0]">
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="features" className="space-y-6">
        <TabsList>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Feature Flags */}
        <TabsContent value="features">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-[#1F2D3D] mb-6">
              Feature Flags
            </h2>
            <div className="space-y-4">
              {[
                {
                  id: 'aiChatbot',
                  label: 'AI Health Assistant Chatbot',
                  description: 'Enable AI-powered health assistant for users',
                  enabled: featureFlags.aiChatbot,
                },
                {
                  id: 'videoConsultations',
                  label: 'Video Consultations',
                  description: 'Allow video consultations with healthcare providers',
                  enabled: featureFlags.videoConsultations,
                },
                {
                  id: 'mealSubscriptions',
                  label: 'Meal Subscriptions',
                  description: 'Enable subscription-based meal plans',
                  enabled: featureFlags.mealSubscriptions,
                },
                {
                  id: 'franchiseBooking',
                  label: 'Franchise Booking',
                  description: 'Allow users to book AgeWell facility tours online',
                  enabled: featureFlags.franchiseBooking,
                },
                {
                  id: 'mentorshipProgram',
                  label: 'Mentorship Program',
                  description: 'Enable GoldenCare mentorship features',
                  enabled: featureFlags.mentorshipProgram,
                },
              ].map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-[#1F2D3D]">{feature.label}</p>
                      {feature.enabled ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                  <Switch
                    checked={feature.enabled}
                    onCheckedChange={(checked) =>
                      setFeatureFlags({
                        ...featureFlags,
                        [feature.id]: checked,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-[#1F2D3D] mb-6">
              Notification Settings
            </h2>
            <div className="space-y-4">
              {[
                {
                  id: 'emailAlerts',
                  icon: Mail,
                  label: 'Email Alerts',
                  description: 'Send email notifications for critical events',
                  enabled: notifications.emailAlerts,
                },
                {
                  id: 'smsAlerts',
                  icon: MessageSquare,
                  label: 'SMS Alerts',
                  description: 'Send SMS notifications via configured gateway',
                  enabled: notifications.smsAlerts,
                },
                {
                  id: 'pushNotifications',
                  icon: Bell,
                  label: 'Push Notifications',
                  description: 'Send push notifications to mobile apps',
                  enabled: notifications.pushNotifications,
                },
                {
                  id: 'slackIntegration',
                  icon: MessageSquare,
                  label: 'Slack Integration',
                  description: 'Post alerts to configured Slack channels',
                  enabled: notifications.slackIntegration,
                },
              ].map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-[#4A90E2]/10">
                        <Icon className="h-5 w-5 text-[#4A90E2]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1F2D3D]">
                          {notification.label}
                        </p>
                        <p className="text-sm text-gray-600">
                          {notification.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notification.enabled}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          [notification.id]: checked,
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'SMS Gateway',
                icon: MessageSquare,
                status: 'connected',
                provider: 'Twilio',
                color: 'from-red-500 to-red-600',
              },
              {
                name: 'Email Service',
                icon: Mail,
                status: 'connected',
                provider: 'SendGrid',
                color: 'from-blue-500 to-blue-600',
              },
              {
                name: 'Payment Gateway',
                icon: CreditCard,
                status: 'connected',
                provider: 'bKash',
                color: 'from-pink-500 to-pink-600',
              },
              {
                name: 'Database',
                icon: Database,
                status: 'connected',
                provider: 'PostgreSQL',
                color: 'from-green-500 to-green-600',
              },
            ].map((integration, index) => {
              const Icon = integration.icon;
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-lg bg-gradient-to-br ${integration.color}`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1F2D3D]">
                          {integration.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {integration.provider}
                        </p>
                      </div>
                    </div>
                    {integration.status === 'connected' ? (
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" className="w-full">
                    Configure
                  </Button>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-[#1F2D3D] mb-6">
              Security Settings
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <Input type="number" defaultValue="30" className="max-w-xs" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Login Attempts
                </label>
                <Input type="number" defaultValue="5" className="max-w-xs" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Expiry (days)
                </label>
                <Input type="number" defaultValue="90" className="max-w-xs" />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-[#1F2D3D]">
                    Require 2FA for All Admins
                  </p>
                  <p className="text-sm text-gray-600">
                    Force all admin users to enable two-factor authentication
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-[#1F2D3D]">
                    Log All Admin Actions
                  </p>
                  <p className="text-sm text-gray-600">
                    Record all administrative actions in audit logs
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-[#1F2D3D]">
                    IP Whitelist Mode
                  </p>
                  <p className="text-sm text-gray-600">
                    Only allow admin access from whitelisted IP addresses
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
