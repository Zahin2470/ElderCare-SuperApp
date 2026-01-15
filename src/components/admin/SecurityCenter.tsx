import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertTriangle,
  Shield,
  Activity,
  Lock,
  Unlock,
  Ban,
  CheckCircle,
  XCircle,
  Globe,
  Monitor,
  Smartphone,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SecurityAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  message: string;
  timestamp: string;
  source: string;
  status: 'active' | 'investigating' | 'resolved';
}

interface SuspiciousActivity {
  id: string;
  userId: string;
  userName: string;
  activity: string;
  timestamp: string;
  ip: string;
  location: string;
  riskScore: number;
}

interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  device: string;
  ip: string;
  location: string;
  startedAt: string;
  lastActivity: string;
}

export function SecurityCenter() {
  const [selectedTab, setSelectedTab] = useState('alerts');

  // Mock data
  const securityAlerts: SecurityAlert[] = [
    {
      id: 'SA_001',
      severity: 'critical',
      type: 'Multiple Failed Logins',
      message: 'User account U005 has 15 failed login attempts in the last 10 minutes',
      timestamp: '2024-01-15 10:45:30',
      source: 'Auth Service',
      status: 'active',
    },
    {
      id: 'SA_002',
      severity: 'high',
      type: 'Unusual Access Pattern',
      message: 'Admin user accessed 50+ user records in 5 minutes',
      timestamp: '2024-01-15 09:30:15',
      source: 'Access Monitor',
      status: 'investigating',
    },
    {
      id: 'SA_003',
      severity: 'medium',
      type: 'New Device Login',
      message: 'User logged in from unrecognized device',
      timestamp: '2024-01-15 08:20:10',
      source: 'Device Tracking',
      status: 'resolved',
    },
  ];

  const suspiciousActivities: SuspiciousActivity[] = [
    {
      id: 'SU_001',
      userId: 'U005',
      userName: 'Kamal Ahmed',
      activity: 'Attempted access to restricted API endpoints',
      timestamp: '2024-01-15 11:00:00',
      ip: '203.82.45.100',
      location: 'Unknown Location',
      riskScore: 85,
    },
    {
      id: 'SU_002',
      userId: 'U123',
      userName: 'Anonymous User',
      activity: 'Rapid data scraping detected',
      timestamp: '2024-01-15 10:30:00',
      ip: '198.51.100.42',
      location: 'Foreign IP',
      riskScore: 92,
    },
  ];

  const activeSessions: ActiveSession[] = [
    {
      id: 'SESSION_001',
      userId: 'admin_001',
      userName: 'System Administrator',
      userRole: 'super_admin',
      device: 'Chrome on Windows',
      ip: '192.168.1.50',
      location: 'Dhaka, Bangladesh',
      startedAt: '2024-01-15 08:00:00',
      lastActivity: '2 min ago',
    },
    {
      id: 'SESSION_002',
      userId: 'admin_002',
      userName: 'Security Admin',
      userRole: 'security_admin',
      device: 'Safari on macOS',
      ip: '192.168.1.51',
      location: 'Dhaka, Bangladesh',
      startedAt: '2024-01-15 09:15:00',
      lastActivity: '5 min ago',
    },
  ];

  const threatTrendData = [
    { date: 'Jan 8', threats: 12, blocked: 10 },
    { date: 'Jan 9', threats: 18, blocked: 15 },
    { date: 'Jan 10', threats: 15, blocked: 14 },
    { date: 'Jan 11', threats: 25, blocked: 22 },
    { date: 'Jan 12', threats: 20, blocked: 18 },
    { date: 'Jan 13', threats: 16, blocked: 15 },
    { date: 'Jan 14', threats: 22, blocked: 20 },
  ];

  const getSeverityConfig = (severity: string) => {
    const configs = {
      critical: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-100',
        badgeClass: 'bg-red-100 text-red-700',
      },
      high: {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        badgeClass: 'bg-orange-100 text-orange-700',
      },
      medium: {
        icon: AlertCircle,
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        badgeClass: 'bg-yellow-100 text-yellow-700',
      },
      low: {
        icon: CheckCircle,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        badgeClass: 'bg-blue-100 text-blue-700',
      },
    };
    return configs[severity as keyof typeof configs];
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: 'bg-red-100 text-red-700',
      investigating: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
    };
    return (
      <Badge variant="outline" className={configs[status as keyof typeof configs]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2D3D]">Security Center</h1>
          <p className="text-gray-600 mt-1">
            Monitor and respond to security events
          </p>
        </div>
        <Badge variant="outline" className="bg-green-100 text-green-700 px-4 py-2">
          <Shield className="h-4 w-4 mr-2" />
          System Secure
        </Badge>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Alerts</h3>
          <p className="text-3xl font-bold text-[#1F2D3D]">3</p>
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +2 from yesterday
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Suspicious Activities</h3>
          <p className="text-3xl font-bold text-[#1F2D3D]">8</p>
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            -3 from yesterday
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Threats Blocked</h3>
          <p className="text-3xl font-bold text-[#1F2D3D]">142</p>
          <p className="text-sm text-gray-600 mt-2">Last 7 days</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Sessions</h3>
          <p className="text-3xl font-bold text-[#1F2D3D]">{activeSessions.length}</p>
          <p className="text-sm text-gray-600 mt-2">Admin sessions</p>
        </Card>
      </div>

      {/* Threat Trends Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-[#1F2D3D] mb-6">
          Threat Detection Trends (Last 7 Days)
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={threatTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="threats"
              stroke="#EF4444"
              strokeWidth={2}
              name="Threats Detected"
            />
            <Line
              type="monotone"
              dataKey="blocked"
              stroke="#10B981"
              strokeWidth={2}
              name="Threats Blocked"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="suspicious">Suspicious Activity</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
        </TabsList>

        {/* Security Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <div className="divide-y">
              {securityAlerts.map((alert) => {
                const config = getSeverityConfig(alert.severity);
                const Icon = config.icon;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-6 hover:bg-gray-50 transition-colors ${config.bg}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg bg-white`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-[#1F2D3D]">
                                {alert.type}
                              </h3>
                              <Badge variant="outline" className={config.badgeClass}>
                                {alert.severity}
                              </Badge>
                              {getStatusBadge(alert.status)}
                            </div>
                            <p className="text-gray-700 mb-2">{alert.message}</p>
                            <p className="text-sm text-gray-600">
                              Source: {alert.source} • {alert.timestamp}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Investigate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Suspicious Activity Tab */}
        <TabsContent value="suspicious">
          <Card>
            <div className="divide-y">
              {suspiciousActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-[#1F2D3D]">
                          {activity.userName}
                        </h3>
                        <Badge variant="outline" className="bg-red-100 text-red-700">
                          Risk Score: {activity.riskScore}%
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{activity.activity}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          IP: {activity.ip}
                        </span>
                        <span>{activity.location}</span>
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Ban className="h-4 w-4 mr-2" />
                        Block
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <div className="divide-y">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-[#1F2D3D]">
                          {session.userName}
                        </h3>
                        <Badge variant="outline" className="bg-purple-100 text-purple-700">
                          {session.userRole.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          <Activity className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          {session.device}
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {session.ip}
                        </div>
                        <div>Started: {session.startedAt}</div>
                        <div>Last activity: {session.lastActivity}</div>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Ban className="h-4 w-4 mr-2" />
                      Terminate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
