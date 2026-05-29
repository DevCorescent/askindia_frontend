import React from 'react';

interface LogoProps {
  /** icon box size in px */
  size?: number;
  /** show "AskIndia" wordmark */
  showText?: boolean;
  /** tailwind text-size class for the wordmark */
  textClass?: string;
  className?: string;
}

/**
 * AskIndia brand logo.
 * Icon: dark-navy rounded square with a white "A" shape,
 *       orange "i" dot, and orange cart-underline + wheels.
 * Wordmark: "Ask" (navy) + "India" (orange)
 */
export const AskIndiaLogo: React.FC<LogoProps> = ({
  size = 36,
  showText = true,
  textClass = 'text-xl',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* ── Icon ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AskIndia icon"
      >
        {/* Background */}
        <rect width="40" height="40" rx="9" fill="#0D1F6E" />

        {/* White "A" letterform */}
        <path
          d="M6 30 L13 10 L20 24 L27 10 L34 30"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* A crossbar */}
        <line x1="9" y1="23" x2="31" y2="23" stroke="white" strokeWidth="2.8" strokeLinecap="round" />

        {/* Orange "i" dot */}
        <circle cx="36.5" cy="10" r="2.8" fill="#F97316" />

        {/* Orange cart arc / underline */}
        <path
          d="M5 35.5 Q20 41 35 35.5"
          stroke="#F97316"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Orange cart wheels */}
        <circle cx="11" cy="38.5" r="2" fill="#F97316" />
        <circle cx="29" cy="38.5" r="2" fill="#F97316" />
      </svg>

      {/* ── Wordmark ── */}
      {showText && (
        <span className={`font-extrabold leading-none tracking-tight ${textClass}`}>
          <span style={{ color: '#0D1F6E' }}>Ask</span>
          <span style={{ color: '#F97316' }}>India</span>
        </span>
      )}
    </div>
  );
};
