import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, ArrowLeft, MapPin, AlertCircle, Loader2, ShoppingBag } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../../store/useAppStore';
import { useSearch, MIN_SEARCH_LENGTH } from '../../hooks/useSearch';
import { AskIndiaLogo } from '../../components/AskIndiaLogo';
import { ProductCard } from '../../components/ui/ProductCard';
import { ServiceCard } from '../../components/ui/ServiceCard';
import { StoreCard } from '../../components/ui/StoreCard';
import { toast } from '../../components/ui/Toast';
import type { Product, Service, Store, SearchHitProduct, SearchHitService } from '../../types';

type Tab = 'all' | 'products' | 'services' | 'stores';

/** Backend serialises numeric columns as strings ("549.00") — normalise them. */
const amount = (v: string | number | null | undefined): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * The /search endpoint returns a trimmed-down hit (id, name, price, …) while the
 * shared cards render a full Product/Service/Store. The whole catalogue is
 * already in the store from app boot, so hits are hydrated by id; the hit's own
 * fields are the fallback if an item isn't in local state yet.
 */
const hydrateProduct = (hit: SearchHitProduct, known?: Product): Product =>
  known ?? {
    id: hit.id,
    name: hit.name,
    description: '',
    price: amount(hit.price),
    mrp: amount(hit.mrp),
    commission: 0,
    categoryId: '',
    category: hit.category,
    stock: 1,
    sold: 0,
    imageColor: hit.image_color ?? '',
    imageIcon: hit.image_icon ?? '',
    thumbnail: hit.thumbnail ?? undefined,
    images: [],
    status: 'active',
    featured: hit.featured ?? false,
    availableCities: [],
    createdAt: new Date().toISOString(),
  };

const hydrateService = (hit: SearchHitService, known?: Service): Service =>
  known ?? {
    id: hit.id,
    providerId: '',
    providerName: hit.name,
    title: hit.name,
    description: '',
    price: amount(hit.price),
    priceType: (hit.price_type as Service['priceType']) ?? 'fixed',
    category: hit.category,
    commission: 0,
    imageColor: hit.image_color ?? '',
    imageIcon: hit.image_icon ?? '',
    thumbnail: hit.thumbnail ?? undefined,
    status: 'active',
    featured: hit.featured ?? false,
    availableCities: [],
    rating: amount(hit.rating),
    reviewCount: 0,
    deliveryTime: '',
    tags: [],
    createdAt: new Date().toISOString(),
  };

/* ── Section wrapper ───────────────────────────────────────────────────────── */

const Section: React.FC<{ title: string; count: number; cols: string; children: React.ReactNode }> = ({
  title, count, cols, children,
}) => (
  <section className="mb-8">
    <h2 className="text-sm font-bold text-slate-900 mb-3">
      {title} <span className="text-slate-400 font-medium">({count})</span>
    </h2>
    <div className={clsx('grid gap-3 sm:gap-4', cols)}>{children}</div>
  </section>
);

/* ── Page ──────────────────────────────────────────────────────────────────── */

export const SearchResults: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, services, stores, currentUser, cart, addToCart } = useAppStore();

  const query = searchParams.get('q') ?? '';
  const city = searchParams.get('city') ?? '';

  // Local input, kept in sync when the URL changes (back/forward, shared links).
  const [input, setInput] = useState(query);
  useEffect(() => { setInput(query); }, [query]);

  const { results, total, loading, error, tooShort, isEmptyQuery, retry } = useSearch(query, city);

  const [tab, setTab] = useState<Tab>('all');
  useEffect(() => { setTab('all'); }, [query]);

  const [addedId, setAddedId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // ── Hydrate hits against the catalogue already in the store ────────────────
  const byId = useMemo(() => ({
    products: new Map(products.map(p => [p.id, p])),
    services: new Map(services.map(s => [s.id, s])),
    stores:   new Map(stores.map(s => [s.id, s])),
  }), [products, services, stores]);

  const productResults = useMemo(
    () => results.products.map(h => hydrateProduct(h, byId.products.get(h.id))),
    [results.products, byId],
  );
  const serviceResults = useMemo(
    () => results.services.map(h => hydrateService(h, byId.services.get(h.id))),
    [results.services, byId],
  );
  // Store cards link by slug, which the hit payload doesn't carry — a store we
  // can't resolve locally has no reachable page, so it's dropped rather than
  // rendered as a dead link.
  const storeResults = useMemo(
    () => results.stores.map(h => byId.stores.get(h.id)).filter((s): s is Store => !!s),
    [results.stores, byId],
  );

  const productCount = (storeId: string) =>
    products.filter(p => p.storeId === storeId && p.status === 'active').length;

  const isAvailable = (p: Product) =>
    !city || p.availableCities.length === 0 || p.availableCities.includes(city);

  // ── Card handlers — mirror the homepage's behaviour ────────────────────────
  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate(`/shop/product/${product.id}`);
      return;
    }
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const toggleWish = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); toast.success('Added to wishlist'); }
      return next;
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    const next: Record<string, string> = {};
    if (q) next.q = q;
    if (city) next.city = city;
    setSearchParams(next, { replace: true });
  };

  const clearCity = () => {
    const next: Record<string, string> = {};
    if (query) next.q = query;
    setSearchParams(next, { replace: true });
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const showProducts = tab === 'all' || tab === 'products';
  const showServices = tab === 'all' || tab === 'services';
  const showStores   = tab === 'all' || tab === 'stores';

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'all',      label: 'All',      count: total },
    { id: 'products', label: 'Products', count: results.products.length },
    { id: 'services', label: 'Services', count: results.services.length },
    { id: 'stores',   label: 'Stores',   count: results.stores.length },
  ];

  const emptyTab =
    (tab === 'products' && productResults.length === 0) ||
    (tab === 'services' && serviceResults.length === 0) ||
    (tab === 'stores'   && storeResults.length === 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="p-2 -ml-2 text-slate-500 hover:text-brand-700 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <Link to="/" className="hidden sm:block flex-shrink-0">
            <AskIndiaLogo size={26} showText={false} />
          </Link>

          <form
            onSubmit={submit}
            className="flex-1 flex items-center h-11 bg-white rounded-xl border border-slate-200 shadow-soft focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100 transition-all"
          >
            <div className="flex-1 flex items-center gap-2.5 px-4 min-w-0">
              <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Search products, stores or services..."
                aria-label="Search"
                className="w-full bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
              />
              {input && (
                <button type="button" onClick={() => setInput('')} aria-label="Clear search" className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-full px-4 sm:px-6 bg-accent-500 text-white text-sm font-bold rounded-r-xl hover:bg-accent-600 active:bg-accent-700 disabled:opacity-60 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 sm:hidden" />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {currentUser?.role === 'customer' && (
            <button
              onClick={() => navigate('/shop/cart')}
              aria-label="Cart"
              className="relative p-2 text-slate-600 hover:text-accent-600 transition-colors flex-shrink-0"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {/* ── Heading + city chip ──────────────────────────────────────────── */}
        {!isEmptyQuery && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {loading ? 'Searching' : `${total} result${total === 1 ? '' : 's'}`} for “{query}”
            </h1>
            {city && (
              <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium px-2.5 py-1 rounded-full">
                <MapPin className="h-3 w-3" /> {city}
                <button onClick={clearCity} aria-label="Search all cities"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        {!loading && !error && total > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
                  tab === t.id ? 'bg-brand-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100',
                )}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        )}

        {/* ── States ───────────────────────────────────────────────────────── */}
        {isEmptyQuery ? (
          <div className="card py-20 text-center text-slate-400">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-500">What are you looking for?</p>
            <p className="text-sm mt-1">Search across products, services and stores.</p>
          </div>
        ) : tooShort ? (
          <div className="card py-20 text-center text-slate-400">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-500">Keep typing…</p>
            <p className="text-sm mt-1">Enter at least {MIN_SEARCH_LENGTH} characters to search.</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100/70 shadow-soft overflow-hidden animate-pulse">
                <div className="h-40 sm:h-44 bg-slate-200" />
                <div className="p-3 sm:p-3.5 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-4/5" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card py-16 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-400" />
            <p className="font-medium text-slate-700">Search is unavailable right now</p>
            <p className="text-sm text-slate-400 mt-1 px-6">{error}</p>
            <button onClick={retry} className="btn-primary mt-5 mx-auto">Try again</button>
          </div>
        ) : total === 0 ? (
          <div className="card py-20 text-center text-slate-400">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-500">No results for “{query}”</p>
            <p className="text-sm mt-1">
              Try a different keyword{city ? ', or search across all cities' : ''}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              {city && <button onClick={clearCity} className="btn-secondary">Search all cities</button>}
              <Link to={currentUser ? '/shop' : '/'} className="btn-primary">Browse everything</Link>
            </div>
          </div>
        ) : (
          <>
            {showProducts && productResults.length > 0 && (
              <Section title="Products" count={productResults.length} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {productResults.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    available={isAvailable(p) && p.stock > 0}
                    added={addedId === p.id}
                    wishlisted={wishlist.has(p.id)}
                    onAdd={e => handleAddToCart(p, e)}
                    onClick={() => navigate(`/shop/product/${p.id}`)}
                    onWish={e => toggleWish(p.id, e)}
                  />
                ))}
              </Section>
            )}

            {showServices && serviceResults.length > 0 && (
              <Section title="Services" count={serviceResults.length} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {serviceResults.map(s => (
                  <ServiceCard key={s.id} service={s} onCardClick={() => navigate(`/shop/service/${s.id}`)} />
                ))}
              </Section>
            )}

            {showStores && storeResults.length > 0 && (
              <Section title="Stores" count={storeResults.length} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {storeResults.map(s => (
                  <StoreCard key={s.id} store={s} productCount={productCount(s.id)} />
                ))}
              </Section>
            )}

            {/* A filtered tab can legitimately be empty while `total` is not. */}
            {emptyTab && (
              <div className="card py-16 text-center text-slate-400">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-slate-500">No {tab} matched “{query}”</p>
                <button onClick={() => setTab('all')} className="text-sm text-brand-600 hover:underline mt-2">
                  Show all results
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
