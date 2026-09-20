import { useAdminAuth } from './AdminAuthContext';
import { Button } from '../ui/button';
import { AlertCircle, X } from 'lucide-react';
import { motion } from 'motion/react';

export function ImpersonationBanner() {
  const { impersonationSession, endImpersonation } = useAdminAuth();

  if (!impersonationSession) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">
                Impersonation Mode Active
              </p>
              <p className="text-sm opacity-90">
                Viewing as: {impersonationSession.targetUserName} • 
                Started: {new Date(impersonationSession.startedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Button
            onClick={endImpersonation}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 flex-shrink-0"
          >
            <X className="h-4 w-4 mr-2" />
            Exit Impersonation
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
