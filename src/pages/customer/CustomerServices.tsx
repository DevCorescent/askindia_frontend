import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { SERVICE_CATEGORIES, formatCurrency } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { Search, Star, MapPin, Clock, X, SlidersHorizontal, Filter, Briefcase } from 'lucide-react';
import type { Service } from '../../types';
import clsx from 'clsx';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const PRICE_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'starting_from', label: 'Starting From' },
];

const PRICE_PRESETS = [
  { label: 'Under ₹500', max: 500 },
  { label: 'Under ₹1k', max: 1000 },
  { label: 'Under ₹2k', max: 2000 },
  { label: 'Under ₹5k', max: 5000 },
];

const priceLabel = (s: Service) =>
  s.priceType === 'hourly' ? '/hr' : s.priceType === 'starting_from' ? ' onwards' : '';

export const CustomerServices: React.FC = () => {
  const { services, currentUser } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedPriceTypes, setSelectedPriceTypes] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<0 | 3 | 4>(0);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [availFilter, setAvailFilter] = useState<'all' | 'available'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const isAvailable = (s: Service) =>
    !currentUser?.city || s.availableCities.length === 0 || s.availableCities.includes(currentUser.city);

  const activeServices = useMemo(() => services.filter(s => s.status === 'active'), [services]);

  const filtered = useMemo(() => {
    return activeServices
      .filter(s =>
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.providerName.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
      .filter(s => selectedCats.length === 0 || selectedCats.includes(s.category))
      .filter(s => !priceMin || s.price >= Number(priceMin))
      .filter(s => !priceMax || s.price <= Number(priceMax))
      .filter(s => selectedPriceTypes.length === 0 || selectedPriceTypes.includes(s.priceType))
      .filter(s => minRating === 0 || s.rating >= minRating)
      .filter(s => availFilter === 'all' || isAvailable(s))
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'rating': return b.rating - a.rating;
          case 'price_asc': return a.price - b.price;
          case 'price_desc': return b.price - a.price;
          default: return 0;
        }
      });
  }, [activeServices, search, selectedCats, priceMin, priceMax, selectedPriceTypes, minRating, sortBy, availFilter]);

  const toggleCat = (slug: string) =>
    setSelectedCats(prev => prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug]);

  const togglePriceType = (val: string) =>
    setSelectedPriceTypes(prev => prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]);

  const clearAll = () => {
    setSearch('');
    setSelectedCats([]);
    setPriceMin('');
    setPriceMax('');
    setSelectedPriceTypes([]);
    setMinRating(0);
    setSortBy('newest');
    setAvailFilter('all');
  };

  const activeChips = [
    ...selectedCats.map(slug => ({
      label: SERVICE_CATEGORIES.find(c => c.slug === slug)?.name ?? slug,
      onRemove: () => toggleCat(slug),
    })),
    ...selectedPriceTypes.map(pt => ({
      label: PRICE_TYPE_OPTIONS.find(o => o.value === pt)?.label ?? pt,
      onRemove: () => togglePriceType(pt),
    })),
    ...(priceMin ? [{ label: `Min ₹${priceMin}`, onRemove: () => setPriceMin('') }] : []),
    ...(priceMax ? [{ label: `Max ₹${priceMax}`, onRemove: () => setPriceMax('') }] : []),
    ...(minRating > 0 ? [{ label: `${minRating}+ Stars`, onRemove: () => setMinRating(0) }] : []),
    ...(availFilter === 'available' ? [{ label: `In ${currentUser?.city ?? 'my city'}`, onRemove: () => setAvailFilter('all') }] : []),
  ];

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</h3>
          {selectedCats.length > 0 && (
            <button onClick={() => setSelectedCats([])} className="text-xs text-violet-600 font-medium hover:text-violet-800">
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {SERVICE_CATEGORIES.map(cat => (
            <label
              key={cat.id}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm select-none',
                selectedCats.includes(cat.slug)
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : 'hover:bg-slate-50 text-slate-600'
              )}
            >
              <input
                type="checkbox"
                checked={selectedCats.includes(cat.slug)}
                onChange={() => toggleCat(cat.slug)}
                className="rounded border-slate-300 text-violet-600 w-4 h-4 flex-shrink-0"
              />
              <span className="text-base leading-none">{cat.icon}</span>
              <span className="truncate">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Price Range</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">₹</span>
            <input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={e => setPriceMin(e.target.value)}
              className="input pl-7 text-sm py-2 w-full"
              min="0"
            />
          </div>
          <span className="text-slate-300 font-medium">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">₹</span>
            <input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={e => setPriceMax(e.target.value)}
              className="input pl-7 text-sm py-2 w-full"
              min="0"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map(p => (
            <button
              key={p.max}
              onClick={() => { setPriceMin(''); setPriceMax(String(p.max)); }}
              className={clsx(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                priceMax === String(p.max) && !priceMin
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'border-slate-200 text-slate-600 hover:border-violet-300'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Pricing Type */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing Type</h3>
          {selectedPriceTypes.length > 0 && (
            <button onClick={() => setSelectedPriceTypes([])} className="text-xs text-violet-600 font-medium hover:text-violet-800">
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {PRICE_TYPE_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm select-none',
                selectedPriceTypes.includes(opt.value)
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : 'hover:bg-slate-50 text-slate-600'
              )}
            >
              <input
                type="checkbox"
                checked={selectedPriceTypes.includes(opt.value)}
                onChange={() => togglePriceType(opt.value)}
                className="rounded border-slate-300 text-violet-600 w-4 h-4 flex-shrink-0"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Minimum Rating */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Minimum Rating</h3>
        <div className="space-y-1">
          {([
            { value: 0, label: 'Any rating' },
            { value: 3, label: '3+ stars' },
            { value: 4, label: '4+ stars' },
          ] as const).map(opt => (
            <label
              key={opt.value}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm select-none',
                minRating === opt.value
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : 'hover:bg-slate-50 text-slate-600'
              )}
            >
              <input
                type="radio"
                name="rating"
                checked={minRating === opt.value}
                onChange={() => setMinRating(opt.value)}
                className="border-slate-300 text-violet-600 w-4 h-4 flex-shrink-0"
              />
              {opt.value > 0 ? (
                <span className="flex items-center gap-1">
                  {Array.from({ length: opt.value }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-0.5">{opt.label}</span>
                </span>
              ) : opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      {currentUser?.city && (
        <>
          <div className="h-px bg-slate-100" />
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Availability</h3>
            <div className="space-y-1">
              {([
                { value: 'all', label: 'All Services' },
                { value: 'available', label: `In ${currentUser.city} only` },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  className={clsx(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm select-none',
                    availFilter === opt.value
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'hover:bg-slate-50 text-slate-600'
                  )}
                >
                  <input
                    type="radio"
                    name="avail"
                    checked={availFilter === opt.value}
                    onChange={() => setAvailFilter(opt.value)}
                    className="border-slate-300 text-violet-600 w-4 h-4 flex-shrink-0"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {activeChips.length > 0 && (
        <>
          <div className="h-px bg-slate-100" />
          <button
            onClick={clearAll}
            className="w-full text-sm text-slate-400 hover:text-red-500 transition-colors py-1 text-center"
          >
            Clear all filters
          </button>
        </>
      )}
    </div>
  );

  return (
    <AppLayout title="All Services">
      <div className="space-y-4">

        {/* Search + Sort + Filter toggle */}
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9 pr-9"
              placeholder="Search by service, provider, or keyword…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="input w-auto text-sm hidden sm:block"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex-shrink-0',
              showFilters || activeChips.length > 0
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden xs:inline">Filters</span>
            {activeChips.length > 0 && (
              <span className="bg-white text-violet-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {activeChips.length}
              </span>
            )}
          </button>
        </div>

        {/* Sort (mobile only) */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="input w-full text-sm sm:hidden"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 font-medium">Active:</span>
            {activeChips.map(chip => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {chip.label}
                <button onClick={chip.onRemove} className="hover:text-violet-900 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAll}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Main layout: sidebar + grid */}
        <div className="flex gap-6 items-start">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 xl:w-60 flex-shrink-0 card p-5 sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                Filters
              </h2>
              {activeChips.length > 0 && (
                <span className="bg-violet-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeChips.length}
                </span>
              )}
            </div>
            <FilterSidebar />
          </aside>

          {/* Mobile filter drawer */}
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 sm:w-80 bg-white shadow-2xl overflow-y-auto">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                      <Filter className="h-4 w-4" /> Filters
                    </h2>
                    <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-700 p-1">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <FilterSidebar />
                  <button
                    onClick={() => setShowFilters(false)}
                    className="mt-6 w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors"
                  >
                    Show {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-900">{filtered.length}</span>
                {' '}of{' '}
                <span className="font-medium">{activeServices.length}</span> services
              </p>
              {currentUser?.city && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Showing for <strong>{currentUser.city}</strong></span>
                </div>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="py-24 text-center">
                <div className="text-6xl mb-4">
                  <Briefcase className="h-16 w-16 text-slate-200 mx-auto" />
                </div>
                <p className="font-semibold text-slate-700 text-lg mb-1">No services found</p>
                <p className="text-slate-400 text-sm">
                  {activeServices.length === 0
                    ? 'No services have been listed yet — check back soon!'
                    : 'Try adjusting your filters or search term.'}
                </p>
                {activeChips.length > 0 && (
                  <button onClick={clearAll} className="mt-6 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors">
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filtered.map(service => {
                  const available = isAvailable(service);
                  return (
                    <Link
                      key={service.id}
                      to={`/shop/service/${service.id}`}
                      className={clsx(
                        'card overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 block',
                        !available && 'opacity-70'
                      )}
                    >
                      {/* Image area */}
                      <div className={clsx('h-36 bg-gradient-to-br flex items-center justify-center text-5xl relative', service.imageColor)}>
                        {service.featured && (
                          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            ⭐ Featured
                          </span>
                        )}
                        {!available && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                              Not in your city
                            </span>
                          </div>
                        )}
                        {service.imageIcon}
                      </div>

                      <div className="p-4">
                        {/* Category badge */}
                        <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mb-2">
                          {SERVICE_CATEGORIES.find(c => c.slug === service.category)?.icon}
                          {' '}{SERVICE_CATEGORIES.find(c => c.slug === service.category)?.name ?? service.category}
                        </span>

                        <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-1 line-clamp-2">
                          {service.title}
                        </h3>
                        <p className="text-xs text-slate-400 mb-2">by {service.providerName}</p>

                        {/* Rating */}
                        {service.rating > 0 ? (
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-slate-700">{service.rating.toFixed(1)}</span>
                            <span className="text-xs text-slate-400">({service.reviewCount} reviews)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-slate-200 text-slate-200" />
                            ))}
                            <span className="text-xs text-slate-400 ml-0.5">New</span>
                          </div>
                        )}

                        {/* Delivery time */}
                        {service.deliveryTime && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                            <Clock className="h-3 w-3" />
                            {service.deliveryTime}
                          </div>
                        )}

                        {/* Tags */}
                        {service.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {service.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-3">
                          <span className="text-lg font-bold text-slate-900">{formatCurrency(service.price)}</span>
                          <span className="text-xs text-slate-400">{priceLabel(service)}</span>
                        </div>

                        <span className={clsx(
                          'block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors',
                          available
                            ? 'bg-violet-600 text-white hover:bg-violet-700'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                        )}>
                          {available ? 'View & Book' : 'Not Available'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
