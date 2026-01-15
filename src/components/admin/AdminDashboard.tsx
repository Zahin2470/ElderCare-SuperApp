import { useState } from 'react';
import { useAdminAuth, hasPermission } from './AdminAuthContext';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Database,
  Server,
  Zap,
  ArrowUpRight,
  Eye,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
  color: string;
}

function KPICard({ title, value, change, icon, trend, color }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
            {icon}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-[#1F2D3D]">{value}</p>
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface SystemHealthProps {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  lastCheck: string;
}

function SystemHealthCard({ name, status, uptime, lastCheck }: SystemHealthProps) {
  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-100', label: 'Healthy' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Warning' },
    critical: { color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${config.bg} ${config.color}`}>
          <div className="w-full h-full rounded-full animate-pulse" />
        </div>
        <div>
          <p className="font-medium text-[#1F2D3D]">{name}</p>
          <p className="text-xs text-gray-500">
            Uptime: {uptime} • Last check: {lastCheck}
          </p>
        </div>
      </div>
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    </div>
  );
}

interface AlertItemProps {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
  module: string;
}

function AlertItem({ severity, message, time, module }: AlertItemProps) {
  const severityConfig = {
    critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    info: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={`flex gap-3 p-4 rounded-lg ${config.bg}`}>
      <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-medium text-sm text-[#1F2D3D]">{message}</p>
          <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
        </div>
        <p className="text-xs text-gray-600">Module: {module}</p>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { adminUser } = useAdminAuth();
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data for charts
  const userGrowthData = [
    { date: 'Jan 8', seniors: 450, family: 320, caregivers: 180 },
    { date: 'Jan 9', seniors: 480, family: 350, caregivers: 195 },
    { date: 'Jan 10', seniors: 520, family: 380, caregivers: 210 },
    { date: 'Jan 11', seniors: 550, family: 400, caregivers: 225 },
    { date: 'Jan 12', seniors: 590, family: 430, caregivers: 240 },
    { date: 'Jan 13', seniors: 620, family: 460, caregivers: 255 },
    { date: 'Jan 14', seniors: 680, family: 495, caregivers: 278 },
  ];

  const moduleUsageData = [
    { name: 'ElderLink', value: 35, color: '#4A90E2' },
    { name: 'NutriSenior', value: 25, color: '#32CD99' },
    { name: 'Care360', value: 20, color: '#FFA726' },
    { name: 'SilverBox', value: 12, color: '#9B59B6' },
    { name: 'AgeWell', value: 8, color: '#E74C3C' },
  ];

  const systemHealthData = [
    { name: 'API Server', status: 'healthy' as const, uptime: '99.98%', lastCheck: '30s ago' },
    { name: 'Database Primary', status: 'healthy' as const, uptime: '99.99%', lastCheck: '1m ago' },
    { name: 'Cache Layer', status: 'warning' as const, uptime: '98.5%', lastCheck: '45s ago' },
    { name: 'SMS Gateway', status: 'healthy' as const, uptime: '99.95%', lastCheck: '2m ago' },
    { name: 'Payment Service', status: 'healthy' as const, uptime: '99.97%', lastCheck: '1m ago' },
  ];

  const recentAlerts = [
    {
      severity: 'critical' as const,
      message: 'High memory usage detected on DB server',
      time: '5m ago',
      module: 'Infrastructure',
    },
    {
      severity: 'warning' as const,
      message: 'Unusual login attempts from IP 192.168.1.100',
      time: '12m ago',
      module: 'Security',
    },
    {
      severity: 'info' as const,
      message: 'Scheduled maintenance completed successfully',
      time: '1h ago',
      module: 'System',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2D3D] mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {adminUser?.fullName}
            <Badge variant="outline" className="ml-3">
              {adminUser?.role.replace('_', ' ').toUpperCase()}
            </Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('24h')}
            className={timeRange === '24h' ? 'bg-[#4A90E2]' : ''}
          >
            24h
          </Button>
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
            className={timeRange === '7d' ? 'bg-[#4A90E2]' : ''}
          >
            7d
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
            className={timeRange === '30d' ? 'bg-[#4A90E2]' : ''}
          >
            30d
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Users"
          value="1,453"
          change={12.5}
          trend="up"
          icon={<Users className="h-6 w-6 text-white" />}
          color="from-blue-500 to-blue-600"
        />
        <KPICard
          title="Active Sessions"
          value="892"
          change={8.3}
          trend="up"
          icon={<Activity className="h-6 w-6 text-white" />}
          color="from-green-500 to-green-600"
        />
        <KPICard
          title="Security Alerts"
          value="23"
          change={-15.2}
          trend="down"
          icon={<Shield className="h-6 w-6 text-white" />}
          color="from-yellow-500 to-yellow-600"
        />
        <KPICard
          title="System Uptime"
          value="99.98%"
          change={0.05}
          trend="up"
          icon={<Server className="h-6 w-6 text-white" />}
          color="from-purple-500 to-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1F2D3D]">User Growth</h2>
            <Button variant="ghost" size="sm">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="seniors"
                stroke="#4A90E2"
                strokeWidth={2}
                name="Seniors"
              />
              <Line
                type="monotone"
                dataKey="family"
                stroke="#32CD99"
                strokeWidth={2}
                name="Family Members"
              />
              <Line
                type="monotone"
                dataKey="caregivers"
                stroke="#FFA726"
                strokeWidth={2}
                name="Caregivers"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Module Usage */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[#1F2D3D] mb-6">Module Usage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={moduleUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {moduleUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1F2D3D]">System Health</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Zap className="h-4 w-4" />
              <span>Auto-refresh: 30s</span>
            </div>
          </div>
          <div className="space-y-3">
            {systemHealthData.map((system, index) => (
              <SystemHealthCard key={index} {...system} />
            ))}
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1F2D3D]">Recent Alerts</h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (
              <AlertItem key={index} {...alert} />
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions - Role-specific */}
      {hasPermission(adminUser, 'users.write') && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[#1F2D3D] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto py-4">
              <Users className="h-5 w-5 mr-3 text-[#4A90E2]" />
              <div className="text-left">
                <p className="font-medium">Manage Users</p>
                <p className="text-xs text-gray-500">View and edit user accounts</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <Shield className="h-5 w-5 mr-3 text-[#32CD99]" />
              <div className="text-left">
                <p className="font-medium">Security Center</p>
                <p className="text-xs text-gray-500">Monitor security events</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <Database className="h-5 w-5 mr-3 text-[#FFA726]" />
              <div className="text-left">
                <p className="font-medium">Audit Logs</p>
                <p className="text-xs text-gray-500">Review system activities</p>
              </div>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
