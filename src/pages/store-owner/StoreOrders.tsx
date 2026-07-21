import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import type { Order } from '../../types';
import { Search, Eye, Download, Check, Package, Truck, PackageCheck, X, Clock } from 'lucide-react';
import { InvoiceModal } from '../../components/InvoiceTemplate';
import { ProductImage } from '../../components/ui/ProductImage';

// Fulfilment lifecycle the store owner drives (mirrors the admin controls).
const FLOW: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered'];
const STEPS: { key: Order['status']; label: string; icon: React.ElementType }[] = [
  { key: 'pending',    label: 'Order Placed', icon: Check },
  { key: 'processing', label: 'Processing',   icon: Package },
  { key: 'shipped',    label: 'Shipped',      icon: Truck },
  { key: 'delivered',  label: 'Delivered',    icon: PackageCheck },
];

export const StoreOrders: React.FC = () => {
  const { currentUser, orders, stores, products } = useAppStore();
  // Resolve an order line-item to its live product visual (real photo when available).
  const itemVisual = (item: { productId?: string; productName: string; productIcon: string; productColor: string }) => {
    const prod = products.find(p => p.id === item.productId);
    return {
      name:       item.productName,
      thumbnail:  prod?.thumbnail,
      images:     prod?.images,
      imageColor: item.productColor,
      imageIcon:  item.productIcon,
    };
  };
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  const myStore = stores.find(s => s.id === currentUser?.storeId);

  // Backend already scopes orders to this store; filter only if storeId is available
  const myOrders = currentUser?.storeId
    ? orders.filter(o => o.storeId === currentUser.storeId)
    : orders;
  const filtered = myOrders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AppLayout title="My Orders">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Orders</h2>
            <p className="text-sm text-slate-500 mt-0.5">{myOrders.length} total orders from your store</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  statusFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                }`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && ` (${myOrders.filter(o => o.status === s).length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Order ID</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Order Total</th>
                  <th className="table-th">My Commission</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="table-td font-mono text-xs text-brand-600">#{order.id.toUpperCase()}</td>
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-sm">{order.customerName}</p>
                        <p className="text-xs text-slate-400">{order.city}</p>
                        {order.agentId && (
                          <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 mt-1">
                            🤝 via {order.agentName ?? 'Agent'} ({order.agentCode})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-td text-sm">
                      <div className="flex -space-x-1">
                        {order.items.slice(0, 3).map((item, i) => (
                          <ProductImage key={i} product={itemVisual(item)} emojiClass="text-sm" className="w-7 h-7 rounded-lg border-2 border-white" />
                        ))}
                        {order.items.length > 3 && <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border-2 border-white">+{order.items.length - 3}</div>}
                      </div>
                    </td>
                    <td className="table-td font-semibold">{formatCurrency(order.total)}</td>
                    <td className="table-td">
                      <span className="font-bold text-emerald-600">{formatCurrency(order.commissionTotal)}</span>
                    </td>
                    <td className="table-td text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                    <td className="table-td">{statusBadge(order.status)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="View details">
                          <Eye className="h-4 w-4" />
                        </button>
                        {order.status === 'delivered' && (
                          <button onClick={() => setInvoiceOrder(order)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Download Invoice">
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-400 text-sm">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          invoiceSettings={myStore?.invoiceSettings}
          type="product"
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details" size="lg">
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-brand-600 font-bold">#{selectedOrder.id.toUpperCase()}</p>
              {statusBadge(selectedOrder.status)}
            </div>

            {/* Fulfilment tracker + controls */}
            {selectedOrder.status === 'cancelled' ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                <X className="h-5 w-5" />
                <div>
                  <p className="font-semibold text-sm">Order Cancelled</p>
                  {selectedOrder.cancelReason && <p className="text-xs text-red-600">{selectedOrder.cancelReason}</p>}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                {/* Stepper */}
                <div className="flex items-center">
                  {STEPS.map((step, i) => {
                    const curIdx = FLOW.indexOf(selectedOrder.status);
                    const done = i <= curIdx;
                    const Icon = step.icon;
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            done ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className={`text-[11px] font-medium ${done ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 -mt-5 ${i < curIdx ? 'bg-brand-600' : 'bg-slate-200'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Read-only status note */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                  {selectedOrder.status === 'delivered' ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                      <PackageCheck className="h-4 w-4" /> Order delivered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
                      <Clock className="h-4 w-4 text-brand-500" />
                      Currently <span className="font-semibold text-slate-700 capitalize">{selectedOrder.status}</span>
                    </span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">Fulfilment is updated by AskIndia</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Customer</p>
                <p className="font-semibold">{selectedOrder.customerName}</p>
                <p className="text-sm text-slate-500">{selectedOrder.address}, {selectedOrder.city}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Payment</p>
                <p className="font-semibold uppercase">{selectedOrder.paymentMethod}</p>
                {statusBadge(selectedOrder.paymentStatus)}
              </div>
            </div>
            <div className="space-y-2">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ProductImage product={itemVisual(item)} emojiClass="text-base" className="w-9 h-9 rounded-lg" />
                    <div>
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                    <p className="text-xs text-emerald-600">Your earn: {formatCurrency(item.price * item.quantity * item.commission / 100)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-800">Your Commission Earned</span>
                <span className="text-2xl font-bold text-emerald-700">{formatCurrency(selectedOrder.commissionTotal)}</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">Order Total: {formatCurrency(selectedOrder.total)}</p>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};
