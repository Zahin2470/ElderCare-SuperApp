import { useState } from 'react';
import { useAdminAuth, hasPermission } from './AdminAuthContext';
import { Button } from '../ui/button';
import { LogoImage, LogoIconOnly } from '../brand/LogoImage';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Settings,
  BarChart3,
  Building2,
  HandshakeIcon,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
  collapsed?: boolean;
}

function NavItem({ icon, label, active, onClick, badge, collapsed }: NavItemProps) {
  return (
    <Button
      variant={active ? 'default' : 'ghost'}
      className={`w-full justify-start ${
        active
          ? 'bg-gradient-to-r from-[#4A90E2] to-[#3569B0] text-white hover:from-[#3569B0] hover:to-[#2B5690]'
          : 'hover:bg-gray-100'
      } ${collapsed ? 'px-2' : 'px-3'}`}
      onClick={onClick}
    >
      <span className={collapsed ? 'mx-auto' : 'mr-3'}>{icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {badge && (
            <Badge variant={active ? 'secondary' : 'outline'} className="ml-auto">
              {badge}
            </Badge>
          )}
        </>
      )}
    </Button>
  );
}

interface AdminSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function AdminSidebar({ currentView, onNavigate }: AdminSidebarProps) {
  const { adminUser, adminLogout } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: 'Dashboard',
      permission: null,
    },
    {
      id: 'users',
      icon: <Users className="h-5 w-5" />,
      label: 'User Management',
      permission: 'users.read',
      badge: '1.4K',
    },
    {
      id: 'roles',
      icon: <Shield className="h-5 w-5" />,
      label: 'Roles & Permissions',
      permission: 'roles.read',
    },
    {
      id: 'audit',
      icon: <FileText className="h-5 w-5" />,
      label: 'Audit Logs',
      permission: 'audit_logs.read',
    },
    {
      id: 'security',
      icon: <Shield className="h-5 w-5" />,
      label: 'Security Center',
      permission: 'security.read',
      badge: '23',
    },
    {
      id: 'reports',
      icon: <BarChart3 className="h-5 w-5" />,
      label: 'Reports & Analytics',
      permission: 'reports.read',
    },
    {
      id: 'franchise',
      icon: <Building2 className="h-5 w-5" />,
      label: 'Franchise Management',
      permission: 'franchise.read',
    },
    {
      id: 'partners',
      icon: <HandshakeIcon className="h-5 w-5" />,
      label: 'Partner Management',
      permission: 'partner.read',
    },
    {
      id: 'content',
      icon: <Bell className="h-5 w-5" />,
      label: 'Content Management',
      permission: 'content.write',
    },
    {
      id: 'settings',
      icon: <Settings className="h-5 w-5" />,
      label: 'System Settings',
      permission: 'system_settings.read',
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(adminUser, item.permission)
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700';
      case 'security_admin':
        return 'bg-red-100 text-red-700';
      case 'operations_admin':
        return 'bg-blue-100 text-blue-700';
      case 'clinical_admin':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0"
    >
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {collapsed ? (
          <LogoIconOnly size="md" className="mx-auto" />
        ) : (
          <LogoImage size="sm" />
        )}
        <Button
          variant="ghost"
          size="sm"
          className={`p-1 ${collapsed ? 'mx-auto mt-2' : ''}`}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Admin Profile */}
      <div className={`p-4 border-b border-gray-200 ${collapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'flex-col' : ''}`}>
          <Avatar className={collapsed ? 'mx-auto' : ''}>
            <AvatarFallback className="bg-gradient-to-br from-[#4A90E2] to-[#3569B0] text-white">
              {adminUser?.fullName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#1F2D3D] truncate">
                {adminUser?.fullName}
              </p>
              <Badge
                variant="outline"
                className={`text-xs mt-1 ${getRoleColor(adminUser?.role || '')}`}
              >
                {adminUser?.role.replace('_', ' ')}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={currentView === item.id}
            onClick={() => onNavigate(item.id)}
            badge={item.badge}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${
            collapsed ? 'px-2' : 'px-3'
          }`}
          onClick={adminLogout}
        >
          <LogOut className={`h-5 w-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </motion.div>
  );
}
