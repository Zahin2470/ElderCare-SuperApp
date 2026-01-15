import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Ban,
  UserCog,
  Eye,
  FileText,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';

interface UserDetailProps {
  userId: string;
  onBack: () => void;
}

export function UserDetail({ userId, onBack }: UserDetailProps) {
  const [impersonateDialog, setImpersonateDialog] = useState(false);
  const [impersonateReason, setImpersonateReason] = useState('');
  const [twoFACode, setTwoFACode] = useState('');

  // Mock user data
  const user = {
    id: userId,
    name: 'Md. Mosarraf Hossain',
    email: 'mosarraf@example.com',
    phone: '+880 1711-123456',
    role: 'senior',
    status: 'active',
    verified: true,
    joinedDate: 'Jan 1, 2024',
    lastActive: '5 min ago',
    address: 'Dhaka, Bangladesh',
    emergencyContact: '+880 1711-234567',
    medicalConditions: ['Diabetes', 'Hypertension'],
  };

  const activityLog = [
    {
      id: 1,
      action: 'Logged in',
      timestamp: '2024-01-15 10:30 AM',
      ip: '192.168.1.100',
      device: 'Chrome on Windows',
    },
    {
      id: 2,
      action: 'Updated profile',
      timestamp: '2024-01-15 09:45 AM',
      ip: '192.168.1.100',
      device: 'Chrome on Windows',
    },
    {
      id: 3,
      action: 'Booked caregiver',
      timestamp: '2024-01-14 03:20 PM',
      ip: '192.168.1.100',
      device: 'Mobile App (Android)',
    },
    {
      id: 4,
      action: 'Ordered meal',
      timestamp: '2024-01-14 12:15 PM',
      ip: '192.168.1.100',
      device: 'Mobile App (Android)',
    },
  ];

  const documents = [
    {
      id: 1,
      name: 'National ID Card',
      status: 'verified',
      uploadedDate: 'Jan 1, 2024',
      verifiedBy: 'Admin',
    },
    {
      id: 2,
      name: 'Medical Certificate',
      status: 'verified',
      uploadedDate: 'Jan 1, 2024',
      verifiedBy: 'Clinical Admin',
    },
  ];

  const handleImpersonate = () => {
    if (impersonateReason.trim() && twoFACode.length === 6) {
      console.log('[AUDIT] Impersonation initiated:', {
        targetUserId: userId,
        reason: impersonateReason,
        timestamp: new Date().toISOString(),
      });
      setImpersonateDialog(false);
      // Navigate to user view
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#1F2D3D]">User Details</h1>
          <p className="text-gray-600 mt-1">View and manage user information</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImpersonateDialog(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Impersonate
          </Button>
          <Button variant="outline">
            <UserCog className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* User Profile Card */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-gradient-to-br from-[#4A90E2] to-[#3569B0] text-white text-2xl">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-[#1F2D3D]">{user.name}</h2>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                {user.role}
              </Badge>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                {user.status}
              </Badge>
              {user.verified && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                {user.phone}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                {user.address}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                Joined {user.joinedDate}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="care360">Care360</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#1F2D3D] mb-4">
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="font-medium">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Emergency Contact</p>
                  <p className="font-medium">{user.emergencyContact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Active</p>
                  <p className="font-medium">{user.lastActive}</p>
                </div>
              </div>
            </Card>

            {/* Medical Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#1F2D3D] mb-4">
                Medical Conditions
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.medicalConditions.map((condition, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-red-50 text-red-700"
                  >
                    {condition}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <div className="divide-y">
              {activityLog.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Activity className="h-5 w-5 text-[#4A90E2] mt-0.5" />
                      <div>
                        <p className="font-medium text-[#1F2D3D]">{log.action}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {log.timestamp} • {log.device}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">IP: {log.ip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#4A90E2]" />
                      <div>
                        <p className="font-medium text-[#1F2D3D]">{doc.name}</p>
                        <p className="text-sm text-gray-600">
                          Uploaded {doc.uploadedDate} • Verified by {doc.verifiedBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {doc.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="care360">
          <Card className="p-6">
            <p className="text-gray-600">
              Care360 records are subject to HIPAA compliance and require clinical admin
              access.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Impersonate Dialog */}
      <Dialog open={impersonateDialog} onOpenChange={setImpersonateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Impersonate User
            </DialogTitle>
            <DialogDescription>
              You are about to view the app as <strong>{user.name}</strong>. This
              action requires 2FA verification and will be logged in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reason for Impersonation</label>
              <Textarea
                placeholder="Enter a detailed reason (required for audit)"
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">2FA Code</label>
              <Input
                type="text"
                placeholder="000000"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-xl tracking-widest"
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Important:</strong> All actions taken while impersonating will be
                attributed to the impersonated user but logged with your admin ID.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImpersonateDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleImpersonate}
              disabled={!impersonateReason.trim() || twoFACode.length !== 6}
            >
              Start Impersonation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
