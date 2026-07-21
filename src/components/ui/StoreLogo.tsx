import React from 'react';
import clsx from 'clsx';

/** A logo is an image when it's a URL or data-URL; otherwise it's an emoji/char. */
export function isImageLogo(logo?: string): boolean {
  return !!logo && /^(https?:\/\/|data:image\/)/.test(logo);
}

interface Props {
  logo?: string;
  name?: string;
  /** Classes for the box (size, rounding, background, border, text-size for emoji). */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a store's logo — a real uploaded image when available, otherwise the
 * emoji/character fallback. Drop-in replacement for `{store.logo}` boxes.
 */
export const StoreLogo: React.FC<Props> = ({ logo, name, className, style }) => {
  if (isImageLogo(logo)) {
    return (
      <div className={clsx('relative overflow-hidden bg-white flex items-center justify-center', className)} style={style}>
        <img src={logo} alt={name ?? 'Store logo'} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={clsx('flex items-center justify-center', className)} style={style}>
      {logo || '🏪'}
    </div>
  );
};
