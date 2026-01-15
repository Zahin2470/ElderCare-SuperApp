import logoImage from 'figma:asset/0c1e8e2e7820887c925ea1ad4cc85865d08403d1.png';
import { motion } from 'motion/react';

/**
 * ElderCare Logo Image Component
 * Uses the branded logo image with dynamic effects
 */

interface LogoImageProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
  withGlow?: boolean;
}

const sizeConfig = {
  xs: 'h-8',
  sm: 'h-12',
  md: 'h-16',
  lg: 'h-24',
  xl: 'h-32',
  full: 'w-full h-auto',
};

export function LogoImage({ 
  size = 'md', 
  animated = false,
  className = '',
  onClick,
  withGlow = false
}: LogoImageProps) {
  const sizeClass = sizeConfig[size];

  if (animated) {
    return (
      <div className="relative inline-block">
        {withGlow && (
          <motion.div
            className="absolute inset-0 blur-2xl opacity-50"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src={logoImage}
              alt=""
              className={`${sizeClass} w-auto object-contain`}
            />
          </motion.div>
        )}
        <motion.img
          src={logoImage}
          alt="ElderCare - Care. Connect. Comfort."
          className={`relative ${sizeClass} w-auto object-contain ${onClick ? 'cursor-pointer' : ''} ${className}`}
          onClick={onClick}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    );
  }

  return (
    <img
      src={logoImage}
      alt="ElderCare - Care. Connect. Comfort."
      className={`${sizeClass} w-auto object-contain ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    />
  );
}

/**
 * Icon-only logo (cropped to just the heart-house icon)
 */
export function LogoIconOnly({ 
  size = 'md',
  animated = false,
  className = '' 
}: Omit<LogoImageProps, 'onClick'>) {
  const sizeClass = sizeConfig[size];

  if (animated) {
    return (
      <motion.div
        className={`${sizeClass} w-auto relative ${className}`}
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 1, rotate: 0 }}
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={logoImage}
          alt="ElderCare Icon"
          className="h-full w-auto object-contain object-left"
          style={{ 
            clipPath: 'inset(0 60% 0 0)',
            transform: 'scale(1.5)',
            transformOrigin: 'left center'
          }}
        />
      </motion.div>
    );
  }

  return (
    <div className={`${sizeClass} w-auto relative ${className}`}>
      <img
        src={logoImage}
        alt="ElderCare Icon"
        className="h-full w-auto object-contain object-left"
        style={{ 
          clipPath: 'inset(0 60% 0 0)',
          transform: 'scale(1.5)',
          transformOrigin: 'left center'
        }}
      />
    </div>
  );
}

/**
 * Compact logo for sidebar/header
 */
export function LogoCompact({ 
  size = 'sm',
  onClick,
  className = '' 
}: Omit<LogoImageProps, 'animated'>) {
  const sizeClass = sizeConfig[size];

  return (
    <motion.img
      src={logoImage}
      alt="ElderCare"
      className={`${sizeClass} w-auto object-contain cursor-pointer ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    />
  );
}