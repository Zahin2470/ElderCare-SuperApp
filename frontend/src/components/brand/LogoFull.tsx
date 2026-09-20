import { LogoIcon } from './LogoIcon';

/**
 * Full Horizontal Logo with Wordmark
 * Logo Icon + "Abrar Hossain Zahin" text
 */

interface LogoFullProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'reversed' | 'white';
  showTagline?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { icon: 40, text: 'text-lg', tagline: 'text-xs' },
  md: { icon: 60, text: 'text-2xl', tagline: 'text-sm' },
  lg: { icon: 80, text: 'text-3xl', tagline: 'text-base' },
  xl: { icon: 120, text: 'text-5xl', tagline: 'text-xl' },
};

export function LogoFull({ 
  size = 'md', 
  variant = 'default', 
  showTagline = true,
  className = '' 
}: LogoFullProps) {
  const config = sizeConfig[size];
  const textColor = variant === 'white' ? 'text-white' : 'text-[#1F2D3D]';
  const accentColor = variant === 'white' ? 'text-white/70' : 'text-[#4A90E2]';

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <LogoIcon size={config.icon} variant={variant} />
      <div className="flex flex-col">
        <h1 className={`${config.text} font-semibold ${textColor} leading-tight`}>
          ElderCare SuperApp
        </h1>
        {showTagline && (
          <p className={`${config.tagline} ${accentColor} mt-1`}>
            Care. Connect. Comfort.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Stacked Logo Variant
 * Logo Icon above text (centered)
 */
export function LogoStacked({ 
  size = 'md', 
  variant = 'default',
  showTagline = true,
  className = '' 
}: LogoFullProps) {
  const config = sizeConfig[size];
  const textColor = variant === 'white' ? 'text-white' : 'text-[#1F2D3D]';
  const accentColor = variant === 'white' ? 'text-white/70' : 'text-[#4A90E2]';

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <LogoIcon size={config.icon} variant={variant} />
      <div className="mt-4">
        <h1 className={`${config.text} font-semibold ${textColor} leading-tight`}>
          ElderCare SuperApp
        </h1>
        {showTagline && (
          <p className={`${config.tagline} ${accentColor} mt-2`}>
            Care. Connect. Comfort.
          </p>
        )}
      </div>
    </div>
  );
}
