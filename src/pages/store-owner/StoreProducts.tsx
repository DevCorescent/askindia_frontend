import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import { mutations, dataLoaders } from '../../lib/dataService';
import { formatCurrency, PRODUCT_CATEGORIES, resolveCategoryId } from '../../data/mockData';
import {
  Plus, Edit2, Trash2, Package, Search, AlertTriangle,
  RotateCcw, Loader2, Tag, TrendingUp,
} from 'lucide-react';
import type { Product } from '../../types';

const COLOR_OPTIONS = [
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-violet-400 to-violet-600',
  'from-orange-400 to-orange-600',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-amber-600',
  'from-cyan-400 to-cyan-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
];

// Unified with the platform-wide category list so store products are filterable everywhere.
const CATEGORIES = PRODUCT_CATEGORIES.map(c => c.name);

type StatusFilter = 'all' | 'active' | 'draft' | 'out_of_stock';

interface FormData {
  name: string;
  description: string;
  price: string;
  mrp: string;
  stock: string;
  commission: string;
  category: string;
  imageIcon: string;
  imageColor: string;
  status: 'active' | 'draft';
}

const EMPTY_FORM: FormData = {
  name: '', description: '', price: '', mrp: '', stock: '0',
  commission: '10', category: PRODUCT_CATEGORIES[0].name, imageIcon: '📦',
  imageColor: 'from-blue-400 to-blue-600', status: 'active',
};

export const StoreProducts: React.FC = () => {
  const { currentUser } = useAppStore();

  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [form, setForm]               = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState('');

  const [restockId, setRestockId]     = useState<string | null>(null);
  const [restockQty, setRestockQty]   = useState('');
  const [restocking, setRestocking]   = useState(false);

  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const refresh = async () => {
    try {
      const data = await dataLoaders.loadProducts(currentUser!.role, currentUser!.storeId ?? undefined);
      setProducts(data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() =>
    products.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    }),
    [products, search, statusFilter],
  );

  const stats = useMemo(() => ({
    total:      products.length,
    active:     products.filter(p => p.status === 'active').length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
    draft:      products.filter(p => p.status === 'draft').length,
    totalSold:  products.reduce((s, p) => s + (p.sold ?? 0), 0),
  }), [products]);

  const discountPct = (price: number, mrp?: number) =>
    mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : null;

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setFormError(''); setShowForm(true); };
  const openEdit = (p: Product) => {
    setForm({
      name:        p.name,
      description: p.description ?? '',
      price:       String(p.price),
      mrp:         p.mrp ? String(p.mrp) : '',
      stock:       String(p.stock ?? 0),
      commission:  String(p.commission ?? 10),
      category:    p.category ?? CATEGORIES[0],
      imageIcon:   p.imageIcon ?? '📦',
      imageColor:  p.imageColor ?? COLOR_OPTIONS[0],
      status:      p.status === 'out_of_stock' ? 'active' : p.status as 'active' | 'draft',
    });
    setEditId(p.id);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim())                                    { setFormError('Product name is required.'); return; }
    if (!form.price || Number(form.price) <= 0)              { setFormError('Valid selling price is required.'); return; }
    if (form.mrp && Number(form.mrp) <= Number(form.price)) { setFormError('MRP must be greater than selling price.'); return; }

    setSaving(true); setFormError('');
    try {
      const payload = {
        name:           form.name.trim(),
        description:    form.description.trim(),
        price:          Number(form.price),
        mrp:            form.mrp ? Number(form.mrp) : Number(form.price),
        stock:          Number(form.stock) || 0,
        commission:     Number(form.commission) || 10,
        categoryId:     resolveCategoryId({ category: form.category }),
        category:       form.category,
        imageIcon:      form.imageIcon || '📦',
        imageColor:     form.imageColor,
        status:         form.status,
        storeId:        currentUser?.storeId ?? undefined,
        featured:       false,
        availableCities: [],
        tags:           [],
        highlights:     [],
        specifications: [],
        brand:          '',
        warranty:       '',
        returnPolicy:   '',
        images:         [],
        sold:           0,
      };

      if (editId) {
        await mutations.updateProduct(editId, payload);
      } else {
        await mutations.createProduct(payload);
      }
      await refresh();
      setShowForm(false);
    } catch (e) {
      setFormError((e as Error).message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Stock helpers ─────────────────────────────────────────────────────────
  const handleMarkOutOfStock = async (p: Product) => {
    try {
      await mutations.updateProduct(p.id, { status: 'out_of_stock', stock: 0 });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, status: 'out_of_stock', stock: 0 } : x));
    } catch { /* silent */ }
  };

  const handleRestock = async () => {
    const qty = Number(restockQty);
    if (!qty || qty <= 0) return;
    setRestocking(true);
    try {
      await mutations.updateProduct(restockId!, { status: 'active', stock: qty });
      setProducts(prev => prev.map(p => p.id === restockId ? { ...p, status: 'active', stock: qty } : p));
      setRestockId(null);
      setRestockQty('');
    } catch { /* silent */ } finally { setRestocking(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await mutations.deleteProduct(deleteId!);
      setProducts(prev => prev.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch { /* silent */ } finally { setDeleting(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout title="My Products">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Products</h2>
            <p className="text-sm text-slate-500 mt-0.5">{products.length} products in your store</p>
          </div>
          <button onClick={openAdd} className="btn-primary gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active',       value: stats.active,     color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
            { label: 'Out of Stock', value: stats.outOfStock, color: 'text-red-600',     bg: 'bg-red-50 border-red-100' },
            { label: 'Drafts',       value: stats.draft,      color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200' },
            { label: 'Total Sold',   value: stats.totalSold,  color: 'text-brand-600',   bg: 'bg-brand-50 border-brand-100' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search by name or category…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'out_of_stock', 'draft'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}>
                {s === 'all' ? 'All' : s === 'out_of_stock' ? 'Out of Stock' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Product list */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading products…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                {products.length === 0 ? 'No products yet' : 'No products match your filter'}
              </p>
              {products.length === 0 && (
                <button onClick={openAdd} className="btn-primary mt-4 gap-2">
                  <Plus className="h-4 w-4" /> Add your first product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-600 font-medium">Product</th>
                    <th className="text-right px-4 py-3 text-slate-600 font-medium">Price / Offer</th>
                    <th className="text-right px-4 py-3 text-slate-600 font-medium">Stock</th>
                    <th className="text-center px-4 py-3 text-slate-600 font-medium">Status</th>
                    <th className="text-right px-4 py-3 text-slate-600 font-medium hidden sm:table-cell">Sold</th>
                    <th className="text-center px-4 py-3 text-slate-600 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(p => {
                    const disc = discountPct(p.price, p.mrp);
                    const lowStock = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        {/* Product */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.imageColor} flex items-center justify-center text-xl flex-shrink-0`}>
                              {p.imageIcon}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{p.name}</p>
                              <p className="text-xs text-slate-400">{p.category}</p>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-slate-900">{formatCurrency(p.price)}</p>
                          {p.mrp && p.mrp > p.price && (
                            <p className="text-xs text-slate-400 line-through">{formatCurrency(p.mrp)}</p>
                          )}
                          {disc && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
                              <Tag className="h-3 w-3" />{disc}% off
                            </span>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            !p.stock || p.stock === 0 ? 'text-red-600' :
                            lowStock ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                            {p.stock ?? 0}
                          </span>
                          {lowStock && (
                            <p className="text-[10px] text-amber-500 font-medium">Low stock</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.status === 'active'       ? 'bg-emerald-100 text-emerald-700' :
                            p.status === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                                                         'bg-slate-100 text-slate-600'
                          }`}>
                            {p.status === 'active'       ? '● Active' :
                             p.status === 'out_of_stock' ? '● Out of Stock' : '● Draft'}
                          </span>
                        </td>

                        {/* Sold */}
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <TrendingUp className="h-3 w-3 text-slate-400" />
                            {p.sold ?? 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {p.status === 'out_of_stock' ? (
                              <button
                                onClick={() => { setRestockId(p.id); setRestockQty(''); }}
                                title="Restock"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMarkOutOfStock(p)}
                                title="Mark Out of Stock"
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </button>
                            )}
                            <button onClick={() => openEdit(p)} title="Edit" className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteId(p.id)} title="Delete" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-6">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">{editId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${form.imageColor} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {form.imageIcon || '📦'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{form.name || 'Product Name'}</p>
                  <p className="text-sm text-slate-400">{form.category}</p>
                  {form.price && (
                    <p className="text-sm font-medium text-brand-600">
                      {formatCurrency(Number(form.price))}
                      {form.mrp && Number(form.mrp) > Number(form.price) && (
                        <span className="ml-2 text-slate-400 line-through text-xs">{formatCurrency(Number(form.mrp))}</span>
                      )}
                      {form.mrp && Number(form.mrp) > Number(form.price) && (
                        <span className="ml-1 text-emerald-600 text-xs">
                          {Math.round((1 - Number(form.price) / Number(form.mrp)) * 100)}% off
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cotton T-Shirt" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description…" />
              </div>

              {/* Price & MRP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Selling Price (₹) <span className="text-red-500">*</span></label>
                  <input className="input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="499" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    MRP / Original Price (₹)
                    <span className="text-xs text-slate-400 ml-1">for offer %</span>
                  </label>
                  <input className="input" type="number" min="0" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} placeholder="699" />
                </div>
              </div>

              {/* Stock & Commission */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Stock Quantity</label>
                  <input className="input" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Agent Commission %</label>
                  <input className="input" type="number" min="0" max="50" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} placeholder="10" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Visibility</label>
                <div className="flex gap-3">
                  {(['active', 'draft'] as const).map(s => (
                    <label key={s} className={`flex items-center gap-2 flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.status === s ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input type="radio" name="status" checked={form.status === s} onChange={() => setForm(f => ({ ...f, status: s }))} className="text-brand-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 capitalize">{s}</p>
                        <p className="text-xs text-slate-400">{s === 'active' ? 'Visible in shop' : 'Hidden from shop'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Icon & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Icon (emoji)</label>
                  <input className="input text-2xl text-center" value={form.imageIcon} onChange={e => setForm(f => ({ ...f, imageIcon: e.target.value }))} placeholder="📦" maxLength={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Card Colour</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_OPTIONS.map(c => (
                      <button key={c} type="button"
                        onClick={() => setForm(f => ({ ...f, imageColor: c }))}
                        className={`w-7 h-7 rounded-full bg-gradient-to-br ${c} transition-all ${
                          form.imageColor === c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{formError}</p>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center gap-2">
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : editId ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Restock Modal ──────────────────────────────────────────────────── */}
      {restockId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg text-center mb-1">Restock Product</h3>
            <p className="text-sm text-slate-500 text-center mb-4">Enter the new stock quantity to make this product active again.</p>
            <input
              className="input mb-4 text-center text-lg font-semibold"
              type="number" min="1"
              value={restockQty}
              onChange={e => setRestockQty(e.target.value)}
              placeholder="e.g. 50"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setRestockId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={handleRestock}
                disabled={!restockQty || Number(restockQty) <= 0 || restocking}
                className="btn-primary flex-1 justify-center gap-2"
              >
                {restocking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Delete Product?</h3>
            <p className="text-sm text-slate-500 mb-5">This cannot be undone. The product will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
