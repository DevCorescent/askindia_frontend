import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import type { Store } from '../../types';
import {
  Search, Plus, X, ShoppingBag, Briefcase, CheckCircle, XCircle,
  Eye, Store as StoreIcon, AlertTriangle, RefreshCw, ExternalLink,
  Building2, CreditCard, Info,
} from 'lucide-react';
import clsx from 'clsx';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const PRESET_COLORS = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];

type StoreTab = 'product' | 'service';
type DetailTab = 'overview' | 'business' | 'banking';

interface CreateFormData {
  storeType: 'product' | 'service';
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string;
  themeColor: string;
  ownerId: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
  commissionRate: string;
  gstNumber: string;
  bankAccount: string;
  bankIfsc: string;
}

const defaultForm: CreateFormData = {
  storeType: 'product',
  name: '',
  slug: '',
  tagline: '',
  description: '',
  logo: '🏪',
  themeColor: '#4f46e5',
  ownerId: '',
  city: '',
  state: '',
  contactEmail: '',
  contactPhone: '',
  commissionRate: '20',
  gstNumber: '',
  bankAccount: '',
  bankIfsc: '',
};

export const AdminStores: React.FC = () => {
  const navigate = useNavigate();
  const { stores, registeredUsers, createStore, activateStore, rejectStore, updateStore, currentUser } = useAppStore();

  const [activeTab, setActiveTab] = useState<StoreTab>('product');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateFormData>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateFormData, string>>>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Stats
  const totalStores = stores.length;
  const activeStores = stores.filter(s => s.status === 'active').length;
  const pendingStores = stores.filter(s => s.status === 'pending').length;
  const suspendedStores = stores.filter(s => s.status === 'suspended').length;

  // Eligible owners for dropdown
  const eligibleOwners = useMemo(() => {
    const role = form.storeType === 'product' ? 'store_owner' : 'service_provider';
    return registeredUsers.filter(u => u.role === role);
  }, [registeredUsers, form.storeType]);

  // Filtered stores for current tab
  const filtered = useMemo(() => {
    return stores.filter(s => {
      const matchType = (s.storeType ?? 'product') === activeTab;
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchType && matchSearch && matchStatus;
    });
  }, [stores, activeTab, search, statusFilter]);

  // Form helpers
  const setField = <K extends keyof CreateFormData>(key: K, value: CreateFormData[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !slugManuallyEdited) {
        next.slug = slugify(value as string);
      }
      if (key === 'storeType') {
        next.logo = value === 'service' ? '🛠️' : '🏪';
        next.themeColor = value === 'service' ? '#7c3aed' : '#4f46e5';
        next.ownerId = '';
      }
      return next;
    });
    setFormErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CreateFormData, string>> = {};
    if (!form.name.trim()) errors.name = 'Store name is required';
    if (!form.slug.trim()) errors.slug = 'Subdomain is required';
    if (!form.tagline.trim()) errors.tagline = 'Tagline is required';
    if (!form.city.trim()) errors.city = 'City is required';
    const rate = Number(form.commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 50) errors.commissionRate = 'Must be 0–50';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStore = () => {
    if (!validateForm()) return;
    const ownerUser = registeredUsers.find(u => u.id === form.ownerId);
    createStore({
      storeType: form.storeType,
      subdomain: form.slug,
      name: form.name.trim(),
      slug: form.slug.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      logo: form.logo || '🏪',
      themeColor: form.themeColor,
      ownerId: form.ownerId,
      ownerName: ownerUser?.name ?? '(Unassigned)',
      city: form.city.trim(),
      state: form.state.trim(),
      commissionRate: Number(form.commissionRate),
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      gstNumber: form.gstNumber.trim() || undefined,
      bankAccount: form.bankAccount.trim() || undefined,
      bankIfsc: form.bankIfsc.trim() || undefined,
      status: 'pending',
    });
    setShowCreate(false);
    setForm(defaultForm);
    setSlugManuallyEdited(false);
    setFormErrors({});
  };

  const handleActivate = (store: Store) => {
    const adminEmail = currentUser?.email ?? 'admin@askindia.shop';
    activateStore(store.id, adminEmail);
    setSelectedStore(prev => prev?.id === store.id ? { ...prev, status: 'active', activatedAt: new Date().toISOString(), activatedBy: adminEmail } : prev);
  };

  const handleSuspend = (store: Store) => {
    updateStore(store.id, { status: 'suspended' });
    setSelectedStore(prev => prev?.id === store.id ? { ...prev, status: 'suspended' } : prev);
  };

  const handleRestore = (store: Store) => {
    updateStore(store.id, { status: 'active' });
    setSelectedStore(prev => prev?.id === store.id ? { ...prev, status: 'active' } : prev);
  };

  const handleReject = (store: Store) => {
    if (!rejectReason.trim()) return;
    rejectStore(store.id, rejectReason.trim());
    setSelectedStore(prev => prev?.id === store.id ? { ...prev, status: 'suspended', rejectionReason: rejectReason.trim() } : prev);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const openDetail = (store: Store) => {
    setSelectedStore(store);
    setDetailTab('overview');
    setShowRejectForm(false);
    setRejectReason('');
  };

  return (
    <AppLayout title="Store Management">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Store Management</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage product stores and service hubs across AskIndia
            </p>
            {/* Stats chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
                {totalStores} Total
              </span>
              <span className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-3 py-1 rounded-full text-xs font-medium">
                {activeStores} Active
              </span>
              <span className="bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-3 py-1 rounded-full text-xs font-medium">
                {pendingStores} Pending
              </span>
              <span className="bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-1 rounded-full text-xs font-medium">
                {suspendedStores} Suspended
              </span>
            </div>
          </div>
          <button
            onClick={() => { setShowCreate(true); setForm(defaultForm); setSlugManuallyEdited(false); setFormErrors({}); }}
            className="btn-primary flex-shrink-0"
          >
            <Plus className="h-4 w-4" /> Create New Store
          </button>
        </div>

        {/* Activation Queue Banner */}
        {pendingStores > 0 && (
          <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium">
                {pendingStores} store{pendingStores !== 1 ? 's' : ''} awaiting super admin activation
              </p>
            </div>
            <button
              onClick={() => { setStatusFilter('pending'); setActiveTab('product'); }}
              className="text-xs font-semibold text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors flex-shrink-0"
            >
              Review Now
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {([
            { key: 'product', label: 'Product Stores', icon: ShoppingBag },
            { key: 'service', label: 'Service Hubs', icon: Briefcase },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              <span className={clsx(
                'text-xs px-1.5 py-0.5 rounded-full font-bold',
                activeTab === key ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'
              )}>
                {stores.filter(s => (s.storeType ?? 'product') === key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="card p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search stores, owners, subdomains..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Store cards */}
        {filtered.length === 0 ? (
          <div className="card py-16 text-center">
            <StoreIcon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">No stores found</p>
            <p className="text-sm text-slate-400 mt-1">
              {stores.filter(s => s.storeType === activeTab).length === 0
                ? `No ${activeTab === 'product' ? 'product stores' : 'service hubs'} created yet`
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map(store => (
              <div key={store.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: store.themeColor + '22' }}
                    >
                      {store.logo}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{store.name}</p>
                      <p className="text-xs text-slate-500 truncate">{store.tagline}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{store.slug}.askindia.shop</p>
                    </div>
                  </div>
                  {statusBadge(store.status)}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Total Sales</p>
                    <p className="font-bold text-slate-900 text-xs">{formatCurrency(store.totalSales)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Orders</p>
                    <p className="font-bold text-slate-900 text-xs">{store.totalOrders}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Commission</p>
                    <p className="font-bold text-emerald-600 text-xs">{store.commissionRate}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500">
                      Owner: <span className="font-medium text-slate-700">{store.ownerName}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Joined {formatDate(store.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button onClick={() => openDetail(store)} className="btn-secondary text-xs py-1.5">
                      <Eye className="h-3.5 w-3.5" /> Details
                    </button>
                    {store.status === 'pending' && (
                      <button onClick={() => handleActivate(store)} className="btn-success text-xs py-1.5">
                        <CheckCircle className="h-3.5 w-3.5" /> Activate
                      </button>
                    )}
                    {store.status === 'active' && (
                      <button onClick={() => handleSuspend(store)} className="btn-danger text-xs py-1.5">
                        <XCircle className="h-3.5 w-3.5" /> Suspend
                      </button>
                    )}
                    {store.status === 'suspended' && (
                      <button onClick={() => handleRestore(store)} className="btn-primary text-xs py-1.5">
                        <RefreshCw className="h-3.5 w-3.5" /> Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Store Slide-over ─────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />
          <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Create New Store</h2>
                <p className="text-xs text-slate-500 mt-0.5">Store will require super admin activation</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">

              {/* Section 1: Store Type */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Store Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'product', label: 'Product Store', desc: 'Sell physical or digital products', icon: ShoppingBag, color: 'indigo' },
                    { value: 'service', label: 'Service Hub', desc: 'Offer professional services', icon: Briefcase, color: 'violet' },
                  ] as const).map(({ value, label, desc, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => setField('storeType', value)}
                      className={clsx(
                        'border-2 rounded-xl p-4 text-left transition-all',
                        form.storeType === value
                          ? color === 'indigo'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-violet-500 bg-violet-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <Icon className={clsx('h-6 w-6 mb-2', form.storeType === value ? (color === 'indigo' ? 'text-indigo-600' : 'text-violet-600') : 'text-slate-400')} />
                      <p className={clsx('font-semibold text-sm', form.storeType === value ? (color === 'indigo' ? 'text-indigo-700' : 'text-violet-700') : 'text-slate-700')}>
                        {label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Section 2: Brand Identity */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Brand Identity</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Store Name <span className="text-red-500">*</span></label>
                    <input
                      className={clsx('input w-full', formErrors.name && 'border-red-400 focus:ring-red-300')}
                      placeholder="e.g. Rahul's Electronics Hub"
                      value={form.name}
                      onChange={e => setField('name', e.target.value)}
                    />
                    {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subdomain / Slug <span className="text-red-500">*</span></label>
                    <input
                      className={clsx('input w-full font-mono text-sm', formErrors.slug && 'border-red-400 focus:ring-red-300')}
                      placeholder="my-store"
                      value={form.slug}
                      onChange={e => {
                        setSlugManuallyEdited(true);
                        setField('slug', slugify(e.target.value));
                      }}
                    />
                    {form.slug && (
                      <p className="text-xs text-slate-500 mt-1">
                        Preview: <span className="font-mono text-indigo-600">{form.slug}.askindia.shop</span>
                      </p>
                    )}
                    {formErrors.slug && <p className="text-xs text-red-500 mt-1">{formErrors.slug}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tagline <span className="text-red-500">*</span></label>
                    <input
                      className={clsx('input w-full', formErrors.tagline && 'border-red-400 focus:ring-red-300')}
                      placeholder="Your short brand promise"
                      value={form.tagline}
                      onChange={e => setField('tagline', e.target.value)}
                    />
                    {formErrors.tagline && <p className="text-xs text-red-500 mt-1">{formErrors.tagline}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      className="input w-full resize-none"
                      rows={3}
                      placeholder="Tell customers about this store..."
                      value={form.description}
                      onChange={e => setField('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Section 3: Visual Identity */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Visual Identity</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Logo Emoji</label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                          style={{ background: form.themeColor + '22' }}
                        >
                          {form.logo || '?'}
                        </div>
                        <input
                          className="input w-20 text-center text-2xl"
                          maxLength={2}
                          value={form.logo}
                          onChange={e => setField('logo', e.target.value)}
                          placeholder="🏪"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Theme Color</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setField('themeColor', c)}
                            className={clsx(
                              'w-7 h-7 rounded-full border-2 transition-all',
                              form.themeColor === c ? 'border-slate-700 scale-110' : 'border-transparent hover:scale-105'
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input
                          type="color"
                          value={form.themeColor}
                          onChange={e => setField('themeColor', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Section 4: Owner Assignment */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Owner Assignment</h3>
                <select
                  className="input w-full"
                  value={form.ownerId}
                  onChange={e => setField('ownerId', e.target.value)}
                >
                  <option value="">No owner yet (invite later)</option>
                  {eligibleOwners.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Only {form.storeType === 'product' ? 'store owners' : 'service providers'} are shown
                </p>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Section 5: Location & Contact */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Location & Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City <span className="text-red-500">*</span></label>
                    <input
                      className={clsx('input w-full', formErrors.city && 'border-red-400')}
                      placeholder="Mumbai"
                      value={form.city}
                      onChange={e => setField('city', e.target.value)}
                    />
                    {formErrors.city && <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input
                      className="input w-full"
                      placeholder="Maharashtra"
                      value={form.state}
                      onChange={e => setField('state', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                    <input
                      className="input w-full"
                      type="email"
                      placeholder="store@email.com"
                      value={form.contactEmail}
                      onChange={e => setField('contactEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                    <input
                      className="input w-full"
                      placeholder="9876543210"
                      value={form.contactPhone}
                      onChange={e => setField('contactPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Section 6: Business Settings */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Business Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Commission Rate % (0–50) <span className="text-red-500">*</span></label>
                    <input
                      className={clsx('input w-full', formErrors.commissionRate && 'border-red-400')}
                      type="number"
                      min={0}
                      max={50}
                      value={form.commissionRate}
                      onChange={e => setField('commissionRate', e.target.value)}
                    />
                    {formErrors.commissionRate && <p className="text-xs text-red-500 mt-1">{formErrors.commissionRate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">GST Number <span className="text-xs text-slate-400">(optional)</span></label>
                    <input
                      className="input w-full"
                      placeholder="22AAAAA0000A1Z5"
                      value={form.gstNumber}
                      onChange={e => setField('gstNumber', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bank Account <span className="text-xs text-slate-400">(optional)</span></label>
                      <input
                        className="input w-full"
                        placeholder="Account number"
                        value={form.bankAccount}
                        onChange={e => setField('bankAccount', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bank IFSC <span className="text-xs text-slate-400">(optional)</span></label>
                      <input
                        className="input w-full"
                        placeholder="HDFC0001234"
                        value={form.bankIfsc}
                        onChange={e => setField('bankIfsc', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleCreateStore} className="btn-primary flex-1 justify-center">
                <Plus className="h-4 w-4" />
                Create Store (Pending Activation)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Store Detail Slide-over ─────────────────────────────────────────── */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedStore(null)}
          />
          <div className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Hero */}
            <div
              className="px-6 pt-6 pb-5 relative"
              style={{ background: `linear-gradient(135deg, ${selectedStore.themeColor}18, ${selectedStore.themeColor}08)` }}
            >
              <button
                onClick={() => setSelectedStore(null)}
                className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-white/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: selectedStore.themeColor + '30' }}
                >
                  {selectedStore.logo}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-bold text-slate-900 text-lg leading-tight">{selectedStore.name}</h2>
                    {statusBadge(selectedStore.status)}
                  </div>
                  <p className="text-sm text-slate-600">{selectedStore.tagline}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {selectedStore.slug}.askindia.shop
                    </span>
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded font-medium',
                      selectedStore.storeType === 'service'
                        ? 'bg-violet-50 text-violet-700'
                        : 'bg-indigo-50 text-indigo-700'
                    )}>
                      {selectedStore.storeType === 'service' ? 'Service Hub' : 'Product Store'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/shop/store/${selectedStore.slug}`)}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Preview Store
              </button>
            </div>

            {/* Detail Tabs */}
            <div className="flex border-b border-slate-200 px-6">
              {([
                { key: 'overview', label: 'Overview', icon: Info },
                { key: 'business', label: 'Business', icon: Building2 },
                { key: 'banking', label: 'Banking', icon: CreditCard },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setDetailTab(key)}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                    detailTab === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6 flex-1">
              {/* Overview Tab */}
              {detailTab === 'overview' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Sales', value: formatCurrency(selectedStore.totalSales) },
                    { label: 'Total Orders', value: String(selectedStore.totalOrders) },
                    { label: 'Commission Rate', value: `${selectedStore.commissionRate}%` },
                    { label: 'Wallet Balance', value: formatCurrency(selectedStore.walletBalance) },
                    { label: 'Owner', value: selectedStore.ownerName },
                    { label: 'Location', value: [selectedStore.city, selectedStore.state].filter(Boolean).join(', ') || '—' },
                    { label: 'Created', value: formatDate(selectedStore.createdAt) },
                    { label: 'Activated', value: selectedStore.activatedAt ? formatDate(selectedStore.activatedAt) : '—' },
                    { label: 'Activated By', value: selectedStore.activatedBy ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                      <p className="font-semibold text-slate-900 text-sm break-words">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Business Tab */}
              {detailTab === 'business' && (
                <div className="space-y-3">
                  {[
                    { label: 'Contact Email', value: selectedStore.contactEmail ?? '—' },
                    { label: 'Contact Phone', value: selectedStore.contactPhone ?? '—' },
                    { label: 'GST Number', value: selectedStore.gstNumber ?? '—' },
                    { label: 'Store Type', value: selectedStore.storeType === 'service' ? 'Service Hub' : 'Product Store' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                      <p className="font-semibold text-slate-900 text-sm">{value}</p>
                    </div>
                  ))}
                  {selectedStore.description && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-0.5">Description</p>
                      <p className="text-sm text-slate-700">{selectedStore.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Banking Tab */}
              {detailTab === 'banking' && (
                <div className="space-y-3">
                  {[
                    { label: 'Bank Account', value: selectedStore.bankAccount ?? '—' },
                    { label: 'Bank IFSC', value: selectedStore.bankIfsc ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                      <p className="font-semibold text-slate-900 text-sm font-mono">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Rejection reason if suspended */}
              {selectedStore.status === 'suspended' && selectedStore.rejectionReason && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selectedStore.rejectionReason}</p>
                  {selectedStore.rejectedAt && (
                    <p className="text-xs text-red-500 mt-1">Rejected on {formatDate(selectedStore.rejectedAt)}</p>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 space-y-3">
              {selectedStore.status === 'pending' && (
                <>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleActivate(selectedStore)}
                      className="btn-success flex-1 justify-center"
                    >
                      <CheckCircle className="h-4 w-4" /> Activate Store
                    </button>
                    <button
                      onClick={() => setShowRejectForm(!showRejectForm)}
                      className="btn-danger flex-1 justify-center"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                  {showRejectForm && (
                    <div className="space-y-2">
                      <textarea
                        className="input w-full resize-none"
                        rows={3}
                        placeholder="Enter rejection reason..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <button
                        onClick={() => handleReject(selectedStore)}
                        disabled={!rejectReason.trim()}
                        className="btn-danger w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  )}
                </>
              )}
              {selectedStore.status === 'active' && (
                <button onClick={() => handleSuspend(selectedStore)} className="btn-danger w-full justify-center">
                  <XCircle className="h-4 w-4" /> Suspend Store
                </button>
              )}
              {selectedStore.status === 'suspended' && (
                <button onClick={() => handleRestore(selectedStore)} className="btn-primary w-full justify-center">
                  <RefreshCw className="h-4 w-4" /> Restore Store
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
