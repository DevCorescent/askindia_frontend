import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { formatCurrency } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { mutations } from '../../lib/dataService';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Product } from '../../types';
import { Search, X, ShoppingBag, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

interface SaleFormData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  quantity: number;
}

export const AgentProducts: React.FC = () => {
  const { currentUser, products, stores, agents, addOrder } = useAppStore();

  const agent = agents.find(a => a.id === currentUser?.id);
  const agentCity = agent?.city ?? '';
  const agentRate = agent?.commissionRate ?? 0;

  const availableProducts = products.filter(p =>
    p.status === 'active' &&
    (p.availableCities.length === 0 || p.availableCities.includes(agentCity))
  );

  const categories = Array.from(new Set(availableProducts.map(p => p.category)));

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<SaleFormData>({ customerName: '', customerPhone: '', customerAddress: '', quantity: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');

  const filtered = availableProducts.filter(p => {
    const matchSearch = search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand ?? '').toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setForm({ customerName: '', customerPhone: '', customerAddress: '', quantity: 1 });
    setFormError('');
    setSuccessMessage('');
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setSuccessMessage('');
    setFormError('');
  };

  const handleConfirmSale = async () => {
    if (!selectedProduct || !currentUser || !agent) return;
    if (!form.customerName.trim()) { setFormError('Customer name is required.'); return; }
    if (!form.customerPhone.trim()) { setFormError('Customer phone is required.'); return; }
    if (!form.customerAddress.trim()) { setFormError('Customer address is required.'); return; }

    setFormError('');
    setSubmitting(true);

    const subtotal = form.quantity * selectedProduct.price;
    const agentCommissionAmount = Math.round((agentRate / 100) * subtotal);
    const storeCommission = Math.round((selectedProduct.commission / 100) * subtotal);
    // adminRevenue = total minus agent commission minus store commission
    const adminRevenue = Math.max(0, subtotal - agentCommissionAmount - storeCommission);

    // Find the store that owns this product (fallback to first active store)
    const store = stores.find(s => s.status === 'active') ?? stores[0];

    const orderData: Omit<import('../../types').Order, 'id'> = {
      customerId: `walk_in_${Date.now()}`,
      customerName: form.customerName.trim(),
      customerEmail: `${form.customerPhone.trim()}@agent.askindia`,
      storeId: store?.id ?? '',
      storeName: store?.name ?? 'AskIndia Store',
      items: [{
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productIcon: selectedProduct.imageIcon,
        productColor: selectedProduct.imageColor,
        quantity: form.quantity,
        price: selectedProduct.price,
        commission: selectedProduct.commission,
      }],
      subtotal,
      total: subtotal,
      commissionTotal: storeCommission,
      adminRevenue,
      status: 'pending',
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      address: form.customerAddress.trim(),
      city: agentCity,
      agentId: currentUser.id,
      agentName: currentUser.name,
      agentCode: agent.agentCode,
      agentCommission: agentCommissionAmount,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const dbId = await mutations.createOrder(orderData);
        addOrder(orderData, dbId);
      } catch (err) {
        console.error('[AgentProducts] createOrder DB error:', err);
        addOrder(orderData); // fallback to local
      }
    } else {
      addOrder(orderData);
    }

    setSubmitting(false);
    setSuccessMessage(`Sale recorded! You earned ${formatCurrency(agentCommissionAmount)} commission.`);
  };

  return (
    <AppLayout title="Sell Products">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Products to Sell</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {availableProducts.length} products available in {agentCity}
            </p>
          </div>
          <div className="text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
            Your commission: {agentRate}% per sale
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="input max-w-[200px]"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="card py-20 text-center text-slate-400">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(product => {
              const commissionPreview = Math.round((agentRate / 100) * product.price);
              const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);
              return (
                <div key={product.id} className="card overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className={`h-36 bg-gradient-to-br ${product.imageColor} flex items-center justify-center text-5xl`}>
                    {product.imageIcon}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 font-medium">{product.category}</p>
                      <p className="font-semibold text-slate-900 mt-0.5 line-clamp-2">{product.name}</p>
                      {product.brand && <p className="text-xs text-slate-500 mt-0.5">{product.brand}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-slate-900">{formatCurrency(product.price)}</span>
                        {discountPct > 0 && (
                          <>
                            <span className="text-sm text-slate-400 line-through">{formatCurrency(product.mrp)}</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                              {discountPct}% off
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 rounded-lg px-2.5 py-1.5">
                        Your commission: {formatCurrency(commissionPreview)} per sale
                      </p>
                    </div>
                    <button
                      onClick={() => openModal(product)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Record Sale
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Sale Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-medium">Record Sale</p>
                <h3 className="font-bold text-slate-900">{selectedProduct.name}</h3>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {successMessage ? (
              <div className="p-8 text-center">
                <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
                <p className="text-lg font-bold text-slate-900">Sale Recorded!</p>
                <p className="text-sm text-slate-500 mt-2">{successMessage}</p>
                <button
                  onClick={closeModal}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Customer fields */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Name <span className="text-red-500">*</span></label>
                  <input
                    className="input"
                    placeholder="Enter customer name"
                    value={form.customerName}
                    onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Phone <span className="text-red-500">*</span></label>
                  <input
                    className="input"
                    placeholder="Enter 10-digit mobile number"
                    value={form.customerPhone}
                    onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Address <span className="text-red-500">*</span></label>
                  <textarea
                    className="input min-h-[80px] resize-none"
                    placeholder="Enter full delivery address"
                    value={form.customerAddress}
                    onChange={e => setForm(f => ({ ...f, customerAddress: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                      className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >−</button>
                    <span className="w-12 text-center font-bold text-slate-900">{form.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, quantity: f.quantity + 1 }))}
                      className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery City</label>
                  <input className="input bg-slate-50 text-slate-500 cursor-not-allowed" value={agentCity} readOnly />
                </div>

                {/* Summary */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Order Summary</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal ({form.quantity} × {formatCurrency(selectedProduct.price)})</span>
                    <span className="font-medium">{formatCurrency(form.quantity * selectedProduct.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-emerald-600">
                    <span>Your Commission ({agentRate}%)</span>
                    <span>{formatCurrency(Math.round((agentRate / 100) * form.quantity * selectedProduct.price))}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 border-t border-slate-200 pt-2 mt-2">
                    <span>Order placed by</span>
                    <span>{currentUser?.name} ({agent?.agentCode})</span>
                  </div>
                </div>

                {formError && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <span className="flex-shrink-0 mt-0.5">⚠</span>
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  onClick={handleConfirmSale}
                  disabled={submitting}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-colors',
                    submitting ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
                  )}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confirming…
                    </span>
                  ) : 'Confirm Sale'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};
