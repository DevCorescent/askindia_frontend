import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import { StatsCard } from '../../components/ui/StatsCard';
import { toast } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { Order } from '../../types';
import { Package, Truck, PackageCheck, MapPin, Loader2, ArrowRight } from 'lucide-react';

export const DeliveryDashboard: React.FC = () => {
  const { currentUser, orders, updateOrder } = useAppStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const toShip = orders.filter(o => o.status === 'processing');
    const inTransit = orders.filter(o => o.status === 'shipped');
    const delivered = orders.filter(o => o.status === 'delivered');
    return {
      toShip: toShip.length,
      inTransit: inTransit.length,
      delivered: delivered.length,
      codDue: [...toShip, ...inTransit].filter(o => o.paymentMethod === 'cod').reduce((s, o) => s + o.total, 0),
    };
  }, [orders]);

  // The active queue: what needs action now (processing first, then shipped).
  const queue = useMemo(
    () => orders
      .filter(o => o.status === 'processing' || o.status === 'shipped')
      .sort((a, b) => (a.status === 'processing' ? -1 : 1) - (b.status === 'processing' ? -1 : 1))
      .slice(0, 6),
    [orders],
  );

  const advance = async (order: Order, next: Order['status']) => {
    setBusyId(order.id);
    try {
      await updateOrder(order.id, { status: next });
      toast.success(next === 'shipped' ? `Order #${order.id.toUpperCase()} marked shipped 🚚` : `Order #${order.id.toUpperCase()} delivered ✅`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppLayout title="Delivery Dashboard">
      <div className="space-y-6">
        {/* Banner */}
        <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-indigo-600 to-indigo-800 relative overflow-hidden">
          <div className="relative">
            <p className="text-white/70 text-sm">Welcome back,</p>
            <h2 className="text-2xl font-bold">{currentUser?.name ?? 'Delivery Partner'}</h2>
            <p className="text-white/70 text-sm mt-1">
              {stats.toShip + stats.inTransit} active {stats.toShip + stats.inTransit === 1 ? 'delivery' : 'deliveries'} in your queue
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatsCard title="To Ship" value={stats.toShip.toString()} icon={<Package className="h-5 w-5 text-brand-600" />} iconBg="bg-brand-100" />
          <StatsCard title="In Transit" value={stats.inTransit.toString()} icon={<Truck className="h-5 w-5 text-violet-600" />} iconBg="bg-violet-100" />
          <StatsCard title="Delivered" value={stats.delivered.toString()} icon={<PackageCheck className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-100" />
          <StatsCard title="COD to Collect" value={formatCurrency(stats.codDue)} icon={<span className="text-amber-600 font-bold">₹</span>} iconBg="bg-amber-100" />
        </div>

        {/* Active queue */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Active Queue</h3>
            <Link to="/delivery/orders" className="text-sm text-brand-600 font-medium inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {queue.length === 0 ? (
            <div className="py-14 text-center">
              <Truck className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No active deliveries</p>
              <p className="text-sm text-slate-400 mt-1">New orders appear once stores accept them.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {queue.map(order => (
                <div key={order.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    order.status === 'processing' ? 'bg-brand-50 text-brand-600' : 'bg-violet-50 text-violet-600'
                  }`}>
                    {order.status === 'processing' ? <Package className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-600">#{order.id.toUpperCase()}</span>
                      <span className="text-xs text-slate-400">{formatDate(order.createdAt)}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">{order.customerName}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 flex-shrink-0" /> {order.city}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(order.total)}</p>
                    {order.status === 'processing' ? (
                      <button onClick={() => advance(order, 'shipped')} disabled={busyId === order.id}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg px-2.5 py-1 disabled:opacity-60">
                        {busyId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />} Ship
                      </button>
                    ) : (
                      <button onClick={() => advance(order, 'delivered')} disabled={busyId === order.id}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-2.5 py-1 disabled:opacity-60">
                        {busyId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />} Deliver
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
