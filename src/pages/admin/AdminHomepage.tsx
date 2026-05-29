import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import type { HeroSlide, MiniBanner, BrandLogo } from '../../types';
import {
  Globe, Plus, Trash2, Edit3, Eye, EyeOff, ChevronUp, ChevronDown,
  Megaphone, CheckCircle, X, Image, Layout, Package, Briefcase, Store,
  Star, Users, Save, Tag, Zap, Mail, Award, TrendingUp, ShoppingBag,
  Grid3X3, ToggleLeft, ToggleRight,
} from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

const GRADIENT_PRESETS = [
  { label: 'Deep Indigo', from: '#1e1b4b', to: '#4338ca' },
  { label: 'Ocean Teal', from: '#134e4a', to: '#0891b2' },
  { label: 'Sunrise Orange', from: '#7c2d12', to: '#ea580c' },
  { label: 'Emerald Forest', from: '#052e16', to: '#059669' },
  { label: 'Purple Dusk', from: '#3b0764', to: '#9333ea' },
  { label: 'Rose Gold', from: '#4c0519', to: '#e11d48' },
  { label: 'Midnight Blue', from: '#0f172a', to: '#2563eb' },
  { label: 'Amber Glow', from: '#431407', to: '#d97706' },
];

const MINI_GRADIENT_PRESETS = [
  { label: 'Navy Blue', from: '#0d1f6e', to: '#1a3baa' },
  { label: 'Orange Flame', from: '#c2540a', to: '#f97316' },
  { label: 'Violet Pro', from: '#4c1d95', to: '#7c3aed' },
  { label: 'Teal Fresh', from: '#134e4a', to: '#0d9488' },
  { label: 'Rose Red', from: '#881337', to: '#f43f5e' },
  { label: 'Cyan Sky', from: '#0c4a6e', to: '#0284c7' },
  { label: 'Amber Gold', from: '#78350f', to: '#f59e0b' },
  { label: 'Slate Dark', from: '#0f172a', to: '#475569' },
];

const EMOJI_SUGGESTIONS = ['🛍️', '🏠', '🏪', '🚀', '💎', '⚡', '🎯', '🌟', '💰', '🔥', '🎁', '📱', '👗', '🍕', '🎸'];
const BANNER_EMOJI_SUGGESTIONS = ['📱', '🎧', '📷', '💻', '🎮', '👟', '👗', '🏠', '🍳', '📚', '💄', '⌚', '🎒', '🛒', '🔌'];
const BRAND_EMOJI_SUGGESTIONS = ['📱', '🍎', '🎵', '🔴', '🎯', '📺', '📷', '⚡', '🌊', '🏔️', '🦁', '🐉', '💡', '🔵', '🌿'];

const DEFAULT_SLIDE: Omit<HeroSlide, 'id'> = {
  title: 'New Slide Title\nAdd Your Subtitle Here',
  subtitle: 'Describe what this slide is about. Keep it short and impactful.',
  ctaText: 'Get Started',
  ctaLink: '/register/customer',
  secondaryCtaText: '',
  secondaryCtaLink: '',
  gradientFrom: '#1e1b4b',
  gradientTo: '#4338ca',
  badge: '✨ New',
  imageEmoji: '🛍️',
  isActive: true,
};

const DEFAULT_MINI_BANNER: Omit<MiniBanner, 'id'> = {
  title: 'New Category',
  subtitle: 'Best deals await',
  emoji: '📱',
  gradientFrom: '#0d1f6e',
  gradientTo: '#1a3baa',
  ctaText: 'Shop Now',
  link: '/shop',
  isActive: true,
};

// ─────────────────────────────────────────────────────────────────────────────
//  GradientPicker (reusable)
// ─────────────────────────────────────────────────────────────────────────────
const GradientPicker: React.FC<{
  from: string; to: string;
  onChange: (from: string, to: string) => void;
  presets?: { label: string; from: string; to: string }[];
}> = ({ from, to, onChange, presets = GRADIENT_PRESETS }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2">
        <input type="color" value={from} onChange={e => onChange(e.target.value, to)}
          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
        <div>
          <p className="text-xs text-slate-500">From</p>
          <input className="input text-xs font-mono w-28 py-1" value={from}
            onChange={e => onChange(e.target.value, to)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={to} onChange={e => onChange(from, e.target.value)}
          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
        <div>
          <p className="text-xs text-slate-500">To</p>
          <input className="input text-xs font-mono w-28 py-1" value={to}
            onChange={e => onChange(from, e.target.value)} />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-2">
      {presets.map(p => (
        <button
          key={p.label}
          onClick={() => onChange(p.from, p.to)}
          className="relative rounded-xl h-10 overflow-hidden border-2 border-transparent hover:border-white hover:scale-105 transition-all shadow-sm"
          style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
          title={p.label}
        >
          {from === p.from && to === p.to && (
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white drop-shadow" />
            </div>
          )}
        </button>
      ))}
    </div>
    {/* live preview strip */}
    <div className="h-6 rounded-lg" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  EmojiPicker (reusable)
// ─────────────────────────────────────────────────────────────────────────────
const EmojiPicker: React.FC<{
  value: string; onChange: (v: string) => void; suggestions?: string[];
}> = ({ value, onChange, suggestions = EMOJI_SUGGESTIONS }) => (
  <div className="flex items-center gap-3">
    <input className="input text-xl w-20 text-center font-bold" value={value}
      onChange={e => onChange(e.target.value)} placeholder="🛍️" />
    <div className="flex flex-wrap gap-1.5 flex-1">
      {suggestions.map(em => (
        <button key={em} onClick={() => onChange(em)}
          className={clsx('w-9 h-9 text-xl rounded-lg border-2 transition-all hover:scale-110',
            value === em ? 'border-accent-400 bg-accent-50' : 'border-slate-200 hover:border-accent-300'
          )}>
          {em}
        </button>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Toggle Row
// ─────────────────────────────────────────────────────────────────────────────
const ToggleRow: React.FC<{
  icon: React.ElementType; iconBg: string; iconColor: string;
  label: string; desc: string; active: boolean; onToggle: () => void;
}> = ({ icon: Icon, iconBg, iconColor, label, desc, active, onToggle }) => (
  <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
    <div className="flex items-center gap-3">
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
        <Icon className={clsx('h-4 w-4', iconColor)} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </div>
    <button onClick={onToggle} className="flex items-center gap-2 text-sm font-medium transition-colors flex-shrink-0">
      {active
        ? <><ToggleRight className="h-7 w-7 text-accent-500" /><span className="text-accent-500 text-xs w-5">On</span></>
        : <><ToggleLeft className="h-7 w-7 text-slate-400" /><span className="text-slate-400 text-xs w-5">Off</span></>
      }
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Slide Preview + Editor
// ─────────────────────────────────────────────────────────────────────────────
const SlidePreview: React.FC<{ slide: HeroSlide | Omit<HeroSlide, 'id'> }> = ({ slide }) => (
  <div className="relative rounded-xl overflow-hidden p-5 min-h-[140px] flex flex-col justify-between"
    style={{ background: `linear-gradient(135deg, ${slide.gradientFrom} 0%, ${slide.gradientTo} 100%)` }}>
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
      style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        {slide.badge && (
          <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5 text-[10px] text-white font-bold mb-2">
            {slide.badge}
          </div>
        )}
        <h3 className="text-white font-bold text-sm leading-snug whitespace-pre-line">{slide.title || 'Untitled Slide'}</h3>
        <p className="text-white/70 text-xs mt-1 line-clamp-2">{slide.subtitle}</p>
      </div>
      {slide.imageEmoji && <div className="text-4xl flex-shrink-0">{slide.imageEmoji}</div>}
    </div>
    <div className="flex gap-2 mt-3">
      {slide.ctaText && (
        <div className="bg-white/90 text-slate-800 text-[10px] font-bold px-3 py-1 rounded-lg">{slide.ctaText}</div>
      )}
      {slide.secondaryCtaText && (
        <div className="bg-white/20 border border-white/30 text-white text-[10px] font-bold px-3 py-1 rounded-lg">{slide.secondaryCtaText}</div>
      )}
    </div>
  </div>
);

const SlideEditor: React.FC<{
  slide: HeroSlide | Omit<HeroSlide, 'id'>;
  onChange: (patch: Partial<HeroSlide>) => void;
  onSave: () => void; onCancel: () => void; isNew?: boolean;
}> = ({ slide, onChange, onSave, onCancel, isNew }) => (
  <div className="space-y-5">
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Live Preview</p>
      <SlidePreview slide={slide} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Title <span className="text-slate-400 font-normal">(use \n for line break)</span>
        </label>
        <textarea className="input h-20 resize-none text-sm" value={slide.title}
          onChange={e => onChange({ title: e.target.value })} placeholder="Products & Services,\nAll in One Place" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Subtitle</label>
        <textarea className="input h-20 resize-none text-sm" value={slide.subtitle}
          onChange={e => onChange({ subtitle: e.target.value })} placeholder="Short description..." />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Badge Text <span className="text-slate-400 font-normal">(optional)</span></label>
      <input className="input text-sm" value={slide.badge ?? ''} onChange={e => onChange({ badge: e.target.value })} placeholder="✨ India's Unified Marketplace" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary CTA Text</label>
        <input className="input text-sm" value={slide.ctaText} onChange={e => onChange({ ctaText: e.target.value })} placeholder="Shop Now" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary CTA Link</label>
        <input className="input text-sm font-mono" value={slide.ctaLink} onChange={e => onChange({ ctaLink: e.target.value })} placeholder="/register/customer" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Secondary CTA <span className="text-slate-400 font-normal">(optional)</span></label>
        <input className="input text-sm" value={slide.secondaryCtaText ?? ''} onChange={e => onChange({ secondaryCtaText: e.target.value })} placeholder="Learn More" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Secondary CTA Link</label>
        <input className="input text-sm font-mono" value={slide.secondaryCtaLink ?? ''} onChange={e => onChange({ secondaryCtaLink: e.target.value })} placeholder="/register/store-owner" />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Slide Emoji</label>
      <EmojiPicker value={slide.imageEmoji ?? ''} onChange={v => onChange({ imageEmoji: v })} />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Background Gradient</label>
      <GradientPicker from={slide.gradientFrom} to={slide.gradientTo}
        onChange={(f, t) => onChange({ gradientFrom: f, gradientTo: t })} />
    </div>
    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
      <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
      <button onClick={onSave} className="btn-primary text-sm flex items-center gap-2">
        <Save className="h-4 w-4" /> {isNew ? 'Add Slide' : 'Save Changes'}
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Mini Banner Preview + Editor
// ─────────────────────────────────────────────────────────────────────────────
const MiniBannerPreview: React.FC<{ banner: Partial<MiniBanner> }> = ({ banner }) => (
  <div className="relative rounded-xl overflow-hidden p-4 flex items-center gap-3"
    style={{ background: `linear-gradient(135deg, ${banner.gradientFrom ?? '#0d1f6e'} 0%, ${banner.gradientTo ?? '#1a3baa'} 100%)` }}>
    <span className="text-4xl flex-shrink-0">{banner.emoji || '📱'}</span>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-white text-sm truncate">{banner.title || 'Category Name'}</p>
      <p className="text-white/70 text-xs truncate">{banner.subtitle || 'Best deals await'}</p>
    </div>
    <div className="bg-white/20 border border-white/30 text-white text-[10px] font-bold px-3 py-1 rounded-full flex-shrink-0">
      {banner.ctaText || 'Shop Now'}
    </div>
  </div>
);

const MiniBannerEditor: React.FC<{
  banner: Partial<MiniBanner>;
  onChange: (patch: Partial<MiniBanner>) => void;
  onSave: () => void; onCancel: () => void; isNew?: boolean;
}> = ({ banner, onChange, onSave, onCancel, isNew }) => (
  <div className="space-y-4">
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Live Preview</p>
      <MiniBannerPreview banner={banner} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Category Title</label>
        <input className="input text-sm" value={banner.title ?? ''} onChange={e => onChange({ title: e.target.value })} placeholder="Smartphones" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Subtitle</label>
        <input className="input text-sm" value={banner.subtitle ?? ''} onChange={e => onChange({ subtitle: e.target.value })} placeholder="Up to 40% off" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">CTA Button Text</label>
        <input className="input text-sm" value={banner.ctaText ?? ''} onChange={e => onChange({ ctaText: e.target.value })} placeholder="Shop Now" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Link URL</label>
        <input className="input text-sm font-mono" value={banner.link ?? ''} onChange={e => onChange({ link: e.target.value })} placeholder="/shop" />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Banner Emoji</label>
      <EmojiPicker value={banner.emoji ?? ''} onChange={v => onChange({ emoji: v })} suggestions={BANNER_EMOJI_SUGGESTIONS} />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Background Gradient</label>
      <GradientPicker from={banner.gradientFrom ?? '#0d1f6e'} to={banner.gradientTo ?? '#1a3baa'}
        onChange={(f, t) => onChange({ gradientFrom: f, gradientTo: t })} presets={MINI_GRADIENT_PRESETS} />
    </div>
    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
      <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
      <button onClick={onSave} className="btn-primary text-sm flex items-center gap-2">
        <Save className="h-4 w-4" /> {isNew ? 'Add Banner' : 'Save Changes'}
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Main AdminHomepage
// ─────────────────────────────────────────────────────────────────────────────
export const AdminHomepage: React.FC = () => {
  const {
    homepageConfig, updateHomepageConfig,
    addHeroSlide, updateHeroSlide, deleteHeroSlide, reorderHeroSlides,
  } = useAppStore();

  const [saved, setSaved] = useState(false);

  // announcement
  const [announcementText, setAnnouncementText] = useState(homepageConfig.announcementBar);

  // hero slide state
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [addingSlide, setAddingSlide] = useState(false);
  const [newSlide, setNewSlide] = useState<Omit<HeroSlide, 'id'>>(DEFAULT_SLIDE);

  // mini banner state
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<Partial<MiniBanner> | null>(null);
  const [addingBanner, setAddingBanner] = useState(false);
  const [newBanner, setNewBanner] = useState<Partial<MiniBanner>>(DEFAULT_MINI_BANNER);

  // newsletter state
  const [newsletterTitle, setNewsletterTitle] = useState(homepageConfig.newsletterTitle);
  const [newsletterSubtitle, setNewsletterSubtitle] = useState(homepageConfig.newsletterSubtitle);

  // brand logo add state
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandEmoji, setNewBrandEmoji] = useState('📱');

  const triggerSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  // ─── Announcement ────────────────────────────────────────────────────────
  const handleSaveAnnouncement = () => {
    updateHomepageConfig({ announcementBar: announcementText });
    triggerSaved();
  };

  // ─── Hero Slides ────────────────────────────────────────────────────────
  const handleAddSlide = () => {
    addHeroSlide(newSlide);
    setAddingSlide(false);
    setNewSlide(DEFAULT_SLIDE);
    triggerSaved();
  };
  const handleSaveSlide = () => {
    if (!editingSlideId || !editingSlide) return;
    updateHeroSlide(editingSlideId, editingSlide);
    setEditingSlideId(null); setEditingSlide(null);
    triggerSaved();
  };
  const handleMoveSlide = (idx: number, dir: 'up' | 'down') => {
    const slides = [...homepageConfig.heroSlides];
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= slides.length) return;
    [slides[idx], slides[newIdx]] = [slides[newIdx], slides[idx]];
    reorderHeroSlides(slides);
  };

  // ─── Mini Banners ────────────────────────────────────────────────────────
  const handleAddBanner = () => {
    const banner: MiniBanner = {
      id: Date.now().toString(),
      title: newBanner.title ?? 'New Category',
      subtitle: newBanner.subtitle ?? 'Best deals await',
      emoji: newBanner.emoji ?? '📱',
      gradientFrom: newBanner.gradientFrom ?? '#0d1f6e',
      gradientTo: newBanner.gradientTo ?? '#1a3baa',
      ctaText: newBanner.ctaText ?? 'Shop Now',
      link: newBanner.link ?? '/shop',
      isActive: true,
    };
    updateHomepageConfig({ miniBanners: [...homepageConfig.miniBanners, banner] });
    setAddingBanner(false); setNewBanner(DEFAULT_MINI_BANNER);
    triggerSaved();
  };
  const handleSaveBanner = () => {
    if (!editingBannerId || !editingBanner) return;
    const updated = homepageConfig.miniBanners.map(b =>
      b.id === editingBannerId ? { ...b, ...editingBanner } : b
    );
    updateHomepageConfig({ miniBanners: updated });
    setEditingBannerId(null); setEditingBanner(null);
    triggerSaved();
  };
  const handleToggleBanner = (id: string) => {
    const updated = homepageConfig.miniBanners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b);
    updateHomepageConfig({ miniBanners: updated });
  };
  const handleDeleteBanner = (id: string) => {
    if (!confirm('Delete this mini banner?')) return;
    updateHomepageConfig({ miniBanners: homepageConfig.miniBanners.filter(b => b.id !== id) });
    triggerSaved();
  };
  const handleMoveBanner = (idx: number, dir: 'up' | 'down') => {
    const banners = [...homepageConfig.miniBanners];
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= banners.length) return;
    [banners[idx], banners[newIdx]] = [banners[newIdx], banners[idx]];
    updateHomepageConfig({ miniBanners: banners });
  };

  // ─── Brand Logos ─────────────────────────────────────────────────────────
  const handleToggleBrand = (id: string) => {
    const updated = homepageConfig.brandLogos.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b);
    updateHomepageConfig({ brandLogos: updated });
  };
  const handleDeleteBrand = (id: string) => {
    updateHomepageConfig({ brandLogos: homepageConfig.brandLogos.filter(b => b.id !== id) });
    triggerSaved();
  };
  const handleAddBrand = () => {
    if (!newBrandName.trim()) return;
    const brand: BrandLogo = { id: Date.now().toString(), name: newBrandName.trim(), emoji: newBrandEmoji, isActive: true };
    updateHomepageConfig({ brandLogos: [...homepageConfig.brandLogos, brand] });
    setNewBrandName(''); setNewBrandEmoji('📱'); setAddingBrand(false);
    triggerSaved();
  };

  // ─── Newsletter ──────────────────────────────────────────────────────────
  const handleSaveNewsletter = () => {
    updateHomepageConfig({ newsletterTitle, newsletterSubtitle });
    triggerSaved();
  };

  // ─── Section definitions ─────────────────────────────────────────────────
  type SectionKey = 'showTrendingSection' | 'showBestDeals' | 'showCollectionList' |
    'showProducts' | 'showServices' | 'showStores' | 'showTrustBadges' | 'showSellerCta' |
    'showBrandLogos' | 'showNewsletter';

  const sections: { key: SectionKey; icon: React.ElementType; iconBg: string; iconColor: string; label: string; desc: string }[] = [
    { key: 'showTrendingSection', icon: TrendingUp, iconBg: 'bg-rose-50', iconColor: 'text-rose-500', label: 'Trending Products', desc: 'Tabbed trending products section below hero' },
    { key: 'showBestDeals', icon: Tag, iconBg: 'bg-accent-50', iconColor: 'text-accent-500', label: 'Best Deals', desc: 'Orange left banner + deals grid' },
    { key: 'showCollectionList', icon: Grid3X3, iconBg: 'bg-violet-50', iconColor: 'text-violet-500', label: 'Collection Circles', desc: 'Category circle grid section' },
    { key: 'showProducts', icon: Package, iconBg: 'bg-brand-50', iconColor: 'text-brand-600', label: 'Recommended For You', desc: 'Personalised products section' },
    { key: 'showServices', icon: Briefcase, iconBg: 'bg-teal-50', iconColor: 'text-teal-600', label: 'Services Section', desc: 'Local services listing' },
    { key: 'showStores', icon: Store, iconBg: 'bg-sky-50', iconColor: 'text-sky-600', label: 'Featured Stores', desc: 'Top verified stores strip' },
    { key: 'showBrandLogos', icon: Award, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', label: 'Brand Logos Strip', desc: 'Trusted brands logos row' },
    { key: 'showTrustBadges', icon: Star, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', label: 'Trust Badges', desc: 'Fast delivery, secure payment strip' },
    { key: 'showSellerCta', icon: Users, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', label: 'Seller CTA Cards', desc: 'Join as Store Owner / Service Provider cards' },
    { key: 'showNewsletter', icon: Mail, iconBg: 'bg-pink-50', iconColor: 'text-pink-600', label: 'Newsletter Section', desc: 'Email subscription section at the bottom' },
  ];

  return (
    <AppLayout title="Homepage Control">
      <div className="space-y-6 max-w-4xl">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Homepage Control Panel</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage every section of the public homepage in real-time</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 animate-fade-in">
              <CheckCircle className="h-4 w-4" /> Changes saved!
            </div>
          )}
        </div>

        {/* ── Announcement Bar ─────────────────────────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Announcement Bar</p>
                <p className="text-xs text-slate-400">Shown at the very top of the homepage</p>
              </div>
            </div>
            <button onClick={() => updateHomepageConfig({ announcementBarActive: !homepageConfig.announcementBarActive })}
              className="flex items-center gap-2 text-sm font-medium transition-colors">
              {homepageConfig.announcementBarActive
                ? <><ToggleRight className="h-8 w-8 text-accent-500" /><span className="text-accent-500">Active</span></>
                : <><ToggleLeft className="h-8 w-8 text-slate-400" /><span className="text-slate-400">Inactive</span></>
              }
            </button>
          </div>
          {homepageConfig.announcementBarActive && (
            <div className="mb-3 rounded-xl overflow-hidden">
              <div className="bg-brand-900 text-white text-xs py-2 px-4 text-center font-medium">
                {announcementText || '(empty — enter text below)'}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <input className="input flex-1 text-sm" value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
              placeholder="🔥 Welcome to AskIndia — India's trusted marketplace!" />
            <button onClick={handleSaveAnnouncement} className="btn-primary text-sm whitespace-nowrap flex items-center gap-2">
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>

        {/* ── Hero Slider ───────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
                <Image className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Hero Slider Banners</p>
                <p className="text-xs text-slate-400">
                  {homepageConfig.heroSlides.length} slide{homepageConfig.heroSlides.length !== 1 ? 's' : ''} · Auto-advances every 5 s
                </p>
              </div>
            </div>
            <button onClick={() => { setAddingSlide(true); setNewSlide(DEFAULT_SLIDE); setEditingSlideId(null); }}
              className="btn-primary text-sm flex items-center gap-2" disabled={addingSlide}>
              <Plus className="h-4 w-4" /> Add Slide
            </button>
          </div>

          {/* Add new slide form */}
          {addingSlide && (
            <div className="p-5 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-blue-900 text-sm">New Slide</p>
                <button onClick={() => setAddingSlide(false)}><X className="h-4 w-4 text-blue-600" /></button>
              </div>
              <SlideEditor slide={newSlide} onChange={p => setNewSlide(s => ({ ...s, ...p }))}
                onSave={handleAddSlide} onCancel={() => setAddingSlide(false)} isNew />
            </div>
          )}

          {/* Slide list */}
          <div className="divide-y divide-slate-100">
            {homepageConfig.heroSlides.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <Image className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No slides yet. Add your first hero banner!</p>
              </div>
            )}
            {homepageConfig.heroSlides.map((slide, idx) => (
              <div key={slide.id} className={clsx(!slide.isActive && 'opacity-50')}>
                {editingSlideId === slide.id ? (
                  <div className="p-5 bg-amber-50">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-amber-900 text-sm">Editing Slide {idx + 1}</p>
                      <button onClick={() => { setEditingSlideId(null); setEditingSlide(null); }}>
                        <X className="h-4 w-4 text-amber-600" />
                      </button>
                    </div>
                    {editingSlide && (
                      <SlideEditor
                        slide={{ ...slide, ...editingSlide }}
                        onChange={p => setEditingSlide(s => ({ ...(s ?? {}), ...p }))}
                        onSave={handleSaveSlide}
                        onCancel={() => { setEditingSlideId(null); setEditingSlide(null); }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-0.5 pt-1 flex-shrink-0">
                        <button onClick={() => handleMoveSlide(idx, 'up')} disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleMoveSlide(idx, 'down')} disabled={idx === homepageConfig.heroSlides.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0"><SlidePreview slide={slide} /></div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => updateHeroSlide(slide.id, { isActive: !slide.isActive })}
                          className={clsx('p-2 rounded-lg transition-colors',
                            slide.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          )} title={slide.isActive ? 'Hide' : 'Show'}>
                          {slide.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => { setEditingSlideId(slide.id); setEditingSlide({}); setAddingSlide(false); }}
                          className="p-2 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors" title="Edit">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { if (confirm('Delete this slide?')) deleteHeroSlide(slide.id); }}
                          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 ml-12">
                      <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                      <span className="text-xs text-slate-400 truncate flex-1">{slide.title?.split('\n')[0] || 'Untitled'}</span>
                      <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full',
                        slide.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                        {slide.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Mini Banners ─────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-accent-50 rounded-xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-accent-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Mini Banners</p>
                <p className="text-xs text-slate-400">3-column gradient cards below the hero slider</p>
              </div>
            </div>
            <button onClick={() => { setAddingBanner(true); setNewBanner(DEFAULT_MINI_BANNER); setEditingBannerId(null); }}
              className="btn-primary text-sm flex items-center gap-2" disabled={addingBanner}>
              <Plus className="h-4 w-4" /> Add Banner
            </button>
          </div>

          {/* Add new banner form */}
          {addingBanner && (
            <div className="p-5 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-blue-900 text-sm">New Mini Banner</p>
                <button onClick={() => setAddingBanner(false)}><X className="h-4 w-4 text-blue-600" /></button>
              </div>
              <MiniBannerEditor banner={newBanner} onChange={p => setNewBanner(s => ({ ...s, ...p }))}
                onSave={handleAddBanner} onCancel={() => setAddingBanner(false)} isNew />
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {homepageConfig.miniBanners.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No mini banners. Add some category highlight cards!</p>
              </div>
            )}
            {homepageConfig.miniBanners.map((banner, idx) => (
              <div key={banner.id} className={clsx(!banner.isActive && 'opacity-50')}>
                {editingBannerId === banner.id ? (
                  <div className="p-5 bg-amber-50">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-amber-900 text-sm">Editing Banner</p>
                      <button onClick={() => { setEditingBannerId(null); setEditingBanner(null); }}>
                        <X className="h-4 w-4 text-amber-600" />
                      </button>
                    </div>
                    {editingBanner && (
                      <MiniBannerEditor
                        banner={{ ...banner, ...editingBanner }}
                        onChange={p => setEditingBanner(s => ({ ...(s ?? {}), ...p }))}
                        onSave={handleSaveBanner}
                        onCancel={() => { setEditingBannerId(null); setEditingBanner(null); }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-4 flex items-start gap-3">
                    <div className="flex flex-col gap-0.5 pt-1 flex-shrink-0">
                      <button onClick={() => handleMoveBanner(idx, 'up')} disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-accent-500 hover:bg-accent-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleMoveBanner(idx, 'down')} disabled={idx === homepageConfig.miniBanners.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-accent-500 hover:bg-accent-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0"><MiniBannerPreview banner={banner} /></div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => handleToggleBanner(banner.id)}
                        className={clsx('p-2 rounded-lg transition-colors',
                          banner.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        )} title={banner.isActive ? 'Hide' : 'Show'}>
                        {banner.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => { setEditingBannerId(banner.id); setEditingBanner({}); setAddingBanner(false); }}
                        className="p-2 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors" title="Edit">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteBanner(banner.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Brand Logos ───────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Brand Logos Strip</p>
                <p className="text-xs text-slate-400">Trusted brands showcased on the homepage</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => updateHomepageConfig({ showBrandLogos: !homepageConfig.showBrandLogos })}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors">
                {homepageConfig.showBrandLogos
                  ? <><ToggleRight className="h-7 w-7 text-accent-500" /><span className="text-accent-500 text-xs">Visible</span></>
                  : <><ToggleLeft className="h-7 w-7 text-slate-400" /><span className="text-slate-400 text-xs">Hidden</span></>
                }
              </button>
              <button onClick={() => setAddingBrand(true)}
                className="btn-primary text-sm flex items-center gap-2" disabled={addingBrand}>
                <Plus className="h-4 w-4" /> Add Brand
              </button>
            </div>
          </div>

          {addingBrand && (
            <div className="p-5 bg-amber-50 border-b border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-amber-900 text-sm">Add New Brand</p>
                <button onClick={() => setAddingBrand(false)}><X className="h-4 w-4 text-amber-600" /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Brand Name</label>
                    <input className="input text-sm" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Samsung" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Brand Emoji</label>
                    <input className="input text-xl text-center" value={newBrandEmoji} onChange={e => setNewBrandEmoji(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BRAND_EMOJI_SUGGESTIONS.map(em => (
                    <button key={em} onClick={() => setNewBrandEmoji(em)}
                      className={clsx('w-9 h-9 text-xl rounded-lg border-2 transition-all hover:scale-110',
                        newBrandEmoji === em ? 'border-accent-400 bg-accent-50' : 'border-slate-200 hover:border-accent-300'
                      )}>
                      {em}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setAddingBrand(false)} className="btn-secondary text-sm">Cancel</button>
                  <button onClick={handleAddBrand} disabled={!newBrandName.trim()} className="btn-primary text-sm flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Brand
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-5">
            {homepageConfig.brandLogos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No brands yet. Add your first trusted brand!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {homepageConfig.brandLogos.map(brand => (
                  <div key={brand.id} className={clsx(
                    'flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all',
                    brand.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-50'
                  )}>
                    <span className="text-2xl flex-shrink-0">{brand.emoji}</span>
                    <span className="text-sm font-semibold text-slate-700 flex-1 truncate">{brand.name}</span>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => handleToggleBrand(brand.id)}
                        className={clsx('p-1.5 rounded-lg transition-colors',
                          brand.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                        )}>
                        {brand.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => handleDeleteBrand(brand.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Newsletter Settings ───────────────────────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center">
                <Mail className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Newsletter Section</p>
                <p className="text-xs text-slate-400">Email subscription block at page bottom</p>
              </div>
            </div>
            <button onClick={() => updateHomepageConfig({ showNewsletter: !homepageConfig.showNewsletter })}
              className="flex items-center gap-2 text-sm font-medium transition-colors">
              {homepageConfig.showNewsletter
                ? <><ToggleRight className="h-8 w-8 text-accent-500" /><span className="text-accent-500">Active</span></>
                : <><ToggleLeft className="h-8 w-8 text-slate-400" /><span className="text-slate-400">Inactive</span></>
              }
            </button>
          </div>

          {/* Preview */}
          <div className="mb-4 rounded-xl overflow-hidden">
            <div className="bg-brand-900 py-6 px-5 text-center">
              <p className="text-white font-bold text-base">{newsletterTitle || 'Newsletter Title'}</p>
              <p className="text-brand-200 text-xs mt-1">{newsletterSubtitle || 'Newsletter subtitle'}</p>
              <div className="mt-4 flex gap-2 max-w-sm mx-auto">
                <div className="flex-1 bg-white/10 border border-white/20 rounded-xl h-9" />
                <div className="bg-accent-500 text-white text-xs font-bold px-4 h-9 rounded-xl flex items-center justify-center">Subscribe</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Headline</label>
              <input className="input text-sm" value={newsletterTitle} onChange={e => setNewsletterTitle(e.target.value)}
                placeholder="Get 20% Off Your First Order" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subheading</label>
              <input className="input text-sm" value={newsletterSubtitle} onChange={e => setNewsletterSubtitle(e.target.value)}
                placeholder="Subscribe for exclusive deals, new arrivals & festive offers" />
            </div>
            <div className="flex justify-end">
              <button onClick={handleSaveNewsletter} className="btn-primary text-sm flex items-center gap-2">
                <Save className="h-4 w-4" /> Save Newsletter
              </button>
            </div>
          </div>
        </div>

        {/* ── Section Visibility ────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center">
                <Layout className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Section Visibility</p>
                <p className="text-xs text-slate-400">Toggle every homepage section on or off instantly</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {sections.map(s => (
              <ToggleRow key={s.key} icon={s.icon} iconBg={s.iconBg} iconColor={s.iconColor}
                label={s.label} desc={s.desc} active={!!homepageConfig[s.key]}
                onToggle={() => updateHomepageConfig({ [s.key]: !homepageConfig[s.key] })} />
            ))}
          </div>
        </div>

        {/* ── Quick Stats ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Hero Slides', value: homepageConfig.heroSlides.filter(s => s.isActive).length, total: homepageConfig.heroSlides.length, color: 'brand', icon: Image },
            { label: 'Mini Banners', value: homepageConfig.miniBanners.filter(b => b.isActive).length, total: homepageConfig.miniBanners.length, color: 'accent', icon: Zap },
            { label: 'Brand Logos', value: homepageConfig.brandLogos.filter(b => b.isActive).length, total: homepageConfig.brandLogos.length, color: 'amber', icon: Award },
            { label: 'Active Sections', value: sections.filter(s => homepageConfig[s.key]).length, total: sections.length, color: 'emerald', icon: ShoppingBag },
          ].map(stat => (
            <div key={stat.label} className="card p-4 flex items-center gap-3">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                `bg-${stat.color}-50`)}>
                <stat.icon className={clsx('h-5 w-5', `text-${stat.color}-${stat.color === 'accent' ? '500' : '600'}`)} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 leading-none">
                  {stat.value}<span className="text-sm text-slate-400 font-normal">/{stat.total}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Live Preview Link ─────────────────────────────────────────────── */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-start gap-3">
          <Globe className="h-5 w-5 text-brand-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-brand-900">Live Homepage</p>
            <p className="text-xs text-brand-700 mt-0.5">
              All changes apply in real-time. Visit to preview:&nbsp;
              <a href="/" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-brand-900">
                askindia.shop →
              </a>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
