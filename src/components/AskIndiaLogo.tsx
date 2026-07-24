import React from 'react';

interface LogoProps {
  /** icon box size in px */
  size?: number;
  /** show "AskIndia" wordmark */
  showText?: boolean;
  /** tailwind text-size class for the wordmark */
  textClass?: string;
  className?: string;
  /**
   * 'default' — navy tile (for light backgrounds).
   * 'light'   — white tile with navy letterform + white wordmark (for dark backgrounds).
   *             Use this instead of the `brightness-0 invert` hack, which turns the
   *             whole mark white and makes the icon disappear.
   */
  tone?: 'default' | 'light';
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
  tone = 'default',
}) => {
  const light = tone === 'light';
  const tile = light ? '#ffffff' : '#0D1F6E';   // tile background
  const letter = light ? '#0D1F6E' : '#ffffff'; // "A" letterform
  const askColor = light ? '#ffffff' : '#0D1F6E';
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
        {/* Background tile */}
        <rect width="40" height="40" rx="9" fill={tile} />

        {/* "A" letterform */}
        <path
          d="M6 30 L13 10 L20 24 L27 10 L34 30"
          stroke={letter}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* A crossbar */}
        <line x1="9" y1="23" x2="31" y2="23" stroke={letter} strokeWidth="2.8" strokeLinecap="round" />

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
          <span style={{ color: askColor }}>Ask</span>
          <span style={{ color: '#F97316' }}>India</span>
        </span>
      )}
    </div>
  );
};
