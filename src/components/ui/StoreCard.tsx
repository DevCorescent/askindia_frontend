import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Briefcase, MapPin, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import { StoreLogo } from './StoreLogo';
import type { Store } from '../../types';

interface Props {
  store: Store;
  /** Active product count, shown only for product stores. Omit to hide. */
  productCount?: number;
}

/** Store tile used by the stores listing and by global search results. */
export const StoreCard: React.FC<Props> = ({ store, productCount }) => {
  const isProduct = (store.storeType ?? 'product') === 'product';

  return (
    <Link
      to={`/shop/store/${store.slug}`}
      className="card overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 block group"
    >
      {/* Hero */}
      <div
        className="h-24 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${store.themeColor}, ${store.themeColor}bb)` }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)',
        }} />
        {/* Store type pill */}
        <div className={clsx(
          'absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
          isProduct
            ? 'bg-indigo-500/80 text-white'
            : 'bg-violet-500/80 text-white'
        )}>
          {isProduct ? <><Package className="h-2.5 w-2.5" /> Products</> : <><Briefcase className="h-2.5 w-2.5" /> Services</>}
        </div>

        {/* Store logo */}
        <StoreLogo logo={store.logo} name={store.name}
          className="absolute bottom-0 left-4 translate-y-1/2 w-14 h-14 rounded-2xl bg-white shadow-md text-2xl border-2 border-white" />
      </div>

      {/* Content */}
      <div className="pt-9 px-4 pb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight truncate group-hover:text-brand-600 transition-colors">
              {store.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{store.tagline}</p>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-400 transition-colors flex-shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {store.city}
          </span>
          {isProduct && productCount !== undefined && (
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {productCount} products
            </span>
          )}
        </div>

        {/* Subdomain pill */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[140px]">
            {store.slug}.askindia.shop
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
            ✓ Verified
          </span>
        </div>

        {/* Social links preview */}
        {store.customization && (store.customization.socialWhatsapp || store.customization.socialInstagram) && (
          <div className="flex items-center gap-1.5 mt-2">
            {store.customization.socialWhatsapp && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">💬 WhatsApp</span>
            )}
            {store.customization.socialInstagram && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">📸 Instagram</span>
            )}
            {store.customization.socialWebsite && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">🌐 Website</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
