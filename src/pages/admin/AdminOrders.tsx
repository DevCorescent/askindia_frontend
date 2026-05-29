import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import type { Order, ServiceOrder } from '../../types';
import { Search, Eye, ShoppingCart, Briefcase, Calendar, MapPin, CheckCircle, XCircle, ChevronRight, Clock, PlayCircle, CalendarCheck } from 'lucide-react';
import clsx from 'clsx';

const STATUS_FLOW: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered'];

const SERVICE_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',   dot: 'bg-amber-500' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',       dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', dot: 'bg-violet-500' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-700 ring-1 ring-red-200',         dot: 'bg-red-500' },
};

const SvcStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = SERVICE_STATUS_CONFIG[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const NEXT_SERVICE_STATUS: Partial<Record<ServiceOrder['status'], ServiceOrder['status']>> = {
  pending: 'confirmed',
  confirmed: 'in_progress',
  in_progress: 'completed',
};

const SERVICE_TIMELINE: ServiceOrder['status'][] = ['pending', 'confirmed', 'in_progress', 'completed'];

const payMethodIcon: Record<string, string> = {
  card: '💳', upi: '📱', wallet: '👛', cod: '💵',
};

export const AdminOrders: React.FC = () => {
  const { orders, serviceOrders, updateOrder, updateServiceOrder } = useAppStore();

  const [tab, setTab] = useState<'products' | 'services'>('products');

  // Product orders state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Service orders state
  const [svcSearch, setSvcSearch] = useState('');
  const [svcStatusFilter, setSvcStatusFilter] = useState('all');
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null);

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.storeName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredServiceOrders = serviceOrders
    .filter(o => {
      const matchSearch = svcSearch === '' ||
        o.id.toLowerCase().includes(svcSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(svcSearch.toLowerCase()) ||
        o.serviceTitle.toLowerCase().includes(svcSearch.toLowerCase()) ||
        o.providerName.toLowerCase().includes(svcSearch.toLowerCase());
      const matchStatus = svcStatusFilter === 'all' || o.status === svcStatusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleUpdateStatus = (id: string, status: Order['status']) => {
    updateOrder(id, { status });
    if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, status } : null);
  };

  const handleAdvanceSvc = (order: ServiceOrder) => {
    const next = NEXT_SERVICE_STATUS[order.status];
    if (next) {
      updateServiceOrder(order.id, { status: next });
      if (selectedServiceOrder?.id === order.id) setSelectedServiceOrder({ ...order, status: next });
    }
  };

  const handleCancelSvc = (order: ServiceOrder) => {
    updateServiceOrder(order.id, { status: 'cancelled' });
    if (selectedServiceOrder?.id === order.id) setSelectedServiceOrder({ ...order, status: 'cancelled' });
  };

  return (
    <AppLayout title="Order Management">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Orders & Bookings</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {orders.length} product order{orders.length !== 1 ? 's' : ''} · {serviceOrders.length} service booking{serviceOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('products')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'products' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            Product Orders
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-bold', tab === 'products' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600')}>
              {orders.length}
            </span>
          </button>
          <button
            onClick={() => setTab('services')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'services' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Briefcase className="h-4 w-4" />
            Service Bookings
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-bold', tab === 'services' ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600')}>
              {serviceOrders.length}
            </span>
          </button>
        </div>

        {/* ── Product Orders Tab ─────────────────────────────────────────── */}
        {tab === 'products' && (
          <>
            {/* Status quick filters */}
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {(['pending', 'processing', 'shipped', 'delivered'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                  className={`px-3 py-1.5 rounded-full border transition-colors ${
                    statusFilter === s ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)} ({orders.filter(o => o.status === s).length})
                </button>
              ))}
            </div>

            <div className="card p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className="input pl-9" placeholder="Search by order ID, customer, store..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th">Order ID</th>
                      <th className="table-th">Customer</th>
                      <th className="table-th">Store</th>
                      <th className="table-th">Agent</th>
                      <th className="table-th">Items</th>
                      <th className="table-th">Total</th>
                      <th className="table-th">Commission</th>
                      <th className="table-th">Payment</th>
                      <th className="table-th">Date</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="table-td font-mono text-xs text-brand-600">#{order.id.toUpperCase()}</td>
                        <td className="table-td">
                          <div>
                            <p className="font-medium text-sm">{order.customerName}</p>
                            <p className="text-xs text-slate-400">{order.city}</p>
                          </div>
                        </td>
                        <td className="table-td text-sm text-slate-600">{order.storeName}</td>
                        <td className="table-td">
                          {order.agentId ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5">
                              🤝 {order.agentName} ({order.agentCode})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="table-td text-sm text-slate-600">{order.items.length} item{order.items.length > 1 ? 's' : ''}</td>
                        <td className="table-td font-semibold">{formatCurrency(order.total)}</td>
                        <td className="table-td">
                          <span className="text-emerald-600 font-medium">{formatCurrency(order.commissionTotal)}</span>
                        </td>
                        <td className="table-td text-lg" title={order.paymentMethod}>{payMethodIcon[order.paymentMethod]}</td>
                        <td className="table-td text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                        <td className="table-td">{statusBadge(order.status)}</td>
                        <td className="table-td">
                          <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No product orders found</p>
                  <p className="text-sm mt-1">
                    {orders.length === 0 ? 'Customer orders will appear here once placed' : 'Try adjusting your search or filters'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Service Bookings Tab ───────────────────────────────────────── */}
        {tab === 'services' && (
          <>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSvcStatusFilter(svcStatusFilter === s ? 'all' : s)}
                  className={`px-3 py-1.5 rounded-full border transition-colors ${
                    svcStatusFilter === s ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
                  }`}
                >
                  {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} ({serviceOrders.filter(o => o.status === s).length})
                </button>
              ))}
            </div>

            <div className="card p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className="input pl-9" placeholder="Search by booking ID, customer, service, provider..." value={svcSearch} onChange={e => setSvcSearch(e.target.value)} />
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th">Booking ID</th>
                      <th className="table-th">Customer</th>
                      <th className="table-th">Service</th>
                      <th className="table-th">Provider</th>
                      <th className="table-th">Agent</th>
                      <th className="table-th">City</th>
                      <th className="table-th">Scheduled</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServiceOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="table-td font-mono text-xs text-violet-600 font-semibold">
                          #{order.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="table-td">
                          <div>
                            <p className="font-medium text-sm">{order.customerName}</p>
                            <p className="text-xs text-slate-400">{order.customerEmail}</p>
                          </div>
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${order.serviceColor} flex items-center justify-center text-sm flex-shrink-0`}>
                              {order.serviceIcon}
                            </div>
                            <span className="text-sm text-slate-700 truncate max-w-[120px]">{order.serviceTitle}</span>
                          </div>
                        </td>
                        <td className="table-td text-sm text-slate-600">{order.providerName}</td>
                        <td className="table-td">
                          {order.agentId ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                              🤝 {order.agentName} <span className="font-mono opacity-75">({order.agentCode})</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="table-td text-sm text-slate-600">{order.city}</td>
                        <td className="table-td text-xs text-slate-500">{formatDate(order.scheduledDate)}</td>
                        <td className="table-td font-semibold">{formatCurrency(order.amount)}</td>
                        <td className="table-td"><SvcStatusBadge status={order.status} /></td>
                        <td className="table-td">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setSelectedServiceOrder(order)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            {NEXT_SERVICE_STATUS[order.status] && (
                              <button onClick={() => handleAdvanceSvc(order)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title={`Mark as ${SERVICE_STATUS_CONFIG[NEXT_SERVICE_STATUS[order.status]!]?.label}`}>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            )}
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                              <button onClick={() => handleCancelSvc(order)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Cancel booking">
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredServiceOrders.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No service bookings found</p>
                  <p className="text-sm mt-1">
                    {serviceOrders.length === 0 ? 'Customer bookings will appear here once placed' : 'Try adjusting your search or filters'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Product Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details" size="lg">
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Order ID</p>
                <p className="font-mono text-brand-600 font-bold">#{selectedOrder.id.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Placed on</p>
                <p className="font-medium text-sm">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              {statusBadge(selectedOrder.status)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Customer</p>
                <p className="font-semibold text-slate-900">{selectedOrder.customerName}</p>
                <p className="text-sm text-slate-500">{selectedOrder.customerEmail}</p>
                <p className="text-sm text-slate-500 mt-1">{selectedOrder.address}, {selectedOrder.city}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Store</p>
                <p className="font-semibold text-slate-900">{selectedOrder.storeName}</p>
                <p className="text-sm text-slate-500 mt-1">Payment: {selectedOrder.paymentMethod.toUpperCase()}</p>
                {statusBadge(selectedOrder.paymentStatus)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Order Items</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.productColor} flex items-center justify-center text-lg`}>
                        {item.productIcon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-xs text-emerald-600">+{formatCurrency(item.price * item.quantity * item.commission / 100)} comm.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span></div>
              <div className="flex justify-between text-sm text-emerald-600"><span>Store Commission</span><span className="font-medium">+{formatCurrency(selectedOrder.commissionTotal)}</span></div>
              <div className="flex justify-between text-sm text-slate-500"><span>Admin Revenue</span><span>{formatCurrency(selectedOrder.adminRevenue)}</span></div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-2 mt-2"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div>
            </div>
            {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_FLOW.filter(s => STATUS_FLOW.indexOf(s) > STATUS_FLOW.indexOf(selectedOrder.status)).map(s => (
                    <button key={s} onClick={() => handleUpdateStatus(selectedOrder.id, s)} className="btn-primary text-sm py-1.5">
                      Mark as {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                    Cancel Order
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Service Booking Detail Modal */}
      <Modal isOpen={!!selectedServiceOrder} onClose={() => setSelectedServiceOrder(null)} title="Booking Details" size="lg">
        {selectedServiceOrder && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Booking ID</p>
                <p className="font-mono text-violet-600 font-bold text-lg">#{selectedServiceOrder.id.slice(-8).toUpperCase()}</p>
              </div>
              <SvcStatusBadge status={selectedServiceOrder.status} />
            </div>

            {/* Status timeline */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Status Timeline</p>
              <div className="flex items-center">
                {SERVICE_TIMELINE.map((s, i) => {
                  const timelineIdx = SERVICE_TIMELINE.indexOf(selectedServiceOrder.status as ServiceOrder['status']);
                  const done = i <= timelineIdx && selectedServiceOrder.status !== 'cancelled';
                  const labels = ['Pending', 'Confirmed', 'In Progress', 'Completed'];
                  const icons: Record<string, React.ReactNode> = {
                    pending: <Clock className="h-3.5 w-3.5" />,
                    confirmed: <CheckCircle className="h-3.5 w-3.5" />,
                    in_progress: <PlayCircle className="h-3.5 w-3.5" />,
                    completed: <CalendarCheck className="h-3.5 w-3.5" />,
                  };
                  return (
                    <React.Fragment key={s}>
                      <div className="flex flex-col items-center">
                        <div className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                          done ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-400'
                        )}>
                          {icons[s]}
                        </div>
                        <span className={clsx('text-xs mt-1 font-medium whitespace-nowrap', done ? 'text-violet-600' : 'text-slate-400')}>
                          {labels[i]}
                        </span>
                      </div>
                      {i < SERVICE_TIMELINE.length - 1 && (
                        <div className={clsx('flex-1 h-0.5 mx-1 mb-4', done && i < SERVICE_TIMELINE.indexOf(selectedServiceOrder.status as ServiceOrder['status']) ? 'bg-violet-400' : 'bg-slate-200')} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Customer</p>
                <p className="font-semibold text-slate-900">{selectedServiceOrder.customerName}</p>
                <p className="text-sm text-slate-500">{selectedServiceOrder.customerEmail}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Service</p>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedServiceOrder.serviceColor} flex items-center justify-center text-sm`}>
                    {selectedServiceOrder.serviceIcon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{selectedServiceOrder.serviceTitle}</p>
                    <p className="text-xs text-slate-500">by {selectedServiceOrder.providerName}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Schedule</p>
                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  {formatDate(selectedServiceOrder.scheduledDate)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Location</p>
                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 text-violet-500" />
                  {selectedServiceOrder.city}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedServiceOrder.address}</p>
              </div>
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-violet-500 uppercase">Booking Amount</p>
                <p className="text-2xl font-bold text-violet-700 mt-0.5">{formatCurrency(selectedServiceOrder.amount)}</p>
              </div>
            </div>

            {selectedServiceOrder.status !== 'completed' && selectedServiceOrder.status !== 'cancelled' && (
              <div className="flex gap-3 pt-2">
                {NEXT_SERVICE_STATUS[selectedServiceOrder.status] && (
                  <button
                    onClick={() => handleAdvanceSvc(selectedServiceOrder)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                    Mark as {SERVICE_STATUS_CONFIG[NEXT_SERVICE_STATUS[selectedServiceOrder.status]!]?.label}
                  </button>
                )}
                <button
                  onClick={() => handleCancelSvc(selectedServiceOrder)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  <XCircle className="h-4 w-4" /> Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};
