/**
 * ElderCare Logo Icon Component
 * AHZ Monogram - Abrar Hossain Zahin
 */

interface LogoIconProps {
  size?: number;
  variant?: 'default' | 'reversed' | 'white';
  className?: string;
}

export function LogoIcon({ size = 160, variant = 'default', className = '' }: LogoIconProps) {
  const bgColor = variant === 'reversed' ? '#3569B0' : '#4A90E2';
  const textColor = variant === 'white' || variant === 'reversed' ? '#FFFFFF' : '#FFFFFF';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded square background */}
      <rect
        width="512"
        height="512"
        rx="112"
        fill={bgColor}
      />
      
      {/* Inner decorative cut for depth */}
      <rect
        x="40"
        y="40"
        width="432"
        height="432"
        rx="92"
        stroke={textColor}
        strokeWidth="2"
        opacity="0.15"
        fill="none"
      />
      
      {/* AHZ Monogram - stylized interlocked letters */}
      <g fill={textColor}>
        {/* Letter A */}
        <path d="M140 360 L140 180 L160 180 L200 280 L240 180 L260 180 L260 360 L235 360 L235 240 L200 330 L160 240 L160 360 Z" />
        
        {/* Letter H (interlocked with Z) */}
        <path d="M280 180 L305 180 L305 260 L355 260 L355 180 L380 180 L380 360 L355 360 L355 285 L305 285 L305 360 L280 360 Z" />
        
        {/* Letter Z (diagonal interlocks with H) */}
        <path d="M140 390 L260 390 L260 410 L170 410 L260 480 L260 500 L140 500 L140 480 L230 480 Z" 
          opacity="0.9" 
          transform="translate(150, -180)" 
        />
      </g>
      
      {/* Accent glow effect */}
      <circle
        cx="256"
        cy="256"
        r="200"
        fill="url(#logoGlow)"
        opacity="0.1"
      />
      
      <defs>
        <radialGradient id="logoGlow">
          <stop offset="0%" stopColor="#FFA726" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFA726" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function LogoFavicon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill="#4A90E2" />
      <text
        x="32"
        y="45"
        fontSize="36"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        A
      </text>
    </svg>
  );
}
