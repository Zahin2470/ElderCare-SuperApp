import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationState {
  module: string;
  frame: string | null;
  data?: any;
}

interface NavigationContextType {
  currentNavigation: NavigationState;
  navigateToFrame: (module: string, frame: string, data?: any) => void;
  navigateBack: () => void;
  resetNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentNavigation, setCurrentNavigation] = useState<NavigationState>({
    module: 'dashboard',
    frame: null,
  });

  const navigateToFrame = (module: string, frame: string, data?: any) => {
    setCurrentNavigation({ module, frame, data });
  };

  const navigateBack = () => {
    setCurrentNavigation((prev) => ({
      ...prev,
      frame: null,
      data: undefined,
    }));
  };

  const resetNavigation = () => {
    setCurrentNavigation({
      module: 'dashboard',
      frame: null,
    });
  };

  return (
    <NavigationContext.Provider
      value={{ currentNavigation, navigateToFrame, navigateBack, resetNavigation }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
