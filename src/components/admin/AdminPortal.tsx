import { useState } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { UserManagement } from './UserManagement';
import { UserDetail } from './UserDetail';
import { AuditLogs } from './AuditLogs';
import { SecurityCenter } from './SecurityCenter';
import { ModuleManagement } from './ModuleManagement';
import { RolesPermissions } from './RolesPermissions';
import { SystemSettings } from './SystemSettings';

export function AdminPortal() {
  const { isAdminAuthenticated } = useAdminAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  if (!isAdminAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setCurrentView('dashboard')} />;
  }

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView('user-detail');
  };

  const handleBackToUsers = () => {
    setSelectedUserId(null);
    setCurrentView('users');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement onViewUser={handleViewUser} />;
      case 'user-detail':
        return <UserDetail userId={selectedUserId || ''} onBack={handleBackToUsers} />;
      case 'roles':
        return <RolesPermissions />;
      case 'audit':
        return <AuditLogs />;
      case 'security':
        return <SecurityCenter />;
      case 'franchise':
      case 'partners':
      case 'reports':
      case 'content':
        return <ModuleManagement module={currentView} />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </AdminLayout>
  );
}
