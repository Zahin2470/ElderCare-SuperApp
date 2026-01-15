import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Search,
  Download,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCog,
  Shield,
  Database,
  Settings,
  FileText,
} from 'lucide-react';
import { motion } from 'motion/react';

interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  actionType: 'read' | 'write' | 'delete' | 'security' | 'system';
  subjectId?: string;
  subjectName?: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  // Mock audit log data
  const auditLogs: AuditLog[] = [
    {
      id: 'LOG_001',
      actorId: 'admin_001',
      actorName: 'System Administrator',
      actorRole: 'super_admin',
      action: 'Started impersonation',
      actionType: 'security',
      subjectId: 'U001',
      subjectName: 'Md. Mosarraf Hossain',
      timestamp: '2024-01-15 10:30:45',
      ip: '192.168.1.50',
      userAgent: 'Chrome 120.0.0.0 on Windows',
      metadata: { reason: 'Troubleshooting user-reported issue' },
      severity: 'high',
    },
    {
      id: 'LOG_002',
      actorId: 'admin_002',
      actorName: 'Security Admin',
      actorRole: 'security_admin',
      action: 'Suspended user account',
      actionType: 'write',
      subjectId: 'U005',
      subjectName: 'Kamal Ahmed',
      timestamp: '2024-01-15 09:15:20',
      ip: '192.168.1.51',
      userAgent: 'Chrome 120.0.0.0 on macOS',
      metadata: { reason: 'Suspicious activity detected' },
      severity: 'critical',
    },
    {
      id: 'LOG_003',
      actorId: 'admin_003',
      actorName: 'Operations Manager',
      actorRole: 'operations_admin',
      action: 'Bulk verified users',
      actionType: 'write',
      timestamp: '2024-01-15 08:45:10',
      ip: '192.168.1.52',
      userAgent: 'Firefox 121.0 on Windows',
      metadata: { userCount: 15 },
      severity: 'medium',
    },
    {
      id: 'LOG_004',
      actorId: 'admin_004',
      actorName: 'Dr. Clinical Admin',
      actorRole: 'clinical_admin',
      action: 'Accessed Care360 records',
      actionType: 'read',
      subjectId: 'U001',
      subjectName: 'Md. Mosarraf Hossain',
      timestamp: '2024-01-14 16:20:30',
      ip: '192.168.1.53',
      userAgent: 'Safari 17.2 on macOS',
      metadata: { recordType: 'medical_history' },
      severity: 'low',
    },
    {
      id: 'LOG_005',
      actorId: 'admin_001',
      actorName: 'System Administrator',
      actorRole: 'super_admin',
      action: 'Modified system settings',
      actionType: 'system',
      timestamp: '2024-01-14 14:10:15',
      ip: '192.168.1.50',
      userAgent: 'Chrome 120.0.0.0 on Windows',
      metadata: { setting: 'feature_flags', changes: ['enabled_ai_chatbot'] },
      severity: 'high',
    },
    {
      id: 'LOG_006',
      actorId: 'admin_002',
      actorName: 'Security Admin',
      actorRole: 'security_admin',
      action: 'Reviewed security alerts',
      actionType: 'read',
      timestamp: '2024-01-14 12:00:00',
      ip: '192.168.1.51',
      userAgent: 'Chrome 120.0.0.0 on macOS',
      severity: 'low',
    },
    {
      id: 'LOG_007',
      actorId: 'admin_003',
      actorName: 'Operations Manager',
      actorRole: 'operations_admin',
      action: 'Deleted user account',
      actionType: 'delete',
      subjectId: 'U999',
      subjectName: 'Test User',
      timestamp: '2024-01-13 18:30:25',
      ip: '192.168.1.52',
      userAgent: 'Firefox 121.0 on Windows',
      metadata: { reason: 'User requested account deletion' },
      severity: 'critical',
    },
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesAction && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    const config = {
      low: { label: 'Low', className: 'bg-gray-100 text-gray-700' },
      medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
      high: { label: 'High', className: 'bg-yellow-100 text-yellow-700' },
      critical: { label: 'Critical', className: 'bg-red-100 text-red-700' },
    };
    const { label, className } = config[severity as keyof typeof config];
    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    );
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'read':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'write':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'delete':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'security':
        return <Shield className="h-4 w-4 text-yellow-600" />;
      case 'system':
        return <Settings className="h-4 w-4 text-purple-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const config = {
      super_admin: 'bg-purple-100 text-purple-700',
      security_admin: 'bg-red-100 text-red-700',
      operations_admin: 'bg-blue-100 text-blue-700',
      clinical_admin: 'bg-green-100 text-green-700',
    };
    return (
      <Badge variant="outline" className={config[role as keyof typeof config]}>
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  const handleExport = () => {
    console.log('Exporting audit logs...');
    // In production, this would generate a CSV file
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2D3D]">Audit Logs</h1>
          <p className="text-gray-600 mt-1">
            {filteredLogs.length} logs in {dateRange}
          </p>
        </div>
        <Button className="bg-gradient-to-r from-[#4A90E2] to-[#3569B0]" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by actor, action, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Action Type Filter */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="write">Write</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

          {/* Severity Filter */}
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Audit Log List */}
      <Card>
        <div className="divide-y">
          {filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-2 rounded-lg bg-gray-100 flex-shrink-0">
                  {getActionIcon(log.actionType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Main Row */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-[#1F2D3D]">{log.action}</p>
                        {getSeverityBadge(log.severity)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <UserCog className="h-3 w-3" />
                          {log.actorName}
                        </span>
                        {getRoleBadge(log.actorRole)}
                        {log.subjectName && (
                          <span>→ Subject: <strong>{log.subjectName}</strong></span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 flex-shrink-0">
                      <p>{log.timestamp}</p>
                      <p className="text-xs">ID: {log.id}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>IP: {log.ip}</span>
                    <span>Device: {log.userAgent}</span>
                    {log.metadata && (
                      <span>
                        Metadata: {JSON.stringify(log.metadata).slice(0, 60)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Audit Log Retention Policy</p>
            <p className="text-sm text-blue-800 mt-1">
              Audit logs are retained for 2 years for compliance purposes. Critical security
              events are flagged for immediate review and archived permanently.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
