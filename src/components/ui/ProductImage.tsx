import React from 'react';
import clsx from 'clsx';
import { Package } from 'lucide-react';
import type { Product } from '../../types';

/** First usable photo for a product, if any. */
export function productPhoto(p: Pick<Product, 'thumbnail' | 'images'>): string | undefined {
  if (p.thumbnail) return p.thumbnail;
  if (p.images && p.images.length > 0) return p.images[0];
  return undefined;
}

interface Props {
  product: Pick<Product, 'name' | 'thumbnail' | 'images' | 'imageColor' | 'imageIcon'>;
  /** Classes for the wrapper box (sizing, rounding, etc). */
  className?: string;
  /** Deprecated — kept for call-site compatibility; no longer renders emoji. */
  emojiClass?: string;
  /** How the photo fills the box. "contain" shows the whole image (no clipping). */
  fit?: 'cover' | 'contain';
  children?: React.ReactNode;
}

/**
 * Renders a real product photo when one exists. When a product has no photo we
 * show a clean, brandless placeholder — a neutral product icon on the store's
 * chosen colour — never an emoji.
 */
export const ProductImage: React.FC<Props> = ({ product, className, fit = 'cover', children }) => {
  const photo = productPhoto(product);

  if (photo) {
    return (
      <div className={clsx('relative overflow-hidden bg-white', className)}>
        <img
          src={photo}
          alt={product.name}
          loading="lazy"
          className={clsx('w-full h-full', fit === 'contain' ? 'object-contain' : 'object-cover')}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={clsx('relative bg-gradient-to-br flex items-center justify-center', product.imageColor, className)}>
      <Package className="w-[42%] h-[42%] max-w-[3rem] max-h-[3rem] text-white/85" strokeWidth={1.5} />
      {children}
    </div>
  );
};
