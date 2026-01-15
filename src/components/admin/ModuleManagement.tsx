import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Users,
  Package,
  Pill,
  FileText,
  Building2,
  Briefcase,
  ShieldCheck,
  Wallet,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ModuleManagementProps {
  module: string;
}

export function ModuleManagement({ module }: ModuleManagementProps) {
  // Module configurations
  const moduleConfigs = {
    franchise: {
      title: 'Franchise Management (AgeWell Living)',
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
      stats: [
        { label: 'Total Facilities', value: '12', change: '+2', trend: 'up' },
        { label: 'Total Residents', value: '340', change: '+15', trend: 'up' },
        { label: 'Occupancy Rate', value: '87%', change: '+3%', trend: 'up' },
        { label: 'Staff Members', value: '156', change: '+8', trend: 'up' },
      ],
    },
    partners: {
      title: 'Partner Management',
      icon: Briefcase,
      color: 'from-orange-500 to-orange-600',
      stats: [
        { label: 'Active Partners', value: '28', change: '+4', trend: 'up' },
        { label: 'NutriSenior Kitchens', value: '8', change: '+1', trend: 'up' },
        { label: 'Caregiver Agencies', value: '12', change: '+2', trend: 'up' },
        { label: 'Healthcare Providers', value: '8', change: '+1', trend: 'up' },
      ],
    },
    reports: {
      title: 'Reports & Analytics',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      stats: [
        { label: 'Total Revenue', value: '$125K', change: '+18%', trend: 'up' },
        { label: 'Active Users', value: '1,453', change: '+12%', trend: 'up' },
        { label: 'Retention Rate', value: '92%', change: '+5%', trend: 'up' },
        { label: 'Avg. LTV', value: '$2,450', change: '+8%', trend: 'up' },
      ],
    },
    content: {
      title: 'Content Management',
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      stats: [
        { label: 'Push Notifications', value: '156', change: '+23', trend: 'up' },
        { label: 'Announcements', value: '42', change: '+8', trend: 'up' },
        { label: 'App Banners', value: '12', change: '+3', trend: 'up' },
        { label: 'Email Campaigns', value: '28', change: '+5', trend: 'up' },
      ],
    },
  };

  const config = moduleConfigs[module as keyof typeof moduleConfigs] || moduleConfigs.reports;
  const Icon = config.icon;

  // Module usage data
  const moduleUsageData = [
    { name: 'ElderLink', bookings: 245, revenue: 12500 },
    { name: 'NutriSenior', orders: 380, revenue: 19000 },
    { name: 'SilverBox', users: 520, revenue: 15600 },
    { name: 'Care360', uploads: 890, revenue: 8900 },
    { name: 'AgeWell', residents: 340, revenue: 34000 },
    { name: 'GoldenCare', sessions: 156, revenue: 7800 },
  ];

  const trendData = [
    { date: 'Jan 8', value: 450 },
    { date: 'Jan 9', value: 480 },
    { date: 'Jan 10', value: 520 },
    { date: 'Jan 11', value: 550 },
    { date: 'Jan 12', value: 590 },
    { date: 'Jan 13', value: 620 },
    { date: 'Jan 14', value: 680 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${config.color}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1F2D3D]">{config.title}</h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage {module} operations
            </p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-[#4A90E2] to-[#3569B0]">
          View Full Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {config.stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.label}</h3>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-[#1F2D3D]">{stat.value}</p>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <Activity className="h-4 w-4" />
                <span>{stat.change}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Performance */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[#1F2D3D] mb-6">
            Module Performance
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moduleUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#4A90E2" name="Activity" />
              <Bar dataKey="revenue" fill="#32CD99" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Trend Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[#1F2D3D] mb-6">
            Growth Trend (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4A90E2"
                strokeWidth={2}
                name="Activity"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Module-Specific Content */}
      {module === 'franchise' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[#1F2D3D] mb-4">
            Facilities Overview
          </h2>
          <div className="space-y-4">
            {[
              { name: 'AgeWell Dhanmondi', occupancy: 92, residents: 46, staff: 18 },
              { name: 'AgeWell Gulshan', occupancy: 88, residents: 35, staff: 14 },
              { name: 'AgeWell Banani', occupancy: 85, residents: 42, staff: 16 },
            ].map((facility, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-[#1F2D3D]">{facility.name}</p>
                  <p className="text-sm text-gray-600">
                    {facility.residents} residents • {facility.staff} staff
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Occupancy</p>
                    <p className="font-semibold text-[#4A90E2]">{facility.occupancy}%</p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {module === 'partners' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[#1F2D3D] mb-4">
            Active Partners
          </h2>
          <div className="space-y-4">
            {[
              { name: 'NutriSenior Kitchen - Dhanmondi', type: 'Meal Service', status: 'active', orders: 1250 },
              { name: 'Caring Hands Agency', type: 'Caregiver Provider', status: 'active', bookings: 458 },
              { name: 'United Hospital', type: 'Healthcare Partner', status: 'active', referrals: 89 },
            ].map((partner, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-[#1F2D3D]">{partner.name}</p>
                  <p className="text-sm text-gray-600">{partner.type}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    {partner.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {module === 'content' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[#1F2D3D] mb-4">
            Recent Notifications
          </h2>
          <div className="space-y-4">
            {[
              { title: 'New Feature: AI Health Assistant', sent: '2 hours ago', reached: 1250 },
              { title: 'AgeWell Open House Event', sent: '1 day ago', reached: 890 },
              { title: 'NutriSenior Menu Update', sent: '2 days ago', reached: 1420 },
            ].map((notification, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-[#1F2D3D]">{notification.title}</p>
                  <p className="text-sm text-gray-600">
                    Sent {notification.sent} • Reached {notification.reached} users
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View Stats
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
