import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import type { ServiceOrder } from '../../types';
import {
  Search, Eye, Calendar, MapPin, User, IndianRupee,
  ChevronRight, CheckCircle, XCircle, Clock, PlayCircle,
  CalendarCheck, Download,
} from 'lucide-react';
import { InvoiceModal } from '../../components/InvoiceTemplate';
import clsx from 'clsx';

// ─── Types & Constants ────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface StatusConfig {
  label: string;
  badgeCls: string;
  dotColor: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: { label: 'Pending', badgeCls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dotColor: 'bg-amber-500' },
  confirmed: { label: 'Confirmed', badgeCls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', dotColor: 'bg-blue-500' },
  in_progress: { label: 'In Progress', badgeCls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', dotColor: 'bg-violet-500' },
  completed: { label: 'Completed', badgeCls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dotColor: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', badgeCls: 'bg-red-50 text-red-700 ring-1 ring-red-200', dotColor: 'bg-red-500' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, badgeCls: 'bg-slate-100 text-slate-600', dotColor: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badgeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
};

// Status flow: pending → confirmed → in_progress → completed; any → cancelled
const NEXT_STATUS: Partial<Record<ServiceOrder['status'], ServiceOrder['status']>> = {
  pending: 'confirmed',
  confirmed: 'in_progress',
  in_progress: 'completed',
};

const STATUS_TIMELINE: ServiceOrder['status'][] = ['pending', 'confirmed', 'in_progress', 'completed'];

// ─── Main Component ───────────────────────────────────────────────────────────

export const ServiceProviderOrders: React.FC = () => {
  const { currentUser, serviceOrders, updateServiceOrder, providerInvoiceSettings } = useAppStore();
  const providerId = currentUser?.id ?? '';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<ServiceOrder | null>(null);

  const myOrders = serviceOrders.filter(o => o.providerId === providerId);

  const counts: Record<StatusFilter, number> = {
    all: myOrders.length,
    pending: myOrders.filter(o => o.status === 'pending').length,
    confirmed: myOrders.filter(o => o.status === 'confirmed').length,
    in_progress: myOrders.filter(o => o.status === 'in_progress').length,
    completed: myOrders.filter(o => o.status === 'completed').length,
    cancelled: myOrders.filter(o => o.status === 'cancelled').length,
  };

  const filtered = myOrders
    .filter(o => {
      const matchSearch = search === '' ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.serviceTitle.toLowerCase().includes(search.toLowerCase()) ||
        o.city.toLowerCase().includes(search.toLowerCase());
      const matchTab = activeTab === 'all' || o.status === activeTab;
      return matchSearch && matchTab;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const advanceStatus = (order: ServiceOrder) => {
    const next = NEXT_STATUS[order.status];
    if (next) updateServiceOrder(order.id, { status: next });
  };

  const cancelOrder = (order: ServiceOrder) => {
    updateServiceOrder(order.id, { status: 'cancelled' });
    if (selectedOrder?.id === order.id) {
      setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
    }
  };

  const refreshSelected = (orderId: string) => {
    const updated = serviceOrders.find(o => o.id === orderId);
    if (updated) setSelectedOrder(updated);
  };

  const handleAdvance = (order: ServiceOrder) => {
    advanceStatus(order);
    refreshSelected(order.id);
  };

  const handleCancel = (order: ServiceOrder) => {
    cancelOrder(order);
  };

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <AppLayout title="My Bookings">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Bookings</h2>
            <p className="text-sm text-slate-500 mt-0.5">{myOrders.length} total bookings</p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
              )}>
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={clsx(
                  'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                )}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search by booking ID, customer, service or city..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Booking ID</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Service</th>
                  <th className="table-th">Source</th>
                  <th className="table-th">City</th>
                  <th className="table-th">Scheduled</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarCheck className="h-10 w-10 text-slate-300" />
                        <p className="text-slate-400 text-sm">No bookings found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="table-td font-mono text-xs text-violet-600 font-semibold">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="table-td">
                        <div>
                          <p className="font-medium text-sm text-slate-900">{order.customerName}</p>
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
                      <td className="table-td">
                        {order.agentId ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                            🤝 {order.agentName} <span className="font-mono opacity-60">({order.agentCode})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            Direct
                          </span>
                        )}
                      </td>
                      <td className="table-td text-sm text-slate-600">{order.city}</td>
                      <td className="table-td text-xs text-slate-500">{formatDate(order.scheduledDate)}</td>
                      <td className="table-td font-semibold text-slate-900">{formatCurrency(order.amount)}</td>
                      <td className="table-td"><StatusBadge status={order.status} /></td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          {order.status === 'completed' && (
                            <button onClick={() => setInvoiceOrder(order)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Download Invoice">
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                          {NEXT_STATUS[order.status] && (
                            <button onClick={() => handleAdvance(order)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title={`Mark as ${STATUS_CONFIG[NEXT_STATUS[order.status]!]?.label}`}>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          )}
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <button onClick={() => handleCancel(order)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Cancel booking">
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile card layout */}
        <div className="sm:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="card py-12 text-center">
              <CalendarCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No bookings found</p>
            </div>
          ) : (
            filtered.map(order => (
              <div key={order.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${order.serviceColor} flex items-center justify-center text-lg flex-shrink-0`}>
                      {order.serviceIcon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{order.serviceTitle}</p>
                      <p className="text-xs font-mono text-violet-600">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1"><User className="h-3 w-3" /> {order.customerName}</div>
                  <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {order.city}</div>
                  <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(order.scheduledDate)}</div>
                  <div className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> {formatCurrency(order.amount)}</div>
                </div>
                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <button onClick={() => setSelectedOrder(order)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-600 transition-colors">
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </button>
                  {NEXT_STATUS[order.status] && (
                    <button onClick={() => handleAdvance(order)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-emerald-200 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors">
                      <CheckCircle className="h-3.5 w-3.5" /> {STATUS_CONFIG[NEXT_STATUS[order.status]!]?.label}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Order detail modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Booking Details"
        size="lg"
      >
        {selectedOrder && (() => {
          const liveOrder = serviceOrders.find(o => o.id === selectedOrder.id) ?? selectedOrder;
          return (
            <div className="space-y-5">
              {/* ID + Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Booking ID</p>
                  <p className="font-mono text-violet-600 font-bold text-lg">#{liveOrder.id.slice(-8).toUpperCase()}</p>
                </div>
                <StatusBadge status={liveOrder.status} />
              </div>

              {/* Status timeline */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Status Timeline</p>
                <div className="flex items-center">
                  {STATUS_TIMELINE.map((s, i) => {
                    const isCompleted = STATUS_TIMELINE.indexOf(liveOrder.status as ServiceOrder['status']) >= i;
                    const isCancelled = liveOrder.status === 'cancelled';
                    const isActive = s === liveOrder.status && !isCancelled;
                    const cfg = STATUS_CONFIG[s];
                    const icons = {
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
                            isCancelled ? 'bg-slate-200 text-slate-400'
                              : isCompleted ? 'bg-violet-600 text-white'
                              : 'bg-slate-200 text-slate-400'
                          )}>
                            {icons[s as keyof typeof icons]}
                          </div>
                          <span className={clsx(
                            'text-xs mt-1 font-medium whitespace-nowrap',
                            isActive ? 'text-violet-600' : isCompleted && !isCancelled ? 'text-slate-700' : 'text-slate-400'
                          )}>
                            {cfg.label}
                          </span>
                        </div>
                        {i < STATUS_TIMELINE.length - 1 && (
                          <div className={clsx(
                            'flex-1 h-0.5 mx-1 mb-4',
                            !isCancelled && STATUS_TIMELINE.indexOf(liveOrder.status as ServiceOrder['status']) > i
                              ? 'bg-violet-400' : 'bg-slate-200'
                          )} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                {liveOrder.status === 'cancelled' && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> This booking has been cancelled.
                  </p>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Customer</p>
                  <p className="font-semibold text-slate-900">{liveOrder.customerName}</p>
                  <p className="text-sm text-slate-500">{liveOrder.customerEmail}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Service</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${liveOrder.serviceColor} flex items-center justify-center text-sm`}>
                      {liveOrder.serviceIcon}
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{liveOrder.serviceTitle}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Schedule</p>
                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Calendar className="h-4 w-4 text-violet-500" />
                    {formatDate(liveOrder.scheduledDate)}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Location</p>
                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    <MapPin className="h-4 w-4 text-violet-500" />
                    {liveOrder.city}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{liveOrder.address}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-violet-500 uppercase">Booking Amount</p>
                  <p className="text-2xl font-bold text-violet-700 mt-0.5">{formatCurrency(liveOrder.amount)}</p>
                </div>
                {liveOrder.status === 'completed' && (
                  <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <CheckCircle className="h-3.5 w-3.5" /> Earned
                  </div>
                )}
              </div>

              {/* Notes */}
              {liveOrder.notes && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Customer Notes</p>
                  <p className="text-sm text-slate-700">{liveOrder.notes}</p>
                </div>
              )}

              {/* Action buttons */}
              {liveOrder.status !== 'completed' && liveOrder.status !== 'cancelled' && (
                <div className="flex gap-3 pt-2">
                  {NEXT_STATUS[liveOrder.status] && (
                    <button
                      onClick={() => {
                        advanceStatus(liveOrder);
                        const updated = { ...liveOrder, status: NEXT_STATUS[liveOrder.status]! };
                        setSelectedOrder(updated);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                      Mark as {STATUS_CONFIG[NEXT_STATUS[liveOrder.status]!]?.label}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      cancelOrder(liveOrder);
                      setSelectedOrder({ ...liveOrder, status: 'cancelled' });
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
                    <XCircle className="h-4 w-4" /> Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          invoiceSettings={providerInvoiceSettings[providerId]}
          type="service"
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </AppLayout>
  );
};
