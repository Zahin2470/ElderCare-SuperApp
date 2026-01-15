import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Shield, Users, Lock, Plus, Edit, Trash2 } from 'lucide-react';
import { ROLE_PERMISSIONS, type AdminRole } from './AdminAuthContext';

export function RolesPermissions() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);

  const roles = [
    {
      id: 'super_admin',
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      userCount: 2,
      permissions: ROLE_PERMISSIONS.super_admin,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'security_admin',
      name: 'Security Admin',
      description: 'Security monitoring and audit log access',
      userCount: 3,
      permissions: ROLE_PERMISSIONS.security_admin,
      color: 'bg-red-100 text-red-700',
    },
    {
      id: 'operations_admin',
      name: 'Operations Admin',
      description: 'User management and operational oversight',
      userCount: 5,
      permissions: ROLE_PERMISSIONS.operations_admin,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'clinical_admin',
      name: 'Clinical Admin',
      description: 'Care360 and clinical data access',
      userCount: 4,
      permissions: ROLE_PERMISSIONS.clinical_admin,
      color: 'bg-green-100 text-green-700',
    },
  ];

  const allPermissions = [
    { id: 'users.read', category: 'User Management', label: 'Read Users' },
    { id: 'users.write', category: 'User Management', label: 'Write Users' },
    { id: 'users.delete', category: 'User Management', label: 'Delete Users' },
    { id: 'roles.read', category: 'Roles', label: 'Read Roles' },
    { id: 'roles.write', category: 'Roles', label: 'Write Roles' },
    { id: 'audit_logs.read', category: 'Security', label: 'Read Audit Logs' },
    { id: 'security.read', category: 'Security', label: 'Read Security' },
    { id: 'security.write', category: 'Security', label: 'Write Security' },
    { id: 'impersonation', category: 'Security', label: 'Impersonate Users' },
    { id: 'system_settings.read', category: 'System', label: 'Read Settings' },
    { id: 'system_settings.write', category: 'System', label: 'Write Settings' },
    { id: 'billing.read', category: 'Billing', label: 'Read Billing' },
    { id: 'billing.write', category: 'Billing', label: 'Write Billing' },
    { id: 'reports.read', category: 'Analytics', label: 'Read Reports' },
    { id: 'content.write', category: 'Content', label: 'Write Content' },
    { id: 'franchise.read', category: 'Operations', label: 'Read Franchise' },
    { id: 'franchise.write', category: 'Operations', label: 'Write Franchise' },
    { id: 'partner.read', category: 'Operations', label: 'Read Partners' },
    { id: 'partner.write', category: 'Operations', label: 'Write Partners' },
    { id: 'care360.read', category: 'Clinical', label: 'Read Care360' },
    { id: 'care360.write', category: 'Clinical', label: 'Write Care360' },
  ];

  const permissionsByCategory = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2D3D]">Roles & Permissions</h1>
          <p className="text-gray-600 mt-1">
            Manage admin roles and their access permissions
          </p>
        </div>
        <Button className="bg-gradient-to-r from-[#4A90E2] to-[#3569B0]">
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-[#4A90E2] to-[#3569B0]">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1F2D3D]">
                    {role.name}
                  </h3>
                  <Badge variant="outline" className={role.color}>
                    {role.userCount} users
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRole(role.id as AdminRole);
                  setEditDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-gray-600 mb-4">{role.description}</p>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Permissions:</p>
              <div className="flex flex-wrap gap-2">
                {role.permissions.slice(0, 6).map((permission) => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))}
                {role.permissions.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{role.permissions.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-[#1F2D3D] mb-6">
          Permission Matrix
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Permission
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <>
                  <tr key={category} className="bg-gray-50">
                    <td
                      colSpan={roles.length + 1}
                      className="px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      {category}
                    </td>
                  </tr>
                  {perms.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {permission.label}
                      </td>
                      {roles.map((role) => (
                        <td key={role.id} className="px-4 py-3 text-center">
                          {role.permissions.includes(permission.id) ? (
                            <Lock className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <div className="w-4 h-4 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role Permissions</DialogTitle>
            <DialogDescription>
              Modify permissions for {selectedRole?.replace('_', ' ')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 my-4">
            {Object.entries(permissionsByCategory).map(([category, perms]) => (
              <div key={category}>
                <h3 className="font-semibold text-[#1F2D3D] mb-3">{category}</h3>
                <div className="space-y-2">
                  {perms.map((permission) => {
                    const hasPermission = selectedRole
                      ? ROLE_PERMISSIONS[selectedRole]?.includes(permission.id)
                      : false;
                    return (
                      <div
                        key={permission.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                      >
                        <Checkbox defaultChecked={hasPermission} />
                        <label className="text-sm cursor-pointer flex-1">
                          {permission.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#4A90E2] to-[#3569B0]"
              onClick={() => setEditDialogOpen(false)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
