import React, { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Search,
  ChevronDown,
  ArrowRight,
  Star,
  ShoppingBag,
  Store,
  Briefcase,
  CheckCircle,
  Truck,
  Shield,
  Headphones,
  LogIn,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Award,
  Heart,
  Flame,
  Home,
  LayoutGrid,
  User,
  SlidersHorizontal,
  Gift,
  Shirt,
  Dumbbell,
  Gamepad2,
  Car,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Smartphone,
  Lamp,
  Flower2,
  GraduationCap,
  ShoppingCart,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useTracking } from "../hooks/useTracking";
import {
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  formatCurrency,
  resolveCategoryId,
} from "../data/mockData";
import type { Product, Service } from "../types";
import { AskIndiaLogo } from "../components/AskIndiaLogo";
import { env } from "../utils/env";
import clsx from "clsx";

/* ── Constants ────────────────────────────────────────────────────────────── */
const CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Jaipur",
  "Surat",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Bhopal",
  "Visakhapatnam",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Varanasi",
  "Amritsar",
  "Coimbatore",
  "Madurai",
  "Kochi",
];

const TRUST_BADGES = [
  {
    icon: Truck,
    label: "Free Delivery",
    desc: "Orders above ₹999",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    icon: Shield,
    label: "Secure Payments",
    desc: "UPI, Cards & COD",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Headphones,
    label: "24/7 Support",
    desc: "Always here for you",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Award,
    label: "Verified Sellers",
    desc: "KYC approved",
    color: "text-accent-600",
    bg: "bg-orange-50",
  },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const getRating = (id: string) =>
  (
    3.8 +
    (id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 12) / 10
  ).toFixed(1);
const getReviews = (id: string) =>
  100 + (id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 1900);
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-600",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-600",
  "bg-indigo-500",
];

/* Line-icon set for product categories (sample — used in "Shop by Category") */
const CATEGORY_ICONS: Record<
  string,
  { Icon: LucideIcon; color: string; bg: string; grad: string }
> = {
  c1: {
    Icon: Smartphone,
    color: "text-sky-600",
    bg: "bg-sky-50",
    grad: "from-sky-400 to-blue-600",
  },
  c2: {
    Icon: Shirt,
    color: "text-rose-600",
    bg: "bg-rose-50",
    grad: "from-rose-400 to-pink-600",
  },
  c3: {
    Icon: Dumbbell,
    color: "text-orange-600",
    bg: "bg-orange-50",
    grad: "from-orange-400 to-amber-600",
  },
  c4: {
    Icon: Lamp,
    color: "text-amber-600",
    bg: "bg-amber-50",
    grad: "from-amber-400 to-orange-600",
  },
  c5: {
    Icon: Flower2,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
    grad: "from-fuchsia-400 to-purple-600",
  },
  c6: {
    Icon: GraduationCap,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    grad: "from-indigo-400 to-violet-600",
  },
  c7: {
    Icon: ShoppingCart,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    grad: "from-emerald-400 to-green-600",
  },
  c8: {
    Icon: Gamepad2,
    color: "text-violet-600",
    bg: "bg-violet-50",
    grad: "from-violet-400 to-indigo-600",
  },
  c9: {
    Icon: Car,
    color: "text-slate-600",
    bg: "bg-slate-100",
    grad: "from-slate-400 to-slate-600",
  },
  c10: {
    Icon: Stethoscope,
    color: "text-red-600",
    bg: "bg-red-50",
    grad: "from-red-400 to-rose-600",
  },
};

/** Renders a category's line icon (inherits currentColor); falls back to its emoji. */
const CatIcon: React.FC<{
  id: string;
  className?: string;
  fallback?: string;
}> = ({ id, className, fallback }) => {
  const ic = CATEGORY_ICONS[id];
  return ic ? <ic.Icon className={className} /> : <span>{fallback}</span>;
};
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

/* ── Hero Section ─────────────────────────────────────────────────────────── */
const HERO_CHIPS: { label: string; catId: string | null }[] = [
  { label: "Electronics", catId: "c1" },
  { label: "Fashion", catId: "c2" },
  { label: "Beauty", catId: "c5" },
  { label: "Home", catId: "c4" },
  { label: "Grocery", catId: "c7" },
  { label: "Services", catId: null },
];

const HeroSection: React.FC<{
  onExplore: () => void;
  onServices: () => void;
  onCategory: (catId: string) => void;
}> = ({ onExplore, onServices, onCategory }) => (
  <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-white">
    {/* Abstract floating shapes & illustrations */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full bg-brand-500/10 blur-3xl ai-float" />
      <div
        className="absolute -top-10 -right-24 w-[30rem] h-[30rem] rounded-full bg-accent-500/10 blur-3xl ai-float"
        style={{ animationDelay: "1.4s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-indigo-400/10 blur-3xl ai-float"
        style={{ animationDelay: ".7s" }}
      />
    </div>

    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
      <span
        className="fade-up inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-full px-4 py-1.5 text-xs font-bold text-brand-800 mb-5"
        style={{ animationDelay: "0ms" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />{" "}
        India's Unified Marketplace
      </span>
      <h1
        className="fade-up text-4xl sm:text-5xl lg:text-[52px] font-bold text-brand-900 tracking-tight leading-[1.08] mb-4"
        style={{ animationDelay: "80ms" }}
      >
        Discover Products &amp;
        <br />
        <span className="text-violet-600">Services</span> Near You
      </h1>
      <p
        className="fade-up text-slate-500 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed"
        style={{ animationDelay: "160ms" }}
      >
        Shop from verified local stores and book trusted services — all in one
        place, right in your city.
      </p>

      {/* CTAs */}
      <div
        className="fade-up flex flex-col sm:flex-row items-center justify-center gap-3 mt-2"
        style={{ animationDelay: "400ms" }}
      >
        <button
          onClick={onExplore}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-accent-400 to-accent-600 hover:from-accent-500 hover:to-accent-700 text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-orange-900/20 transition-all active:scale-[0.98]"
        >
          Explore Products <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={onServices}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-900 hover:bg-brand-800 text-white font-bold px-8 py-3.5 rounded-full shadow-md transition-all active:scale-[0.98]"
        >
          Book Services
        </button>
      </div>
    </div>
  </section>
);

/* ── Product Card ─────────────────────────────────────────────────────────── */
const ProductCard: React.FC<{
  product: Product;
  available: boolean;
  added: boolean;
  wishlisted: boolean;
  onAdd: (e: React.MouseEvent) => void;
  onClick: () => void;
  onWish: (e: React.MouseEvent) => void;
}> = ({ product, available, added, wishlisted, onAdd, onClick, onWish }) => {
  const disc =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-white rounded-2xl border border-slate-100/70 shadow-soft overflow-hidden hover:-translate-y-1 transition-all duration-200 group cursor-pointer",
        !available && "opacity-60",
      )}
    >
      <div
        className={clsx(
          "relative h-40 sm:h-44 bg-gradient-to-br flex items-center justify-center",
          product.imageColor,
        )}
      >
        <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">
          {product.imageIcon}
        </span>
        <button
          onClick={onWish}
          className={clsx(
            "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
            wishlisted
              ? "bg-red-500 opacity-100"
              : "bg-white/90 opacity-0 group-hover:opacity-100",
          )}
        >
          <Heart
            className={clsx(
              "h-3.5 w-3.5",
              wishlisted ? "fill-white text-white" : "text-slate-500",
            )}
          />
        </button>
        {disc > 0 && available && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
            -{disc}%
          </span>
        )}
        {product.featured && available && !disc && (
          <span className="absolute top-2.5 left-2.5 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded shadow">
            ⭐ Top Pick
          </span>
        )}
        {!available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-3.5">
        {product.brand && (
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5 truncate">
            {product.brand}
          </p>
        )}
        <p className="text-base font-semibold text-slate-800 leading-snug line-clamp-2 mb-2 group-hover:text-accent-600 transition-colors min-h-[2.75rem]">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5 bg-emerald-500 rounded px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-white leading-none">
              {getRating(product.id)}
            </span>
            <Star className="h-2.5 w-2.5 fill-white text-white" />
          </div>
          <span className="text-[10px] text-slate-400">
            ({getReviews(product.id).toLocaleString()})
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 flex-wrap mb-3">
          <span className="text-base sm:text-lg font-bold text-slate-900">
            {formatCurrency(product.price)}
          </span>
          {product.mrp > product.price && (
            <>
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(product.mrp)}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {disc}% off
              </span>
            </>
          )}
        </div>
        <button
          onClick={onAdd}
          disabled={!available}
          className={clsx(
            "w-full text-xs font-bold py-2.5 rounded-xl transition-all",
            added
              ? "bg-emerald-500 text-white shadow-sm"
              : available
                ? "bg-accent-500 text-white hover:bg-accent-600 shadow-sm hover:shadow-md active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-not-allowed",
          )}
        >
          {added ? "✓ Added!" : available ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
};

/* ── Service Card ─────────────────────────────────────────────────────────── */
const ServiceCard: React.FC<{ service: Service; onCardClick: () => void }> = ({
  service,
  onCardClick,
}) => {
  const label =
    service.priceType === "hourly"
      ? "/hr"
      : service.priceType === "starting_from"
        ? " onwards"
        : "";
  const initials = service.providerName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      onClick={onCardClick}
      className="bg-white rounded-2xl border border-slate-100/70 shadow-soft overflow-hidden hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
    >
      <div
        className={clsx(
          "h-32 bg-gradient-to-br flex items-center justify-center relative",
          service.imageColor,
        )}
      >
        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
          {service.imageIcon}
        </span>
        <span className="absolute top-2.5 left-2.5 bg-white/90 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
          {service.category}
        </span>
        {service.featured && (
          <span className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
            ⭐ Top Rated
          </span>
        )}
      </div>
      <div className="p-3 sm:p-3.5">
        <p className="text-base font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-violet-700 transition-colors">
          {service.title}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <div
            className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0",
              avatarColor(service.providerName),
            )}
          >
            {initials}
          </div>
          <span className="text-xs text-slate-500 truncate flex-1">
            {service.providerName}
          </span>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-0.5">
            <CheckCircle className="h-2.5 w-2.5" /> PRO
          </span>
        </div>
        {service.rating > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5 bg-emerald-500 rounded px-1.5 py-0.5">
              <span className="text-[10px] font-bold text-white leading-none">
                {service.rating.toFixed(1)}
              </span>
              <Star className="h-2.5 w-2.5 fill-white text-white" />
            </div>
            {service.reviewCount > 0 && (
              <span className="text-[10px] text-slate-400">
                ({service.reviewCount.toLocaleString()})
              </span>
            )}
            <span className="ml-auto text-[10px] text-slate-400">
              {service.deliveryTime}
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-1 mb-2.5">
          <span className="text-base font-bold text-violet-700">
            {formatCurrency(service.price)}
          </span>
          <span className="text-xs text-slate-400">{label}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCardClick();
          }}
          className="w-full text-xs font-bold py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 active:scale-95"
        >
          Book Now <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ── Section Header ───────────────────────────────────────────────────────── */
const SectionHeader: React.FC<{
  icon?: string;
  title: string;
  subtitle?: string;
  count?: number;
  onViewAll?: () => void;
  accent?: string;
  eyebrow?: string;
  eyebrowClass?: string;
}> = ({
  icon,
  title,
  subtitle,
  count,
  onViewAll,
  accent = "bg-brand-600",
  eyebrow,
  eyebrowClass = "text-brand-600",
}) => (
  <div className="flex items-end justify-between mb-6 sm:mb-8">
    <div className="flex items-stretch gap-3.5">
      <div className={`w-1.5 rounded-full flex-shrink-0 ${accent}`} />
      <div>
        {eyebrow && (
          <span className={clsx("eyebrow mb-1", eyebrowClass)}>{eyebrow}</span>
        )}
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-3xl">{icon}</span>}
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-none">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed max-w-xs sm:max-w-md">
            {subtitle}
          </p>
        )}
        {count !== undefined && !subtitle && (
          <p className="text-xs text-slate-400 mt-1.5">
            {count} item{count !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
    {onViewAll && (
      <button
        onClick={onViewAll}
        className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-white px-4 py-2 rounded-full border border-brand-200 hover:border-brand-700 hover:bg-brand-700 transition-all duration-200 hover:-translate-y-0.5 flex-shrink-0"
      >
        View All <ArrowRight className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

/* ── Stats Band ───────────────────────────────────────────────────────────── */
const StatsBand: React.FC<{
  products: number;
  stores: number;
  cities: number;
}> = ({ products, stores, cities }) => {
  const stats = [
    {
      icon: Package,
      value: `${products}+`,
      label: "Products",
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    ...(stores > 0
      ? [
          {
            icon: Store,
            value: `${stores}+`,
            label: "Verified Stores",
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
        ]
      : [
          {
            icon: CheckCircle,
            value: "Verified",
            label: "Trusted Sellers",
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
        ]),
    {
      icon: MapPin,
      value: `${cities}+`,
      label: "Cities Served",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: Headphones,
      value: "24/7",
      label: "Support",
      color: "text-accent-600",
      bg: "bg-orange-50",
    },
  ];
  return (
    <section className="bg-white py-5 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-2xl bg-white shadow-soft px-4 py-3.5 transition-transform hover:-translate-y-0.5"
            >
              <div
                className={clsx(
                  "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                  s.bg,
                )}
              >
                <s.icon
                  className={clsx("h-5 w-5", s.color)}
                  strokeWidth={2.25}
                />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-extrabold text-slate-900 leading-none tracking-tight">
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── Category Tabs ────────────────────────────────────────────────────────── */
const CategoryTabs: React.FC<{
  categories: { id: string; name: string; icon: string }[];
  active: string | null;
  onSelect: (id: string) => void;
}> = ({ categories, active, onSelect }) => (
  <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 mb-5">
    {categories.map((cat) => (
      <button
        key={cat.id}
        onClick={() => onSelect(cat.id)}
        className={clsx(
          "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 border hover:-translate-y-0.5",
          active === cat.id
            ? "bg-accent-500 text-white border-accent-500 shadow-md shadow-accent-500/25"
            : "bg-white border-slate-200 text-slate-600 hover:border-accent-300 hover:text-accent-600",
        )}
      >
        <CatIcon id={cat.id} className="h-4 w-4" fallback={cat.icon} />
        <span>{cat.name}</span>
      </button>
    ))}
  </div>
);

/* ── Landing Page ─────────────────────────────────────────────────────────── */
export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    services,
    stores,
    currentUser,
    addToCart,
    cart,
    homepageConfig,
  } = useAppStore();
  const { track } = useTracking();
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [city, setCity] = useState(currentUser?.city || "");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [query, setQuery] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [showOfferStrip, setShowOfferStrip] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Light blur + elevation once the page is scrolled past the top
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Product section tabs
  const validCategories = useMemo(
    () =>
      PRODUCT_CATEGORIES.filter((c) =>
        products.some(
          (p) => resolveCategoryId(p) === c.id && p.status === "active",
        ),
      ).slice(0, 6),
    [products],
  );
  const [trendingTab, setTrendingTab] = useState<string | null>(null);
  const [recTab, setRecTab] = useState<string | null>(null);

  const activeTab = (tab: string | null) =>
    tab ?? validCategories[0]?.id ?? null;
  const activeRecTab = (tab: string | null) =>
    tab ?? validCategories[1]?.id ?? validCategories[0]?.id ?? null;

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const avail = (item: Product | Service) =>
    !city ||
    item.availableCities.length === 0 ||
    item.availableCities.includes(city);

  const activeProducts = useMemo(
    () =>
      products
        .filter((p) => p.status === "active")
        .filter(
          (p) => !query || p.name.toLowerCase().includes(query.toLowerCase()),
        ),
    [products, query],
  );

  const trendingProducts = useMemo(() => {
    const cId = activeTab(trendingTab);
    return cId
      ? activeProducts.filter((p) => resolveCategoryId(p) === cId).slice(0, 10)
      : activeProducts.slice(0, 10);
  }, [activeProducts, trendingTab, validCategories]);

  const recProducts = useMemo(() => {
    const cId = activeRecTab(recTab);
    return cId
      ? activeProducts.filter((p) => resolveCategoryId(p) === cId).slice(0, 10)
      : activeProducts.slice(0, 10);
  }, [activeProducts, recTab, validCategories]);

  const bestDeals = useMemo(
    () =>
      activeProducts
        .filter((p) => p.mrp > p.price)
        .sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp)
        .slice(0, 4),
    [activeProducts],
  );

  const activeServices = useMemo(
    () =>
      services
        .filter((s) => s.status === "active")
        .filter(
          (s) =>
            !city ||
            s.availableCities.length === 0 ||
            s.availableCities.includes(city),
        ),
    [services, city],
  );

  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase()),
  );
  const activeMiniBanners =
    homepageConfig.miniBanners?.filter((b) => b.isActive) ?? [];
  const activeBrandLogos =
    homepageConfig.brandLogos?.filter((b) => b.isActive) ?? [];

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    // Guests: go to product page where they'll be prompted to login for purchase
    if (!currentUser) {
      navigate(`/shop/product/${product.id}`);
      return;
    }
    if (currentUser.role !== "customer") return;
    if (product.status !== "active" || !avail(product)) return;
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setWishlist((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const goProduct = (id: string) => {
    // Everyone (including guests and non-customer roles) can view product details
    navigate(`/shop/product/${id}`);
  };

  const goService = (id: string) => {
    // Everyone (including guests and non-customer roles) can view service details
    navigate(`/shop/service/${id}`);
  };

  const goDashboard = () => {
    if (!currentUser) return;
    navigate(
      currentUser.role === "admin"
        ? "/admin"
        : currentUser.role === "store_owner"
          ? "/store"
          : currentUser.role === "service_provider"
            ? "/service-provider"
            : currentUser.role === "agent"
              ? "/agent"
              : "/shop",
    );
  };

  const goAllProducts = (catId?: string) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    navigate(catId ? `/shop?cat=${catId}` : "/shop");
  };

  const goAllServices = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    navigate("/shop/services");
  };

  const handleSearch = (q: string) => {
    setQuery(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (q.trim().length >= 2)
      searchDebounce.current = setTimeout(
        () => track("search", { query: q.trim() }, "/"),
        800,
      );
  };

  return (
    <div className="min-h-screen bg-white pb-16 lg:pb-0">
      {/* ── Announcement Bar ─────────────────────────────────────────────── */}
      {homepageConfig.announcementBarActive &&
        homepageConfig.announcementBar && (
          <div className="bg-brand-900 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium tracking-wide">
            <span className="hidden sm:inline">
              {homepageConfig.announcementBar}
            </span>
            <span className="sm:hidden">
              {homepageConfig.announcementBar.slice(0, 60)}
              {homepageConfig.announcementBar.length > 60 ? "…" : ""}
            </span>
          </div>
        )}

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav
        className={clsx(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200/60"
            : "bg-white border-b border-slate-100",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center gap-4 sm:gap-6">
            {/* Logo */}
            <Link
              to="/"
              className="flex-shrink-0 transition-transform duration-200 hover:scale-[1.03]"
            >
              <AskIndiaLogo
                size={30}
                showText={true}
                textClass="text-base sm:text-lg"
              />
            </Link>

            {/* Search — dominant, with location selector inside */}
            <div className="flex-1 hidden sm:flex max-w-3xl items-center h-12 bg-white rounded-xl border border-slate-200 shadow-soft focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100 transition-all">
              {/* Location selector */}
              <button
                onClick={() => setShowCityPicker(true)}
                className="flex items-center gap-1.5 h-full pl-4 pr-3 text-sm text-slate-600 hover:text-brand-700 border-r border-slate-200 flex-shrink-0 transition-colors rounded-l-xl"
              >
                <MapPin className="h-4 w-4 text-accent-500" />
                <span className="max-w-[80px] truncate font-medium">
                  {city || "Select City"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
              {/* Search input */}
              <div className="flex-1 flex items-center gap-2.5 px-4">
                <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search products, stores or services..."
                  className="w-full bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-3 sm:gap-4 ml-auto flex-shrink-0">
              {/* Mobile search toggle */}
              <button
                onClick={() => setShowMobileSearch((v) => !v)}
                className="sm:hidden p-2 text-slate-500 hover:text-accent-600 transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>

              {currentUser ? (
                <>
                  <button
                    onClick={goDashboard}
                    className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-900 hover:text-accent-600 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Dashboard
                  </button>
                  {currentUser.role === "customer" && (
                    <button
                      onClick={() => navigate("/shop/cart")}
                      className="relative p-2 text-slate-600 hover:text-accent-600 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-accent-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-accent-600 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <LogIn className="h-4 w-4" /> Sign In
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setShowGetStarted(!showGetStarted)}
                      className="flex items-center gap-1 bg-accent-500 text-white text-sm font-bold px-4 sm:px-5 py-2 rounded-full hover:bg-accent-600 hover:scale-[1.03] active:scale-95 transition-all duration-200 shadow-sm shadow-accent-500/25"
                    >
                      Join <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    {showGetStarted && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowGetStarted(false)}
                        />
                        <div className="absolute right-0 top-11 z-20 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 w-52">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 pt-2 pb-1">
                            Join as
                          </p>
                          {[
                            {
                              to: "/register/store-owner",
                              icon: Store,
                              color: "bg-brand-100",
                              ic: "text-brand-700",
                              label: "Store Owner",
                              desc: "Sell products",
                            },
                            {
                              to: "/register/service-provider",
                              icon: Briefcase,
                              color: "bg-violet-100",
                              ic: "text-violet-700",
                              label: "Service Provider",
                              desc: "Offer services",
                            },
                          ].map(
                            ({ to, icon: Icon, color, ic, label, desc }) => (
                              <Link
                                key={to}
                                to={to}
                                onClick={() => setShowGetStarted(false)}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                              >
                                <div
                                  className={clsx(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    color,
                                  )}
                                >
                                  <Icon className={clsx("h-4 w-4", ic)} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {label}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {desc}
                                  </p>
                                </div>
                              </Link>
                            ),
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile search bar (expandable) */}
          {showMobileSearch && (
            <div className="sm:hidden pb-3">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search products, services..."
                  className="w-full pl-12 pr-4 py-2.5 rounded-full border border-slate-200 shadow-soft text-sm focus:outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-100 bg-white transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Category strip (desktop nav below navbar) */}
        <div className="hidden sm:block border-t border-slate-100 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-white hover:text-accent-600 transition-all flex-shrink-0 whitespace-nowrap"
              >
                🏠 Home
              </button>
              {PRODUCT_CATEGORIES.slice(0, 8).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => goAllProducts(cat.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-slate-600 hover:bg-white hover:text-accent-600 transition-all flex-shrink-0 whitespace-nowrap"
                >
                  <CatIcon
                    id={cat.id}
                    className="h-4 w-4"
                    fallback={cat.icon}
                  />{" "}
                  {cat.name}
                </button>
              ))}
              <button
                onClick={goAllServices}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-all flex-shrink-0 whitespace-nowrap"
              >
                🛠️ Services
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── City Picker Modal ─────────────────────────────────────────────── */}
      {showCityPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900">Choose Your City</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  See products available near you
                </p>
              </div>
              <button
                onClick={() => setShowCityPicker(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search city..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-accent-400"
                autoFocus
              />
            </div>
            {city && (
              <button
                onClick={() => {
                  setCity("");
                  setShowCityPicker(false);
                  setCitySearch("");
                }}
                className="w-full text-sm text-red-600 font-medium py-2 border border-red-200 rounded-xl mb-3 hover:bg-red-50 transition-colors"
              >
                ✕ Show All India
              </button>
            )}
            <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
              {filteredCities.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCity(c);
                    setShowCityPicker(false);
                    setCitySearch("");
                  }}
                  className={clsx(
                    "text-sm py-2.5 px-3 rounded-xl text-left font-medium transition-all",
                    city === c
                      ? "bg-accent-500 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Categories Sheet ───────────────────────────────────────── */}
      {showMobileCategories && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                All Categories
              </h3>
              <button
                onClick={() => setShowMobileCategories(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 p-4">
              {PRODUCT_CATEGORIES.map((cat) => {
                const ic = CATEGORY_ICONS[cat.id];
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      goAllProducts(cat.id);
                      setShowMobileCategories(false);
                    }}
                    className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-accent-50 transition-colors"
                  >
                    <div
                      className={clsx(
                        "w-14 h-14 rounded-full flex items-center justify-center text-3xl",
                        ic ? ic.bg : "",
                      )}
                    >
                      {ic ? (
                        <ic.Icon
                          className={clsx("h-7 w-7", ic.color)}
                          strokeWidth={2.25}
                        />
                      ) : (
                        cat.icon
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-800 text-center leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  goAllServices();
                  setShowMobileCategories(false);
                }}
                className="flex flex-col items-center gap-2 p-3 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
              >
                <span className="text-3xl">🛠️</span>
                <span className="text-xs font-medium text-violet-700 text-center leading-tight">
                  Services
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <HeroSection
        onExplore={() => goAllProducts()}
        onServices={goAllServices}
        onCategory={(catId) => goAllProducts(catId)}
      />

      {/* ── Stats Band ───────────────────────────────────────────────────── */}
      <StatsBand
        products={activeProducts.length}
        stores={stores.filter((s) => s.status === "active").length}
        cities={CITIES.length}
      />

      {/* ── Mini Banners ─────────────────────────────────────────────────── */}
      {activeMiniBanners.length > 0 && (
        <section className="bg-white py-4 sm:py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div
              className={clsx(
                "grid gap-3 sm:gap-4",
                activeMiniBanners.length >= 3
                  ? "grid-cols-1 sm:grid-cols-3"
                  : activeMiniBanners.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-1",
              )}
            >
              {activeMiniBanners.map((b) => (
                <div
                  key={b.id}
                  onClick={() => goAllProducts()}
                  className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group flex items-center gap-4"
                  style={{
                    background: `linear-gradient(135deg,${b.gradientFrom},${b.gradientTo})`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)",
                    }}
                  />
                  <span className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform relative">
                    {b.emoji}
                  </span>
                  <div className="flex-1 relative">
                    <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                      {b.title}
                    </h3>
                    <p className="text-white/80 text-xs mt-0.5">{b.subtitle}</p>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full relative whitespace-nowrap flex-shrink-0">
                    {b.ctaText} →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── City Filter Banner ───────────────────────────────────────────── */}
      {city && (
        <div className="bg-emerald-50 border-b border-emerald-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                Showing results for <strong>{city}</strong>
              </span>
            </div>
            <button
              onClick={() => setCity("")}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold transition-colors"
            >
              Show All ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Trending Products (with tabs) ────────────────────────────────── */}
      {homepageConfig.showTrendingSection && trendingProducts.length > 0 && (
        <section className="reveal-on-scroll bg-white py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader
              title="Trending Products"
              subtitle="What shoppers across India are loving this week — handpicked and fast-moving."
              onViewAll={goAllProducts}
              eyebrow="Hot right now"
            />
            {validCategories.length > 1 && (
              <CategoryTabs
                categories={validCategories}
                active={activeTab(trendingTab)}
                onSelect={setTrendingTab}
              />
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {trendingProducts.slice(0, 10).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  available={avail(p)}
                  added={addedId === p.id}
                  wishlisted={wishlist.has(p.id)}
                  onAdd={(e) => handleAddToCart(p, e)}
                  onClick={() => goProduct(p.id)}
                  onWish={(e) => handleWishlist(p.id, e)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Best Deals Section ───────────────────────────────────────────── */}
      {homepageConfig.showBestDeals && bestDeals.length > 0 && (
        <section className="reveal-on-scroll bg-gradient-to-b from-slate-50 to-white py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader
              title="Best Deals"
              subtitle="Limited-time offers on top-rated products — the biggest savings, ending soon."
              onViewAll={goAllProducts}
              eyebrow="Limited time"
            />
            <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
              {/* Left: premium promo card */}
              <div className="lg:col-span-1 relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between text-white min-h-[240px] lg:min-h-0 bg-gradient-to-br from-brand-800 via-brand-700 to-accent-600 shadow-soft">
                {/* background decoration */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-accent-400/25 blur-2xl" />
                <div className="absolute inset-0 dot-texture opacity-30" />
                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/15 backdrop-blur px-3 py-1 rounded-full mb-4">
                    🔥 Hot Deals
                  </span>
                  <h3 className="text-3xl font-bold leading-[1.05] mb-2">
                    Up to
                    <br />
                    70% Off
                  </h3>
                  <p className="text-white/75 text-sm leading-relaxed">
                    Grab the best prices before they're gone.
                  </p>
                  {/* Countdown timer (placeholder) */}
                  <div className="mt-5">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/60 mb-2">
                      Ends in
                    </p>
                    <div className="flex items-center gap-1.5">
                      {["12", "45", "30"].map((t, i) => (
                        <React.Fragment key={i}>
                          <span className="bg-white/15 backdrop-blur rounded-lg px-2.5 py-1.5 text-lg font-bold tabular-nums">
                            {t}
                          </span>
                          {i < 2 && (
                            <span className="font-bold text-white/50">:</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => goAllProducts()}
                  className="relative mt-6 bg-white text-brand-800 font-bold text-sm px-4 py-3 rounded-xl hover:bg-slate-50 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 justify-center shadow-sm"
                >
                  Shop All Deals <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {/* Right: products */}
              <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                {bestDeals.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    available={avail(p)}
                    added={addedId === p.id}
                    wishlisted={wishlist.has(p.id)}
                    onAdd={(e) => handleAddToCart(p, e)}
                    onClick={() => goProduct(p.id)}
                    onWish={(e) => handleWishlist(p.id, e)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter (email capture) ───────────────────────────────────── */}
      {homepageConfig.showNewsletter && (
        <section className="reveal-on-scroll bg-brand-900 py-10 sm:py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <span className="text-4xl mb-4 block">📧</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {homepageConfig.newsletterTitle}
            </h2>
            <p className="text-brand-300 text-sm sm:text-base mb-6">
              {homepageConfig.newsletterSubtitle}
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                className="flex-1 bg-brand-800 text-white placeholder-brand-400 text-sm px-4 py-3 rounded-xl border border-brand-700 focus:outline-none focus:border-accent-400 transition-colors"
                placeholder="Enter your email address"
              />
              <button className="bg-accent-500 hover:bg-accent-600 text-white font-bold px-5 sm:px-7 py-3 rounded-xl transition-colors text-sm whitespace-nowrap shadow-sm">
                Subscribe
              </button>
            </div>
            <p className="text-brand-400 text-xs mt-3">
              No spam, unsubscribe anytime. By subscribing you agree to our
              Privacy Policy.
            </p>
          </div>
        </section>
      )}

      {/* ── Promo Banners ────────────────────────────────────────────────── */}
      <section className="bg-white py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 gap-3 sm:gap-4">
          <div
            onClick={() => goAllProducts()}
            className="relative bg-gradient-to-r from-brand-800 to-brand-600 rounded-2xl p-5 sm:p-6 overflow-hidden text-white flex items-center gap-4 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
          >
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 90% 50%, white 0%, transparent 60%)",
              }}
            />
            <div className="text-4xl sm:text-5xl flex-shrink-0 group-hover:scale-110 transition-transform relative">
              💎
            </div>
            <div className="flex-1 relative">
              <p className="text-[10px] sm:text-xs font-bold bg-white/20 inline-flex px-2.5 py-0.5 rounded-full mb-1.5">
                Premium Selection
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold leading-tight mb-0.5">
                Top Brands, Best Prices
              </h3>
              <p className="text-white/75 text-xs">
                Genuine products from verified sellers
              </p>
            </div>
            <ArrowRight className="h-5 w-5 flex-shrink-0 opacity-70 relative" />
          </div>
          <div
            onClick={goAllServices}
            className="relative bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-5 sm:p-6 overflow-hidden text-white flex items-center gap-4 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
          >
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 90% 50%, white 0%, transparent 60%)",
              }}
            />
            <div className="text-4xl sm:text-5xl flex-shrink-0 group-hover:scale-110 transition-transform relative">
              🛠️
            </div>
            <div className="flex-1 relative">
              <p className="text-[10px] sm:text-xs font-bold bg-white/20 inline-flex px-2.5 py-0.5 rounded-full mb-1.5">
                Trusted Professionals
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold leading-tight mb-0.5">
                Services from ₹99
              </h3>
              <p className="text-white/75 text-xs">
                Home repair, tutoring, beauty & more
              </p>
            </div>
            <ArrowRight className="h-5 w-5 flex-shrink-0 opacity-70 relative" />
          </div>
        </div>
      </section>

      {/* ── Collection List (Category Circles) ───────────────────────────── */}
      {homepageConfig.showCollectionList && (
        <section className="reveal-on-scroll bg-gradient-to-b from-slate-50 to-white py-7 sm:py-8 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader
              title="Shop by Category"
              subtitle="Explore everything you need across ten curated categories."
              onViewAll={goAllProducts}
              eyebrow="Browse"
            />
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-10 justify-items-center pt-2">
              {PRODUCT_CATEGORIES.map((cat) => {
                const count = products.filter(
                  (p) =>
                    resolveCategoryId(p) === cat.id && p.status === "active",
                ).length;
                const ic = CATEGORY_ICONS[cat.id];
                return (
                  <button
                    key={cat.id}
                    onClick={() => goAllProducts(cat.id)}
                    className="flex flex-col items-center gap-3 group w-full"
                  >
                    <div
                      className={clsx(
                        "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-soft group-hover:scale-110 group-hover:shadow-lg transition-all duration-300",
                        ic
                          ? `bg-gradient-to-br ${ic.grad}`
                          : "bg-white text-3xl",
                      )}
                    >
                      {ic ? (
                        <ic.Icon
                          className="h-7 w-7 sm:h-9 sm:w-9 text-white"
                          strokeWidth={2.25}
                        />
                      ) : (
                        cat.icon
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                        {cat.name}
                      </p>
                      {count > 0 && (
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium">
                          {count} items
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust Strip ──────────────────────────────────────────────────── */}
      {homepageConfig.showTrustBadges && (
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
              {TRUST_BADGES.map(({ icon: Icon, label, desc, color, bg }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 flex-shrink-0 px-3 sm:px-4 first:pl-0 last:pr-0 border-r border-slate-100 last:border-0"
                >
                  <div
                    className={clsx(
                      "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                      bg,
                    )}
                  >
                    <Icon className={clsx("h-4 w-4", color)} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap">
                      {label}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Recommended For You (with tabs) ──────────────────────────────── */}
      {recProducts.length > 0 && (
        <section className="reveal-on-scroll bg-white py-7 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader
              title="Recommended For You"
              onViewAll={goAllProducts}
              eyebrow="Picked for you"
            />
            {validCategories.length > 1 && (
              <CategoryTabs
                categories={validCategories}
                active={activeRecTab(recTab)}
                onSelect={setRecTab}
              />
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {recProducts.slice(0, 10).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  available={avail(p)}
                  added={addedId === p.id}
                  wishlisted={wishlist.has(p.id)}
                  onAdd={(e) => handleAddToCart(p, e)}
                  onClick={() => goProduct(p.id)}
                  onWish={(e) => handleWishlist(p.id, e)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Services Section ─────────────────────────────────────────────── */}
      {homepageConfig.showServices && (
        <section className="reveal-on-scroll bg-gradient-to-b from-slate-50 to-white py-7 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader
              title={`Services ${city ? `in ${city}` : "Near You"}`}
              count={activeServices.length}
              onViewAll={activeServices.length > 0 ? goAllServices : undefined}
              accent="bg-violet-500"
              eyebrow="Local pros"
              eyebrowClass="text-violet-600"
            />

            {activeServices.length === 0 && services.length === 0 ? (
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-8 border border-violet-100">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                  {SERVICE_CATEGORIES.slice(0, 10).map((cat) => (
                    <div
                      key={cat.id}
                      className="flex flex-col items-center gap-2.5 p-4 bg-white rounded-xl border border-violet-100 text-center hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <span className="text-4xl">{cat.icon}</span>
                      <span className="text-sm font-semibold text-slate-700 leading-tight">
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-slate-800 mb-1">
                    Services Coming to Your Area
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    Book verified local service providers for home repairs,
                    cleaning, tutoring & more.
                  </p>
                  <Link
                    to="/register/service-provider"
                    className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 text-sm shadow-sm"
                  >
                    <Briefcase className="h-4 w-4" /> Offer Your Services Here
                  </Link>
                </div>
              </div>
            ) : activeServices.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-3xl mb-2">📍</p>
                <p className="text-base font-semibold text-slate-700">
                  No services in {city} yet.
                </p>
                <Link
                  to="/register/service-provider"
                  className="text-sm text-violet-600 font-medium hover:underline mt-2 inline-block"
                >
                  Be the first →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeServices.slice(0, 8).map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    onCardClick={() => goService(s.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Top Stores ───────────────────────────────────────────────────── */}
      {homepageConfig.showStores &&
        stores.filter((s) => s.status === "active").length > 0 && (
          <section className="reveal-on-scroll bg-white py-7 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <SectionHeader
                title="Top Stores"
                onViewAll={() => {
                  if (!currentUser) {
                    navigate("/login");
                    return;
                  }
                  navigate("/shop/stores");
                }}
                accent="bg-amber-500"
                eyebrow="Featured"
                eyebrowClass="text-amber-600"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {stores
                  .filter((s) => s.status === "active")
                  .slice(0, 5)
                  .map((store) => {
                    const isP = (store.storeType ?? "product") === "product";
                    return (
                      <div
                        key={store.id}
                        onClick={() => {
                          if (!currentUser) {
                            navigate("/login");
                            return;
                          }
                          navigate(`/shop/store/${store.slug}`);
                        }}
                        className="bg-white rounded-2xl border border-slate-100/70 shadow-soft overflow-hidden hover:-translate-y-0.5 transition-all group cursor-pointer"
                      >
                        <div
                          className="h-20 relative"
                          style={{
                            background: `linear-gradient(135deg,${store.themeColor}ee,${store.themeColor}88)`,
                          }}
                        >
                          <div
                            className="absolute inset-0 opacity-10"
                            style={{
                              backgroundImage:
                                "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
                            }}
                          />
                          <div className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-slate-700 flex items-center gap-0.5">
                            {isP ? (
                              <>
                                <Package className="h-2 w-2" /> Products
                              </>
                            ) : (
                              <>
                                <Briefcase className="h-2 w-2" /> Services
                              </>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-3 translate-y-1/2 w-11 h-11 rounded-xl bg-white shadow-md flex items-center justify-center text-2xl border-2 border-white">
                            {store.logo}
                          </div>
                        </div>
                        <div className="pt-8 px-3 pb-3">
                          <p className="text-sm font-bold text-slate-900 leading-tight truncate group-hover:text-accent-600 transition-colors">
                            {store.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5 mb-2">
                            {store.tagline}
                          </p>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5 text-slate-400" />
                            <span className="text-[10px] text-slate-400">
                              {store.city}
                            </span>
                            <span className="ml-auto text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                              ✓ Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>
        )}

      {/* ── Brand Logos Strip ────────────────────────────────────────────── */}
      {homepageConfig.showBrandLogos && activeBrandLogos.length > 0 && (
        <section className="reveal-on-scroll bg-slate-50 border-y border-slate-100 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-5">
              Trusted Brands on AskIndia
            </p>
            <div className="flex items-center justify-center gap-6 sm:gap-10 overflow-x-auto scrollbar-hide flex-wrap">
              {activeBrandLogos.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
                >
                  <span className="text-2xl sm:text-3xl">{b.emoji}</span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-600 tracking-tight">
                    {b.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Seller CTA ───────────────────────────────────────────────────── */}
      {homepageConfig.showSellerCta && !currentUser && (
        <section className="reveal-on-scroll bg-white py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 shadow-soft grid lg:grid-cols-2">
              {/* Left: illustration panel */}
              <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-violet-700 p-10 lg:p-12 flex items-center justify-center min-h-[300px]">
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-accent-400/25 blur-3xl" />
                <div className="absolute inset-0 dot-texture opacity-30" />
                <div className="relative grid grid-cols-2 gap-4 sm:gap-5">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white shadow-xl flex items-center justify-center text-5xl ai-float">🏪</div>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white shadow-xl flex items-center justify-center text-5xl ai-float mt-8" style={{ animationDelay: ".8s" }}>🛠️</div>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white shadow-xl flex items-center justify-center text-5xl ai-float -mt-2" style={{ animationDelay: "1.4s" }}>📦</div>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white shadow-xl flex items-center justify-center text-5xl ai-float" style={{ animationDelay: ".4s" }}>💰</div>
                </div>
              </div>
              {/* Right: content */}
              <div className="p-8 sm:p-12 flex flex-col justify-center">
                <span className="eyebrow text-accent-600 mb-3">Join the platform</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-3">
                  Grow with AskIndia
                </h2>
                <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-md">
                  Join thousands of sellers and service providers earning on India's unified marketplace.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      gr: "from-brand-700 to-brand-500",
                      icon: Store,
                      title: "Open Your Store",
                      desc: "Launch a branded storefront & earn commission.",
                      link: "/register/store-owner",
                    },
                    {
                      gr: "from-violet-600 to-purple-600",
                      icon: Briefcase,
                      title: "List Your Services",
                      desc: "Offer your skills to customers across your city.",
                      link: "/register/service-provider",
                    },
                  ].map(({ gr, icon: Icon, title, desc, link }) => (
                    <Link
                      key={link}
                      to={link}
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-transparent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0", gr)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-slate-900">{title}</p>
                        <p className="text-xs sm:text-sm text-slate-500 truncate">{desc}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-accent-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* First-order offer */}
          {!currentUser && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent-500 via-accent-600 to-accent-500 px-6 py-5 mb-10 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3 text-white">
                <Gift className="h-6 w-6 flex-shrink-0 hidden sm:block" />
                <p className="text-sm sm:text-base font-semibold">
                  <span className="font-extrabold">20% OFF</span> your first order
                  {" — use code "}
                  <span className="font-mono font-bold bg-white/20 rounded px-1.5 py-0.5 tracking-wide">
                    WELCOME20
                  </span>
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-1.5 bg-white text-accent-600 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-accent-50 transition-all hover:-translate-y-0.5 flex-shrink-0"
              >
                Claim offer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Top: brand · newsletter · app */}
          <div className="grid gap-8 lg:grid-cols-12 pb-9 border-b border-white/10">
            {/* Brand + social */}
            <div className="lg:col-span-4">
              <AskIndiaLogo size={32} showText textClass="text-lg" tone="light" />
              <p className="text-slate-400 text-sm leading-relaxed mt-4 mb-5 max-w-xs">
                India's unified marketplace for products & services — empowering
                local businesses to grow digitally.
              </p>
              <div className="flex items-center gap-2.5">
                {(
                  [
                    { Icon: Facebook, href: env.social.facebook, label: "Facebook" },
                    { Icon: Instagram, href: env.social.instagram, label: "Instagram" },
                    { Icon: Twitter, href: env.social.twitter, label: "Twitter" },
                    { Icon: Youtube, href: env.social.youtube, label: "YouTube" },
                  ] as const
                ).map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-accent-500 text-slate-300 hover:text-white flex items-center justify-center transition-all hover:-translate-y-0.5"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-4">
              <p className="text-white text-sm font-bold mb-2">Stay in the loop</p>
              <p className="text-slate-400 text-sm mb-4">
                New arrivals, festive offers & the latest updates.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-white/5 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-full border border-white/10 focus:outline-none focus:border-accent-400 transition-colors"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="bg-accent-500 hover:bg-accent-600 text-white rounded-full w-11 h-11 flex items-center justify-center flex-shrink-0 transition-all hover:-translate-y-0.5"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* App download */}
            <div className="lg:col-span-4">
              <p className="text-white text-sm font-bold mb-3">Get the app</p>
              <div className="flex flex-wrap gap-3">
                {["App Store", "Google Play"].map((store) => (
                  <a
                    key={store}
                    href="#"
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 transition-all hover:-translate-y-0.5"
                  >
                    <Smartphone className="h-5 w-5 text-white flex-shrink-0" />
                    <div className="leading-tight text-left">
                      <p className="text-[10px] text-slate-400">Download on</p>
                      <p className="text-sm font-bold text-white">{store}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 py-9 border-b border-white/10">
            {(
              [
                { title: "Marketplace", links: ["All Products", "All Services", "Browse Stores", "Top Deals", "New Arrivals"] },
                { title: "For Sellers", links: ["Open a Store", "List Services", "Become an Agent", "Seller Guide", "Commission Rates"] },
                { title: "Company", links: ["About Us", "Careers", "Blog", "Privacy Policy", "Terms of Use", "Contact Us"] },
              ] as const
            ).map((col) => (
              <div key={col.title}>
                <p className="text-white text-sm font-bold mb-4">{col.title}</p>
                <div className="space-y-3">
                  {col.links.map((l) => (
                    <a
                      key={l}
                      href="#"
                      className="block text-slate-400 text-sm hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} AskIndia Technologies Pvt. Ltd. · Made
              with ❤️ in India 🇮🇳
            </p>
            <div className="flex items-center gap-5">
              <a href={env.legal.privacy} className="text-slate-400 text-xs hover:text-white transition-colors">Privacy</a>
              <a href={env.legal.terms} className="text-slate-400 text-xs hover:text-white transition-colors">Terms</a>
              <a href="/sitemap.xml" className="text-slate-400 text-xs hover:text-white transition-colors">Sitemap</a>
              <a href={env.legal.refund} className="text-slate-400 text-xs hover:text-white transition-colors">Refund Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile Bottom Navigation (visible even when not logged in) ────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-16 max-w-lg mx-auto">
          {[
            {
              icon: Home,
              label: "Home",
              action: () => navigate("/"),
              active: true,
            },
            {
              icon: LayoutGrid,
              label: "Categories",
              action: () => setShowMobileCategories(true),
              active: false,
            },
            {
              icon: ShoppingBag,
              label: "Cart",
              action: () =>
                currentUser?.role === "customer"
                  ? navigate("/shop/cart")
                  : currentUser
                    ? goDashboard()
                    : navigate("/login"),
              active: false,
              badge: currentUser?.role === "customer" ? cartCount : 0,
            },
            {
              icon: User,
              label: currentUser ? "Account" : "Sign In",
              action: () => (currentUser ? goDashboard() : navigate("/login")),
              active: false,
            },
            {
              icon: SlidersHorizontal,
              label: "More",
              action: () => setShowMobileCategories(true),
              active: false,
            },
          ].map(({ icon: Icon, label, action, badge }) => (
            <button
              key={label}
              onClick={action}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-accent-500 active:text-accent-600 transition-colors"
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {!!badge && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-accent-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
