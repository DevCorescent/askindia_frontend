import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import { Search, Store as StoreIcon, Package, Briefcase, MapPin, ExternalLink, Filter, X } from 'lucide-react';
import clsx from 'clsx';

const MAJOR_CITIES = [
  'All Cities', 'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat',
];

export const StoresListing: React.FC = () => {
  const navigate = useNavigate();
  const { stores, products } = useAppStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [showFilters, setShowFilters] = useState(false);

  const activeStores = useMemo(() =>
    stores.filter(s => s.status === 'active'),
    [stores]
  );

  const filtered = useMemo(() =>
    activeStores
      .filter(s => !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.tagline ?? '').toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase())
      )
      .filter(s => typeFilter === 'all' || (s.storeType ?? 'product') === typeFilter)
      .filter(s => cityFilter === 'All Cities' || s.city === cityFilter),
    [activeStores, search, typeFilter, cityFilter]
  );

  const productCount = (storeId: string) =>
    products.filter(p => p.status === 'active').length;

  const hasActiveFilters = typeFilter !== 'all' || cityFilter !== 'All Cities' || search;

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCityFilter('All Cities');
  };

  return (
    <AppLayout title="All Stores">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stores & Hubs</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {filtered.length} of {activeStores.length} active stores
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full font-medium">
              <Package className="h-3.5 w-3.5" />
              {activeStores.filter(s => (s.storeType ?? 'product') === 'product').length} Product Stores
            </span>
            <span className="flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full font-medium">
              <Briefcase className="h-3.5 w-3.5" />
              {activeStores.filter(s => s.storeType === 'service').length} Service Hubs
            </span>
          </div>
        </div>

        {/* Search + filter bar */}
        <div className="card p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search stores by name, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type tabs */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 flex-shrink-0">
            {([
              { value: 'all', label: 'All' },
              { value: 'product', label: '🛍 Products' },
              { value: 'service', label: '🛠 Services' },
            ] as const).map(tab => (
              <button
                key={tab.value}
                onClick={() => setTypeFilter(tab.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  typeFilter === tab.value
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* City filter */}
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="input max-w-[150px] text-sm"
          >
            {MAJOR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Active:</span>
            {search && (
              <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium px-2.5 py-1 rounded-full">
                "{search}" <button onClick={() => setSearch('')}><X className="h-3 w-3" /></button>
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium px-2.5 py-1 rounded-full">
                {typeFilter === 'product' ? '🛍 Products' : '🛠 Services'} <button onClick={() => setTypeFilter('all')}><X className="h-3 w-3" /></button>
              </span>
            )}
            {cityFilter !== 'All Cities' && (
              <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium px-2.5 py-1 rounded-full">
                📍 {cityFilter} <button onClick={() => setCityFilter('All Cities')}><X className="h-3 w-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1">
              Clear all
            </button>
          </div>
        )}

        {/* Stores grid */}
        {filtered.length === 0 ? (
          <div className="card py-20 text-center text-slate-400">
            <StoreIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No stores found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(store => {
              const isProduct = (store.storeType ?? 'product') === 'product';
              const itemCount = isProduct ? productCount(store.id) : 0;

              return (
                <Link
                  key={store.id}
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
                    <div className="absolute bottom-0 left-4 translate-y-1/2 w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-2xl border-2 border-white">
                      {store.logo}
                    </div>
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
                      {isProduct && (
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {itemCount} products
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
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
