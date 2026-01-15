import { useState, useEffect } from 'react';
import { LogoImage } from './LogoImage';
import { motion } from 'motion/react';

/**
 * ElderCare Splash Screen Component
 * Displays on app load with brand animation
 */

interface SplashScreenProps {
  onComplete?: () => void;
  onContinue?: () => void;
  duration?: number; // in milliseconds
  variant?: 'mobile' | 'tablet' | 'desktop';
}

export function SplashScreen({ 
  onComplete,
  onContinue, 
  duration = 3000,
  variant = 'mobile' 
}: SplashScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onComplete) onComplete();
      if (onContinue) onContinue();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete, onContinue]);

  if (!show) return null;

  const year = new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #4A90E2 0%, #3569B0 100%)',
      }}
    >
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full"
          style={{
            background: 'radial-gradient(circle, #4A90E2 0%, transparent 70%)',
          }}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full"
          style={{
            background: 'radial-gradient(circle, #3569B0 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Logo with animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
          className="max-w-xl w-full"
        >
          <LogoImage size="full" animated withGlow />
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 1.2,
            duration: 0.4,
          }}
          className="mt-12"
        >
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-3 h-3 rounded-full bg-white"
              />
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{
            delay: 1.5,
            duration: 0.5,
          }}
          className="absolute bottom-8 text-sm text-white/70 text-center"
        >
          © {year} Abrar Hossain Zahin
        </motion.p>
      </div>
    </motion.div>
  );
}

/**
 * Mini splash for quick transitions
 */
export function MiniSplash({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#4A90E2] to-[#3569B0]"
    >
      <motion.div
        className="max-w-md w-full px-8"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1,
          ease: "easeInOut",
        }}
      >
        <LogoImage size="full" animated />
      </motion.div>
    </motion.div>
  );
}