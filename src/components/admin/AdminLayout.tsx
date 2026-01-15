import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { ImpersonationBanner } from './ImpersonationBanner';

interface AdminLayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function AdminLayout({ children, currentView, onNavigate }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar currentView={currentView} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ImpersonationBanner />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
