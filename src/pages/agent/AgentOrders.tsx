import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { ClipboardList, Package, Briefcase } from 'lucide-react';
import clsx from 'clsx';

const PRODUCT_STATUS_TABS = ['all', 'pending', 'processing', 'shipped', 'delivered'] as const;
type ProductStatusTab = typeof PRODUCT_STATUS_TABS[number];

const SVC_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  in_progress: { label: 'In Progress', cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
};

export const AgentOrders: React.FC = () => {
  const { currentUser, orders, serviceOrders } = useAppStore();
  const [mainTab, setMainTab] = useState<'products' | 'services'>('products');
  const [statusFilter, setStatusFilter] = useState<ProductStatusTab>('all');
  const [svcStatusFilter, setSvcStatusFilter] = useState('all');

  const myOrders = orders.filter(o => o.agentId === currentUser?.id);
  const mySvcOrders = serviceOrders.filter(o => o.agentId === currentUser?.id);

  const filteredOrders = myOrders.filter(o =>
    statusFilter === 'all' || o.status === statusFilter
  );

  const filteredSvcOrders = mySvcOrders.filter(o =>
    svcStatusFilter === 'all' || o.status === svcStatusFilter
  );

  const totalSalesValue = myOrders.reduce((sum, o) => sum + o.total, 0);
  const totalProductComm = myOrders.reduce((sum, o) => sum + (o.agentCommission ?? 0), 0);
  const totalSvcComm = mySvcOrders.reduce((sum, o) => sum + (o.agentCommission ?? 0), 0);
  const totalCommission = totalProductComm + totalSvcComm;

  return (
    <AppLayout title="My Sales">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Sales & Bookings</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {myOrders.length} product orders · {mySvcOrders.length} service bookings
          </p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4 text-center">
            <p className="text-xl font-bold text-slate-900">{myOrders.length + mySvcOrders.length}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Total Orders</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xl font-bold text-orange-600">{myOrders.length}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Product Sales</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xl font-bold text-violet-600">{mySvcOrders.length}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Service Bookings</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalCommission)}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Commission Earned</p>
          </div>
        </div>

        {/* Main tab switcher */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 w-fit">
          {([
            { value: 'products' as const, label: 'Product Sales', icon: Package },
            { value: 'services' as const, label: 'Service Bookings', icon: Briefcase },
          ]).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMainTab(value)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                mainTab === value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              <span className={clsx(
                'text-xs px-1.5 py-0.5 rounded-full font-bold',
                mainTab === value ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
              )}>
                {value === 'products' ? myOrders.length : mySvcOrders.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── PRODUCT ORDERS TAB ── */}
        {mainTab === 'products' && (
          <>
            <div className="flex gap-1.5 flex-wrap">
              {PRODUCT_STATUS_TABS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                    statusFilter === s
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'
                  )}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  {s !== 'all' && ` (${myOrders.filter(o => o.status === s).length})`}
                </button>
              ))}
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th">Order ID</th>
                      <th className="table-th">Customer</th>
                      <th className="table-th">Product</th>
                      <th className="table-th">City</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Commission</th>
                      <th className="table-th">Date</th>
                      <th className="table-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="table-td font-mono text-xs text-orange-600 font-semibold">
                          #{order.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="table-td">
                          <p className="font-medium text-sm">{order.customerName}</p>
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${order.items[0]?.productColor ?? 'from-orange-400 to-amber-500'} flex items-center justify-center text-sm flex-shrink-0`}>
                              {order.items[0]?.productIcon ?? '📦'}
                            </div>
                            <span className="text-sm text-slate-700 truncate max-w-[120px]">
                              {order.items[0]?.productName ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className="table-td text-sm text-slate-600">{order.city}</td>
                        <td className="table-td font-semibold text-sm">{formatCurrency(order.total)}</td>
                        <td className="table-td">
                          <span className="font-bold text-emerald-600">{formatCurrency(order.agentCommission ?? 0)}</span>
                        </td>
                        <td className="table-td text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                        <td className="table-td">{statusBadge(order.status)}</td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={8}>
                          <div className="py-16 text-center text-slate-400">
                            <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No product orders found</p>
                            <p className="text-sm mt-1">
                              {myOrders.length === 0
                                ? 'Record your first sale from the Sell Products page.'
                                : 'Try selecting a different status filter.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── SERVICE BOOKINGS TAB ── */}
        {mainTab === 'services' && (
          <>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(s => (
                <button
                  key={s}
                  onClick={() => setSvcStatusFilter(s)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                    svcStatusFilter === s
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
                  )}
                >
                  {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  {s !== 'all' && ` (${mySvcOrders.filter(o => o.status === s).length})`}
                </button>
              ))}
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
                      <th className="table-th">City</th>
                      <th className="table-th">Scheduled</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Commission</th>
                      <th className="table-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSvcOrders.map(order => {
                      const cfg = SVC_STATUS_CONFIG[order.status] ?? SVC_STATUS_CONFIG['pending'];
                      return (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="table-td font-mono text-xs text-violet-600 font-semibold">
                            #{order.id.slice(-8).toUpperCase()}
                          </td>
                          <td className="table-td">
                            <p className="font-medium text-sm">{order.customerName}</p>
                            {order.customerPhone && (
                              <p className="text-xs text-slate-400">{order.customerPhone}</p>
                            )}
                          </td>
                          <td className="table-td">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${order.serviceColor} flex items-center justify-center text-sm flex-shrink-0`}>
                                {order.serviceIcon}
                              </div>
                              <span className="text-sm text-slate-700 truncate max-w-[100px]">{order.serviceTitle}</span>
                            </div>
                          </td>
                          <td className="table-td text-sm text-slate-600">{order.providerName}</td>
                          <td className="table-td text-sm text-slate-600">{order.city}</td>
                          <td className="table-td text-xs text-slate-500">{formatDate(order.scheduledDate)}</td>
                          <td className="table-td font-semibold text-sm">{formatCurrency(order.amount)}</td>
                          <td className="table-td">
                            <span className="font-bold text-emerald-600">{formatCurrency(order.agentCommission ?? 0)}</span>
                          </td>
                          <td className="table-td">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSvcOrders.length === 0 && (
                      <tr>
                        <td colSpan={9}>
                          <div className="py-16 text-center text-slate-400">
                            <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No service bookings found</p>
                            <p className="text-sm mt-1">
                              {mySvcOrders.length === 0
                                ? 'Book services for customers from the Book Services page.'
                                : 'Try selecting a different status filter.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};
