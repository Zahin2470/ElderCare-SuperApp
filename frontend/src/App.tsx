import { Suspense, lazy } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { AdminAuthProvider, isAdminRole } from './components/admin/AdminAuthContext';
import { NavigationProvider, useNavigation } from './components/navigation/NavigationContext';
import AuthFlow from './components/auth/AuthFlow';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import { Toaster } from './components/ui/sonner';
import { LogoCompact } from './components/brand/LogoImage';
import { FRAMES, MODULES, Role, visibleModules } from './app/registry';

// The admin console is a separate audience; keep it out of the main bundle.
const AdminPortal = lazy(() => import('./components/admin/AdminPortal').then((m) => ({ default: m.AdminPortal })));

function PageFallback() {
  return <div className="p-8 text-gray-500" role="status">Loading…</div>;
}

function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const { user, logout, linkedSeniors } = useAuth();
  const { currentNavigation, navigateToFrame } = useNavigation();
  const accountLabel = user?.role === 'family' ? 'Family account' : 'Senior account';

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} h-full flex flex-col bg-gradient-to-b from-purple-50 to-blue-50`}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => navigateToFrame('dashboard', null)}>
          <LogoCompact size="md" />
          <div>
            <h1 className="text-[#4A90E2] leading-tight">ElderCare</h1>
            <p className="text-xs text-gray-600">Care. Connect. Comfort.</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto" aria-label="Modules">
        {visibleModules().map((m) => {
          const isActive = currentNavigation.module === m.id;
          return (
            <button
              key={m.id}
              onClick={() => navigateToFrame(m.id, null)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive ? 'bg-purple-600 text-white shadow-md' : 'bg-white hover:bg-purple-100 text-gray-700'
              }`}
            >
              <span className="text-xl" aria-hidden>{m.emoji}</span>
              <span className="flex-1 text-left">{m.name}</span>
              {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 space-y-3">
        <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
          <p className="text-sm text-gray-600 mb-1">{accountLabel}</p>
          <p className="font-medium text-purple-700">{user?.fullName || 'User'}</p>
          {user?.role === 'family' && linkedSeniors[0] && (
            <p className="text-xs text-gray-600 mt-1">Caring for: {linkedSeniors[0].fullName}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

function MainApp() {
  const { user } = useAuth();
  const { currentNavigation, navigateToFrame } = useNavigation();
  const userRole: Role = user?.role === 'family' ? 'family' : 'senior';

  const renderPage = () => {
    const { module, frame, data } = currentNavigation;
    const def = frame ? FRAMES[frame] : undefined;

    if (def && def.module === module) {
      // A deep link / refresh can arrive without the object the frame was opened with.
      if (def.needsData && data == null) {
        queueMicrotask(() => navigateToFrame(module, null));
        return <PageFallback />;
      }
      const Frame = def.Component;
      return <Frame />;
    }

    const page = MODULES.find((m) => m.id === module) ?? MODULES[0];
    const Page = page.Component;
    return <Page userRole={userRole} />;
  };

  const activeName = MODULES.find((m) => m.id === currentNavigation.module)?.name;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="hidden md:block w-80 border-r bg-white shadow-lg">
        <Sidebar />
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="md:hidden sticky top-0 z-10 bg-white border-b shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoCompact size="sm" />
            <div>
              <h2 className="text-[#4A90E2] leading-tight">ElderCare</h2>
              <p className="text-xs text-gray-600">{activeName}</p>
            </div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80" aria-describedby={undefined}>
              <div className="sr-only"><h2>Navigation Menu</h2></div>
              <Sidebar isMobile />
            </SheetContent>
          </Sheet>
        </div>

        <div className="p-4 md:p-8">
          <ErrorBoundary resetKey={`${currentNavigation.module}/${currentNavigation.frame}`}>
            <Suspense fallback={<PageFallback />}>{renderPage()}</Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageFallback />;                         // checking the session cookie
  if (!isAuthenticated) return <AuthFlow />;
  if (user && isAdminRole(user.role)) {
    return (
      <Suspense fallback={<PageFallback />}>
        <AdminPortal />
      </Suspense>
    );
  }
  return <MainApp />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminAuthProvider>
          <NavigationProvider>
            <AppContent />
            <Toaster />
          </NavigationProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
