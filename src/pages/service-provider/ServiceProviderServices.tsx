import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { SERVICE_CATEGORIES, formatCurrency } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import type { Service } from '../../types';
import {
  Plus, Search, Star, MapPin, Edit2, Trash2, ToggleLeft, ToggleRight, Briefcase,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAJOR_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal',
  'Patna', 'Ludhiana', 'Agra', 'Nashik', 'Vadodara',
];

const COLOR_OPTIONS = [
  { label: 'Violet', value: 'from-violet-500 to-purple-600', preview: 'linear-gradient(135deg, #8b5cf6, #9333ea)' },
  { label: 'Indigo', value: 'from-indigo-500 to-blue-600', preview: 'linear-gradient(135deg, #6366f1, #2563eb)' },
  { label: 'Emerald', value: 'from-emerald-500 to-teal-600', preview: 'linear-gradient(135deg, #10b981, #0d9488)' },
  { label: 'Amber', value: 'from-amber-500 to-orange-600', preview: 'linear-gradient(135deg, #f59e0b, #ea580c)' },
  { label: 'Rose', value: 'from-rose-500 to-pink-600', preview: 'linear-gradient(135deg, #f43f5e, #db2777)' },
  { label: 'Sky', value: 'from-sky-500 to-cyan-600', preview: 'linear-gradient(135deg, #0ea5e9, #0891b2)' },
];

type StatusTab = 'all' | 'active' | 'pending_review' | 'inactive';

interface ServiceFormData {
  title: string;
  category: string;
  subcategory: string;
  description: string;
  price: string;
  priceType: 'hourly' | 'fixed' | 'starting_from';
  commission: string;   // % agents earn for bringing this booking
  deliveryTime: string;
  availableCities: string[];
  imageIcon: string;
  imageColor: string;
  tags: string;
}

const EMPTY_FORM: ServiceFormData = {
  title: '',
  category: '',
  subcategory: '',
  description: '',
  price: '',
  priceType: 'fixed',
  commission: '10',
  deliveryTime: '',
  availableCities: [],
  imageIcon: '',
  imageColor: COLOR_OPTIONS[0].value,
  tags: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: Service['status'] }> = ({ status }) => {
  if (status === 'active') return <Badge variant="success">Active</Badge>;
  if (status === 'pending_review') return <Badge variant="warning">Pending Review</Badge>;
  return <Badge variant="neutral">Inactive</Badge>;
};

const RatingStars: React.FC<{ rating: number; reviewCount: number }> = ({ rating, reviewCount }) => (
  <div className="flex items-center gap-1">
    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
    <span className="text-xs font-semibold text-slate-700">{rating > 0 ? rating.toFixed(1) : '—'}</span>
    <span className="text-xs text-slate-400">({reviewCount})</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const ServiceProviderServices: React.FC = () => {
  const { currentUser, services, addService, updateService, deleteService } = useAppStore();
  const providerId = currentUser?.id ?? '';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const myServices = services.filter(s => s.providerId === providerId);

  const counts: Record<StatusTab, number> = {
    all: myServices.length,
    active: myServices.filter(s => s.status === 'active').length,
    pending_review: myServices.filter(s => s.status === 'pending_review').length,
    inactive: myServices.filter(s => s.status === 'inactive').length,
  };

  const filtered = myServices.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'all' || s.status === activeTab;
    return matchSearch && matchTab;
  });

  const openAddModal = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (svc: Service) => {
    setEditingService(svc);
    setForm({
      title: svc.title,
      category: svc.category,
      subcategory: svc.subcategory ?? '',
      description: svc.description,
      price: svc.price.toString(),
      priceType: svc.priceType,
      commission: (svc.commission ?? 10).toString(),
      deliveryTime: svc.deliveryTime,
      availableCities: [...svc.availableCities],
      imageIcon: svc.imageIcon,
      imageColor: svc.imageColor,
      tags: svc.tags.join(', '),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const setField = (field: keyof ServiceFormData, value: string | string[]) => {
    setForm(f => ({ ...f, [field]: value }));
    setFormErrors(e => ({ ...e, [field]: undefined }));
  };

  const toggleFormCity = (city: string) => {
    setForm(f => {
      const cities = f.availableCities.includes(city)
        ? f.availableCities.filter(c => c !== city)
        : [...f.availableCities, city];
      return { ...f, availableCities: cities };
    });
  };

  const validateForm = (): boolean => {
    const e: typeof formErrors = {};
    if (!form.title.trim()) e.title = 'Service title is required';
    else if (form.title.trim().length < 5) e.title = 'Minimum 5 characters';
    if (!form.category) e.category = 'Select a category';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.trim().length < 30) e.description = `Minimum 30 characters (${form.description.trim().length}/30)`;
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter a valid price';
    if (!form.deliveryTime.trim()) e.deliveryTime = 'Delivery time is required';
    if (form.availableCities.length === 0) e.availableCities = 'Select at least one city';
    if (!form.imageIcon.trim()) e.imageIcon = 'Add a service icon (emoji or text)';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingService) {
      updateService(editingService.id, {
        title: form.title.trim(),
        category: form.category,
        subcategory: form.subcategory.trim() || undefined,
        description: form.description.trim(),
        price: Number(form.price),
        priceType: form.priceType,
        commission: Math.min(30, Math.max(0, Number(form.commission) || 10)),
        deliveryTime: form.deliveryTime.trim(),
        availableCities: form.availableCities,
        imageIcon: form.imageIcon.trim(),
        imageColor: form.imageColor,
        tags: tagsArray,
      });
    } else {
      addService({
        providerId,
        providerName: currentUser?.name ?? '',
        title: form.title.trim(),
        category: form.category,
        subcategory: form.subcategory.trim() || undefined,
        description: form.description.trim(),
        price: Number(form.price),
        priceType: form.priceType,
        commission: Math.min(30, Math.max(0, Number(form.commission) || 10)),
        deliveryTime: form.deliveryTime.trim(),
        availableCities: form.availableCities,
        imageIcon: form.imageIcon.trim(),
        imageColor: form.imageColor,
        tags: tagsArray,
        status: 'pending_review',
        featured: false,
      });
    }

    setIsSaving(false);
    setModalOpen(false);
  };

  const toggleStatus = (svc: Service) => {
    const nextStatus: Service['status'] = svc.status === 'active' ? 'inactive' : 'active';
    updateService(svc.id, { status: nextStatus });
  };

  const confirmDelete = (id: string) => setDeleteConfirmId(id);
  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteService(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const priceLabel = (svc: Service) => {
    const prefix = svc.priceType === 'starting_from' ? 'From ' : '';
    const suffix = svc.priceType === 'hourly' ? '/hr' : svc.priceType === 'starting_from' ? '' : '';
    return `${prefix}${formatCurrency(svc.price)}${suffix}`;
  };

  return (
    <AppLayout title="My Services">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Services</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage and publish your service listings</p>
          </div>
          <button onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', count: counts.all, color: 'text-slate-700', bg: 'bg-slate-100' },
            { label: 'Active', count: counts.active, color: 'text-emerald-700', bg: 'bg-emerald-100' },
            { label: 'Pending Review', count: counts.pending_review, color: 'text-amber-700', bg: 'bg-amber-100' },
            { label: 'Inactive', count: counts.inactive, color: 'text-slate-600', bg: 'bg-slate-100' },
          ].map(item => (
            <div key={item.label} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                <span className={`text-lg font-bold ${item.color}`}>{item.count}</span>
              </div>
              <span className="text-sm text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search services..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'pending_review', 'inactive'] as StatusTab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
                )}>
                {tab === 'all' ? 'All' : tab === 'pending_review' ? 'Pending Review' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-1.5 text-xs opacity-75">({counts[tab]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {myServices.length === 0 ? (
          <div className="card py-20 text-center">
            <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Briefcase className="h-10 w-10 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No services listed yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              List your first service to start receiving bookings from customers across India.
            </p>
            <button onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
              <Plus className="h-4 w-4" /> Add First Service
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-slate-500">No services match your search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(svc => (
              <div key={svc.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                {/* Image header */}
                <div className={`h-28 bg-gradient-to-br ${svc.imageColor} flex items-center justify-center relative`}>
                  <span className="text-5xl">{svc.imageIcon}</span>
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={svc.status} />
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <h4 className="font-semibold text-slate-900 text-sm leading-tight">{svc.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">
                      {SERVICE_CATEGORIES.find(c => c.slug === svc.category)?.icon}{' '}
                      {SERVICE_CATEGORIES.find(c => c.slug === svc.category)?.name ?? svc.category}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-base font-bold text-violet-700">{priceLabel(svc)}</p>
                      <p className="text-xs text-slate-400">{svc.deliveryTime}</p>
                    </div>
                    <RatingStars rating={svc.rating} reviewCount={svc.reviewCount} />
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 font-medium">
                      🤝 Agent comm: {svc.commission ?? 0}%
                    </span>
                  </div>

                  {/* Cities */}
                  <div className="flex items-center gap-1 mb-4 flex-wrap">
                    <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    {svc.availableCities.slice(0, 2).map(city => (
                      <span key={city} className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {city}
                      </span>
                    ))}
                    {svc.availableCities.length > 2 && (
                      <span className="text-xs text-slate-400">+{svc.availableCities.length - 2} more</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button onClick={() => openEditModal(svc)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => toggleStatus(svc)}
                      className={clsx(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors',
                        svc.status === 'active'
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      )}>
                      {svc.status === 'active'
                        ? <><ToggleLeft className="h-3.5 w-3.5" /> Deactivate</>
                        : <><ToggleRight className="h-3.5 w-3.5" /> Activate</>
                      }
                    </button>
                    <button onClick={() => confirmDelete(svc.id)}
                      className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        size="lg"
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Title + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Service Title <span className="text-red-500">*</span>
              </label>
              <input className={clsx('input', formErrors.title && 'border-red-400 bg-red-50')}
                value={form.title} onChange={e => setField('title', e.target.value)}
                placeholder="e.g. Home Electrical Repair" />
              {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select className={clsx('input', formErrors.category && 'border-red-400 bg-red-50')}
                value={form.category} onChange={e => setField('category', e.target.value)}>
                <option value="">Select category</option>
                {SERVICE_CATEGORIES.map(c => (
                  <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>
                ))}
              </select>
              {formErrors.category && <p className="text-xs text-red-600 mt-1">{formErrors.category}</p>}
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subcategory</label>
            <input className="input" value={form.subcategory}
              onChange={e => setField('subcategory', e.target.value)}
              placeholder="e.g. Wiring, Fan Installation (optional)" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
              <span className="ml-1 text-xs font-normal text-slate-400">(min 30 chars, {form.description.length} entered)</span>
            </label>
            <textarea className={clsx('input h-24 resize-none', formErrors.description && 'border-red-400 bg-red-50')}
              value={form.description} onChange={e => setField('description', e.target.value)}
              placeholder="Describe the service in detail..." />
            {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
          </div>

          {/* Price + Type + Delivery */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input className={clsx('input', formErrors.price && 'border-red-400 bg-red-50')}
                type="number" min="0" value={form.price}
                onChange={e => setField('price', e.target.value)} placeholder="500" />
              {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Price Type <span className="text-red-500">*</span>
              </label>
              <div className="space-y-1">
                {(['fixed', 'hourly', 'starting_from'] as const).map(pt => (
                  <label key={pt} className={clsx(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs transition-colors',
                    form.priceType === pt ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600'
                  )}>
                    <input type="radio" name="priceType" value={pt}
                      checked={form.priceType === pt}
                      onChange={() => setField('priceType', pt)} className="sr-only" />
                    {pt === 'fixed' ? 'Fixed' : pt === 'hourly' ? 'Per Hour' : 'Starting From'}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Delivery Time <span className="text-red-500">*</span>
              </label>
              <input className={clsx('input', formErrors.deliveryTime && 'border-red-400 bg-red-50')}
                value={form.deliveryTime}
                onChange={e => setField('deliveryTime', e.target.value)}
                placeholder="e.g. Same day" />
              {formErrors.deliveryTime && <p className="text-xs text-red-600 mt-1">{formErrors.deliveryTime}</p>}
            </div>
          </div>

          {/* Agent Commission */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-orange-800 mb-1">
                  Agent Commission % <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-orange-600 mb-2">
                  Set how much % agents earn when they bring a booking for this service. Range: 0–30%.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    className="input w-28 text-center font-bold text-orange-800"
                    type="number"
                    min="0"
                    max="30"
                    value={form.commission}
                    onChange={e => setField('commission', e.target.value)}
                    placeholder="10"
                  />
                  <span className="text-sm font-medium text-orange-700">% per booking</span>
                  {form.price && Number(form.price) > 0 && Number(form.commission) > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-800 font-semibold px-2.5 py-1 rounded-lg">
                      = ₹{Math.round((Number(form.commission) / 100) * Number(form.price))} per booking
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cities */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Available Cities <span className="text-red-500">*</span>
              {form.availableCities.length > 0 && (
                <span className="ml-2 text-xs text-violet-600 font-normal">{form.availableCities.length} selected</span>
              )}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {MAJOR_CITIES.map(city => (
                <label key={city} className={clsx(
                  'flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer text-xs transition-colors',
                  form.availableCities.includes(city)
                    ? 'border-violet-400 bg-violet-50 text-violet-700 font-medium'
                    : 'border-slate-200 text-slate-600 hover:border-violet-300'
                )}>
                  <input type="checkbox"
                    checked={form.availableCities.includes(city)}
                    onChange={() => toggleFormCity(city)}
                    className="rounded border-slate-300 text-violet-600 flex-shrink-0" />
                  {city}
                </label>
              ))}
            </div>
            {formErrors.availableCities && (
              <p className="text-xs text-red-600 mt-1">{formErrors.availableCities}</p>
            )}
          </div>

          {/* Icon + Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Service Icon <span className="text-red-500">*</span>
              </label>
              <input className={clsx('input', formErrors.imageIcon && 'border-red-400 bg-red-50')}
                value={form.imageIcon}
                onChange={e => setField('imageIcon', e.target.value)}
                placeholder="Paste an emoji e.g. 🔧" />
              {formErrors.imageIcon && <p className="text-xs text-red-600 mt-1">{formErrors.imageIcon}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Card Color</label>
              <div className="flex gap-2 flex-wrap pt-1">
                {COLOR_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setField('imageColor', opt.value)}
                    title={opt.label}
                    className={clsx(
                      'w-8 h-8 rounded-lg border-2 transition-all',
                      form.imageColor === opt.value ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ background: opt.preview }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tags
              <span className="ml-1 text-xs font-normal text-slate-400">(comma-separated, e.g. wiring, repairs, AC)</span>
            </label>
            <input className="input" value={form.tags}
              onChange={e => setField('tags', e.target.value)}
              placeholder="electrician, home repair, wiring" />
          </div>

          {!editingService && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              New services are submitted for review. They will go live once approved by our team (usually within 24 hours).
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-200">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60">
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : editingService ? 'Save Changes' : 'Submit Service'}
          </button>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Service"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this service? This action cannot be undone and any associated data will be removed.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
              Delete Service
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
};
