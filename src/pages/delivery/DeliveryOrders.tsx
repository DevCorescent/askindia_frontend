import React, { useMemo, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import { ProductImage } from '../../components/ui/ProductImage';
import { toast } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { Order } from '../../types';
import { Search, MapPin, Truck, PackageCheck, Package, Loader2, Phone } from 'lucide-react';

type Tab = 'to_ship' | 'in_transit' | 'delivered';

const TAB_STATUS: Record<Tab, Order['status']> = {
  to_ship:    'processing',
  in_transit: 'shipped',
  delivered:  'delivered',
};

export const DeliveryOrders: React.FC = () => {
  const { orders, products, updateOrder } = useAppStore();
  const [tab, setTab] = useState<Tab>('to_ship');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const itemVisual = (item: { productId?: string; productName: string; productIcon: string; productColor: string }) => {
    const prod = products.find(p => p.id === item.productId);
    return { name: item.productName, thumbnail: prod?.thumbnail, images: prod?.images, imageColor: item.productColor, imageIcon: item.productIcon };
  };

  const counts = useMemo(() => ({
    to_ship:    orders.filter(o => o.status === 'processing').length,
    in_transit: orders.filter(o => o.status === 'shipped').length,
    delivered:  orders.filter(o => o.status === 'delivered').length,
  }), [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders
      .filter(o => o.status === TAB_STATUS[tab])
      .filter(o => !q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || (o.city ?? '').toLowerCase().includes(q));
  }, [orders, tab, search]);

  const advance = async (order: Order, next: Order['status']) => {
    setBusyId(order.id);
    try {
      await updateOrder(order.id, { status: next });
      toast.success(
        next === 'shipped'
          ? `Order #${order.id.toUpperCase()} marked shipped 🚚`
          : `Order #${order.id.toUpperCase()} delivered ✅`,
      );
    } finally {
      setBusyId(null);
    }
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'to_ship',    label: 'To Ship',    icon: Package },
    { key: 'in_transit', label: 'In Transit', icon: Truck },
    { key: 'delivered',  label: 'Delivered',  icon: PackageCheck },
  ];

  return (
    <AppLayout title="Delivery Queue">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Delivery Queue</h2>
          <p className="text-sm text-slate-500 mt-0.5">Pick up processed orders, ship them, and mark them delivered.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                tab === key ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
              }`}>
              <Icon className="h-4 w-4" /> {label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/25' : 'bg-slate-100 text-slate-500'}`}>{counts[key]}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search by order, customer, or city…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Orders */}
        {filtered.length === 0 ? (
          <div className="card py-16 text-center">
            <Truck className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nothing here right now</p>
            <p className="text-sm text-slate-400 mt-1">
              {tab === 'to_ship' ? 'Orders appear here once a store accepts them.' : tab === 'in_transit' ? 'Shipped orders will show here.' : 'Delivered orders will show here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div key={order.id} className="card p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-brand-600">#{order.id.toUpperCase()}</span>
                      <span className="text-xs text-slate-400">{formatDate(order.createdAt)}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 uppercase">{order.paymentMethod}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-1">
                        {order.items.slice(0, 3).map((item, i) => (
                          <ProductImage key={i} product={itemVisual(item)} emojiClass="text-sm" className="w-8 h-8 rounded-lg border-2 border-white" />
                        ))}
                        {order.items.length > 3 && <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border-2 border-white">+{order.items.length - 3}</div>}
                      </div>
                      <p className="text-sm text-slate-600 truncate">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''} · <span className="font-semibold text-slate-900">{formatCurrency(order.total)}</span>
                      </p>
                    </div>

                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-500 flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                        <span>{order.address}, {order.city}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: action */}
                  <div className="flex sm:flex-col items-stretch gap-2 sm:w-44 flex-shrink-0">
                    {order.status === 'processing' && (
                      <button onClick={() => advance(order, 'shipped')} disabled={busyId === order.id}
                        className="btn-primary justify-center gap-2 disabled:opacity-60">
                        {busyId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                        Mark Shipped
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button onClick={() => advance(order, 'delivered')} disabled={busyId === order.id}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
                        {busyId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                        Mark Delivered
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm">
                        <PackageCheck className="h-4 w-4" /> Delivered
                      </span>
                    )}
                    <a href="tel:" onClick={e => e.preventDefault()}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                      <Phone className="h-4 w-4" /> Contact
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
