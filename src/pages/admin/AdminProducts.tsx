import React, { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import { PRODUCT_CATEGORIES, formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import type { Product, ProductSpec } from '../../types';
import {
  Plus, Search, Edit2, Filter, X, Upload, Image, Trash2, Check,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_GRADIENTS: Record<string, string> = {
  electronics: 'from-blue-400 to-indigo-600',
  sports: 'from-green-400 to-emerald-600',
  beauty: 'from-pink-400 to-rose-500',
  home: 'from-orange-400 to-red-500',
  fashion: 'from-purple-400 to-violet-600',
};

function getCategoryGradient(slug: string): string {
  for (const key of Object.keys(CATEGORY_GRADIENTS)) {
    if (slug.includes(key)) return CATEGORY_GRADIENTS[key];
  }
  return 'from-brand-400 to-brand-600';
}

const SUGGESTED_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];

// ─── Reusable sub-components ─────────────────────────────────────────────────

interface SectionHeaderProps { title: string; }
const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <div className="border-l-4 border-brand-500 pl-3 mb-4">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
  </div>
);

interface TagChipProps { label: string; onRemove: () => void; }
const TagChip: React.FC<TagChipProps> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-200 text-xs px-2.5 py-1 rounded-full">
    {label}
    <button type="button" onClick={onRemove} className="hover:text-brand-900 ml-0.5">
      <X className="h-3 w-3" />
    </button>
  </span>
);

// ─── Image uploader (thumbnail + additional) ─────────────────────────────────

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  size?: 'sm' | 'lg';
  categoryIcon?: string;
  categoryGradient?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  value, onChange, placeholder = 'Thumbnail', size = 'lg', categoryIcon, categoryGradient,
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const previewSize = size === 'lg' ? 'w-40 h-40' : 'w-20 h-20';

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg w-fit">
        {(['upload', 'url'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={clsx(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t === 'upload' ? 'Upload File' : 'Image URL'}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 bg-slate-50 transition-colors flex flex-col items-center justify-center gap-2 py-6 cursor-pointer"
        >
          <Upload className="h-6 w-6 text-slate-400" />
          <span className="text-sm text-slate-500">Click to upload {placeholder}</span>
          <span className="text-xs text-slate-400">PNG, JPG, WebP up to 10MB</span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </button>
      )}

      {tab === 'url' && (
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
          />
          <button
            type="button"
            onClick={() => { if (urlInput.trim()) { onChange(urlInput.trim()); setUrlInput(''); } }}
            className="btn-primary shrink-0"
          >
            Load
          </button>
        </div>
      )}

      {value && (
        <div className="relative w-fit">
          <img
            src={value}
            alt="preview"
            className={clsx(previewSize, 'object-cover rounded-xl border border-slate-200')}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {!value && categoryIcon && (
        <div className={clsx(previewSize, 'rounded-xl bg-gradient-to-br flex items-center justify-center text-4xl border border-slate-100', categoryGradient)}>
          {categoryIcon}
        </div>
      )}
    </div>
  );
};

// ─── Form state factory ───────────────────────────────────────────────────────

interface PanelFormState {
  name: string;
  brand: string;
  description: string;
  categoryId: string;
  price: string;
  mrp: string;
  commission: string;
  stock: string;
  status: 'active' | 'draft';
  featured: boolean;
  warranty: string;
  returnPolicy: string;
  thumbnail: string;
  additionalImages: string[];
  tags: string[];
  highlights: string[];
  specifications: ProductSpec[];
  nationwide: boolean;
  cities: string[];
}

function emptyForm(): PanelFormState {
  return {
    name: '',
    brand: '',
    description: '',
    categoryId: PRODUCT_CATEGORIES[0].id,
    price: '',
    mrp: '',
    commission: '20',
    stock: '100',
    status: 'active',
    featured: false,
    warranty: '',
    returnPolicy: '',
    thumbnail: '',
    additionalImages: [],
    tags: [],
    highlights: [],
    specifications: [],
    nationwide: true,
    cities: [],
  };
}

function formFromProduct(p: Product): PanelFormState {
  return {
    name: p.name,
    brand: p.brand ?? '',
    description: p.description,
    categoryId: p.categoryId,
    price: String(p.price),
    mrp: String(p.mrp),
    commission: String(p.commission),
    stock: String(p.stock),
    status: p.status === 'out_of_stock' ? 'active' : p.status,
    featured: p.featured,
    warranty: p.warranty ?? '',
    returnPolicy: p.returnPolicy ?? '',
    thumbnail: p.thumbnail ?? '',
    additionalImages: p.images ?? [],
    tags: p.tags ?? [],
    highlights: p.highlights ?? [],
    specifications: p.specifications ?? [],
    nationwide: !p.availableCities || p.availableCities.length === 0,
    cities: p.availableCities ?? [],
  };
}

// ─── Product Panel (Add / Edit) ───────────────────────────────────────────────

interface ProductPanelProps {
  mode: 'add' | 'edit';
  product?: Product;
  onClose: () => void;
  onSubmit: (form: PanelFormState) => void;
  onDelete?: () => void;
}

const ProductPanel: React.FC<ProductPanelProps> = ({ mode, product, onClose, onSubmit, onDelete }) => {
  const [form, setForm] = useState<PanelFormState>(() =>
    mode === 'edit' && product ? formFromProduct(product) : emptyForm(),
  );
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Tag input
  const [tagInput, setTagInput] = useState('');
  // Highlight input
  const [highlightInput, setHighlightInput] = useState('');
  // Spec inputs
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  // City input
  const [cityInput, setCityInput] = useState('');

  const set = useCallback(<K extends keyof PanelFormState>(k: K, v: PanelFormState[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  const selectedCat = PRODUCT_CATEGORIES.find(c => c.id === form.categoryId) ?? PRODUCT_CATEGORIES[0];
  const gradient = getCategoryGradient(selectedCat.slug);

  const price = parseFloat(form.price) || 0;
  const mrp = parseFloat(form.mrp) || 0;
  const discount = mrp > price && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  // Tag helpers
  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,+$/, '').trim();
    if (tag && !form.tags.includes(tag)) set('tags', [...form.tags, tag]);
  };
  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    }
  };

  // Highlight helpers
  const addHighlight = () => {
    const h = highlightInput.trim();
    if (h) { set('highlights', [...form.highlights, h]); setHighlightInput(''); }
  };

  // Spec helpers
  const addSpec = () => {
    if (specKey.trim() && specValue.trim()) {
      set('specifications', [...form.specifications, { key: specKey.trim(), value: specValue.trim() }]);
      setSpecKey(''); setSpecValue('');
    }
  };

  // City helpers
  const addCity = (city: string) => {
    if (!form.cities.includes(city)) set('cities', [...form.cities, city]);
  };

  // Additional images
  const addImageSlot = () => {
    if (form.additionalImages.length < 5) set('additionalImages', [...form.additionalImages, '']);
  };
  const updateImageAt = (i: number, url: string) => {
    const next = [...form.additionalImages];
    next[i] = url;
    set('additionalImages', next);
  };
  const removeImageAt = (i: number) => {
    set('additionalImages', form.additionalImages.filter((_, idx) => idx !== i));
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.price) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl ml-auto bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'add' ? 'Add New Product' : 'Edit Product'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in all the details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 px-6 py-6 space-y-8 overflow-y-auto">

          {/* ── Section 1: Product Images ── */}
          <section>
            <SectionHeader title="Product Images" />
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Thumbnail Image</label>
                <ImageUploader
                  value={form.thumbnail}
                  onChange={v => set('thumbnail', v)}
                  placeholder="thumbnail"
                  size="lg"
                  categoryIcon={selectedCat.icon}
                  categoryGradient={gradient}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Additional Images (up to 5)</label>
                  {form.additionalImages.length < 5 && (
                    <button
                      type="button"
                      onClick={addImageSlot}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Image
                    </button>
                  )}
                </div>

                {form.additionalImages.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No additional images. Click "Add Image" to add up to 5.</p>
                )}

                <div className="flex flex-wrap gap-3 mt-2">
                  {form.additionalImages.map((img, i) => (
                    <div key={i} className="space-y-1">
                      {img ? (
                        <div className="relative">
                          <img
                            src={img}
                            alt={`extra-${i}`}
                            className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImageAt(i)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <ImageUploader
                            value=""
                            onChange={url => updateImageAt(i, url)}
                            placeholder={`image ${i + 1}`}
                            size="sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeImageAt(i)}
                            className="absolute top-0 right-0 bg-slate-200 text-slate-500 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Product Identity ── */}
          <section>
            <SectionHeader title="Product Identity" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Brand</label>
                  <input
                    className="input"
                    placeholder="e.g. Sony, Apple"
                    value={form.brand}
                    onChange={e => set('brand', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select
                    className="input"
                    value={form.categoryId}
                    onChange={e => set('categoryId', e.target.value)}
                  >
                    {PRODUCT_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map(tag => (
                    <TagChip key={tag} label={tag} onRemove={() => set('tags', form.tags.filter(t => t !== tag))} />
                  ))}
                </div>
                <input
                  className="input"
                  placeholder="Type a tag and press Enter or comma"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput(''); } }}
                />
                <p className="text-xs text-slate-400 mt-1">Press Enter or comma to add each tag</p>
              </div>
            </div>
          </section>

          {/* ── Section 3: Pricing ── */}
          <section>
            <SectionHeader title="Pricing" />
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Selling Price (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="2000"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">MRP (₹)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="2999"
                    value={form.mrp}
                    onChange={e => set('mrp', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Commission (%)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="20"
                    value={form.commission}
                    onChange={e => set('commission', e.target.value)}
                  />
                </div>
              </div>

              {discount > 0 && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-sm text-emerald-700">
                    Customer saves{' '}
                    <strong>{formatCurrency(mrp - price)}</strong>
                    {' — '}
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {discount}% off
                    </span>
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* ── Section 4: Product Details ── */}
          <section>
            <SectionHeader title="Product Details" />
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  className="input resize-none"
                  rows={4}
                  placeholder="Describe the product in detail..."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                />
              </div>

              {/* Key Highlights */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Key Highlights</label>
                <div className="space-y-1.5 mb-2">
                  {form.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span className="text-brand-500 font-bold text-sm">•</span>
                      <span className="text-sm text-slate-700 flex-1">{h}</span>
                      <button
                        type="button"
                        onClick={() => set('highlights', form.highlights.filter((_, idx) => idx !== i))}
                        className="text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="e.g. 40-hour battery life"
                    value={highlightInput}
                    onChange={e => setHighlightInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } }}
                  />
                  <button type="button" onClick={addHighlight} className="btn-secondary shrink-0">
                    Add
                  </button>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Specifications</label>
                <div className="space-y-1.5 mb-2">
                  {form.specifications.map((spec, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center py-1">
                      <span className="text-sm font-semibold text-slate-700 truncate">{spec.key}</span>
                      <span className="text-sm text-slate-500 truncate">{spec.value}</span>
                      <button
                        type="button"
                        onClick={() => set('specifications', form.specifications.filter((_, idx) => idx !== i))}
                        className="text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {form.specifications.length > 0 && <div className="border-t border-slate-100" />}
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input
                    className="input"
                    placeholder="Key (e.g. Color)"
                    value={specKey}
                    onChange={e => setSpecKey(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpec(); } }}
                  />
                  <input
                    className="input"
                    placeholder="Value (e.g. Midnight Black)"
                    value={specValue}
                    onChange={e => setSpecValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpec(); } }}
                  />
                  <button type="button" onClick={addSpec} className="btn-secondary shrink-0">
                    Add
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 5: Inventory & Availability ── */}
          <section>
            <SectionHeader title="Inventory & Availability" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Stock Quantity</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="100"
                    value={form.stock}
                    onChange={e => set('stock', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <div className="flex gap-3 mt-2">
                    {(['active', 'draft'] as const).map(s => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          checked={form.status === s}
                          onChange={() => set('status', s)}
                          className="accent-brand-600"
                        />
                        <span className={clsx(
                          'text-sm font-medium capitalize',
                          form.status === s ? 'text-slate-900' : 'text-slate-400',
                        )}>
                          {s}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={e => set('featured', e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600"
                />
                <label htmlFor="featured" className="flex-1 cursor-pointer">
                  <span className="text-sm font-medium text-slate-700">Featured Product</span>
                  <p className="text-xs text-slate-400">Highlighted on homepage and category pages</p>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Warranty</label>
                  <input
                    className="input"
                    placeholder="e.g. 1 Year Manufacturer Warranty"
                    value={form.warranty}
                    onChange={e => set('warranty', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Return Policy</label>
                  <input
                    className="input"
                    placeholder="e.g. 7-Day Returns"
                    value={form.returnPolicy}
                    onChange={e => set('returnPolicy', e.target.value)}
                  />
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
                <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg w-fit mb-3">
                  {[true, false].map(isNationwide => (
                    <button
                      key={String(isNationwide)}
                      type="button"
                      onClick={() => set('nationwide', isNationwide)}
                      className={clsx(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                        form.nationwide === isNationwide
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700',
                      )}
                    >
                      {isNationwide ? 'Nationwide' : 'Specific Cities'}
                    </button>
                  ))}
                </div>

                {!form.nationwide && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_CITIES.filter(c => !form.cities.includes(c)).map(city => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => addCity(city)}
                          className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors"
                        >
                          + {city}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.cities.map(city => (
                        <TagChip key={city} label={city} onRemove={() => set('cities', form.cities.filter(c => c !== city))} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="input flex-1"
                        placeholder="Add a city..."
                        value={cityInput}
                        onChange={e => setCityInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (cityInput.trim()) { addCity(cityInput.trim()); setCityInput(''); }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => { if (cityInput.trim()) { addCity(cityInput.trim()); setCityInput(''); } }}
                        className="btn-secondary shrink-0"
                      >
                        Add City
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          {mode === 'edit' && onDelete && (
            <div>
              {!deleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Delete Product
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 font-medium">Are you sure?</span>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
          {mode === 'add' && <div />}

          <div className="flex gap-3 ml-auto">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.price}
              className={clsx(
                'btn-primary',
                (!form.name.trim() || !form.price) && 'opacity-50 cursor-not-allowed',
              )}
            >
              <Plus className="h-4 w-4" />
              {mode === 'add' ? 'Add Product' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAppStore();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.categoryId === catFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const toggleStatus = (product: Product) => {
    updateProduct(product.id, { status: product.status === 'active' ? 'draft' : 'active' });
  };

  const handleAdd = (form: PanelFormState) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.id === form.categoryId) ?? PRODUCT_CATEGORIES[0];
    addProduct({
      name: form.name.trim(),
      brand: form.brand.trim() || undefined,
      description: form.description.trim(),
      price: parseFloat(form.price) || 0,
      mrp: parseFloat(form.mrp) || parseFloat(form.price) || 0,
      commission: parseFloat(form.commission) || 20,
      categoryId: cat.id,
      category: cat.name,
      stock: parseInt(form.stock) || 0,
      imageColor: getCategoryGradient(cat.slug),
      imageIcon: cat.icon,
      thumbnail: form.thumbnail || undefined,
      images: form.additionalImages.filter(Boolean),
      status: form.status,
      featured: form.featured,
      availableCities: form.nationwide ? [] : form.cities,
      tags: form.tags,
      highlights: form.highlights,
      specifications: form.specifications,
      warranty: form.warranty.trim() || undefined,
      returnPolicy: form.returnPolicy.trim() || undefined,
    });
    setShowAdd(false);
  };

  const handleEdit = (form: PanelFormState) => {
    if (!editProduct) return;
    const cat = PRODUCT_CATEGORIES.find(c => c.id === form.categoryId) ?? PRODUCT_CATEGORIES[0];
    updateProduct(editProduct.id, {
      name: form.name.trim(),
      brand: form.brand.trim() || undefined,
      description: form.description.trim(),
      price: parseFloat(form.price) || 0,
      mrp: parseFloat(form.mrp) || parseFloat(form.price) || 0,
      commission: parseFloat(form.commission) || 20,
      categoryId: cat.id,
      category: cat.name,
      imageColor: getCategoryGradient(cat.slug),
      imageIcon: cat.icon,
      stock: parseInt(form.stock) || 0,
      thumbnail: form.thumbnail || undefined,
      images: form.additionalImages.filter(Boolean),
      status: form.status,
      featured: form.featured,
      availableCities: form.nationwide ? [] : form.cities,
      tags: form.tags,
      highlights: form.highlights,
      specifications: form.specifications,
      warranty: form.warranty.trim() || undefined,
      returnPolicy: form.returnPolicy.trim() || undefined,
    });
    setEditProduct(null);
  };

  const handleDelete = () => {
    if (!editProduct) return;
    deleteProduct(editProduct.id);
    setEditProduct(null);
  };

  return (
    <AppLayout title="Product Management">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Products</h2>
            <p className="text-sm text-slate-500 mt-0.5">{filtered.length} products in AskIndia catalog</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-auto" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Product</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Commission</th>
                  <th className="table-th">Stock</th>
                  <th className="table-th">Sold</th>
                  <th className="table-th">Cities</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className={clsx(
                            'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl flex-shrink-0',
                            product.imageColor,
                          )}>
                            {product.imageIcon}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{product.name}</p>
                          <p className="text-xs text-slate-400">Added {formatDate(product.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="text-slate-600 text-sm">{product.category}</span>
                    </td>
                    <td className="table-td">
                      <div>
                        <p className="font-semibold text-slate-900">{formatCurrency(product.price)}</p>
                        {product.mrp > product.price && (
                          <p className="text-xs text-slate-400 line-through">{formatCurrency(product.mrp)}</p>
                        )}
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="font-medium text-emerald-600">{product.commission}%</span>
                    </td>
                    <td className="table-td">
                      <span className={product.stock < 50 ? 'text-amber-600 font-medium' : 'text-slate-700'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="table-td text-slate-600">{product.sold.toLocaleString()}</td>
                    <td className="table-td">
                      <span className="text-xs text-slate-500">
                        {product.availableCities && product.availableCities.length > 0
                          ? product.availableCities.slice(0, 2).join(', ') +
                            (product.availableCities.length > 2 ? ` +${product.availableCities.length - 2}` : '')
                          : 'Nationwide'}
                      </span>
                    </td>
                    <td className="table-td">{statusBadge(product.status)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditProduct(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(product)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {product.status === 'active' ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <Filter className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No products found</p>
              <p className="text-sm mt-1">
                {products.length === 0
                  ? 'Add your first product to the AskIndia catalog'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Panel */}
      {showAdd && (
        <ProductPanel
          mode="add"
          onClose={() => setShowAdd(false)}
          onSubmit={handleAdd}
        />
      )}

      {/* Edit Panel */}
      {editProduct && (
        <ProductPanel
          mode="edit"
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSubmit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </AppLayout>
  );
};
