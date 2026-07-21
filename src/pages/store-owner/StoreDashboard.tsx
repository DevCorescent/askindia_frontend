import React from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StoreLogo } from '../../components/ui/StoreLogo';
import { StatsCard } from '../../components/ui/StatsCard';
import { statusBadge } from '../../components/ui/Badge';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatDate, computeMonthlyRevenue } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { ProductImage } from '../../components/ui/ProductImage';
import { IndianRupee, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';

export const StoreDashboard: React.FC = () => {
  const { currentUser, stores, orders, products, loadingData, supabaseReady } = useAppStore();
  const myStore = stores.find(s => s.id === currentUser?.storeId);

  if (loadingData || !supabaseReady) {
    return (
      <AppLayout title="Store Dashboard">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!myStore) {
    return (
      <AppLayout title="Store Dashboard">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Store setup pending admin approval</h2>
          <p className="text-slate-500 text-sm">Your store application is being reviewed. You'll be notified once it's approved.</p>
        </div>
      </AppLayout>
    );
  }

  const myOrders = orders.filter(o => o.storeId === myStore.id);
  const recentOrders = myOrders.slice(0, 5);
  const salesTrend = computeMonthlyRevenue(myOrders);

  const totalCommission = myOrders.reduce((s, o) => s + o.commissionTotal, 0);
  const deliveredOrders = myOrders.filter(o => o.status === 'delivered').length;

  // Show only this store's products — filter by storeId (works for DB-loaded products)
  const storeProducts = products.filter(p => !p.storeId || p.storeId === myStore.id);
  const topProducts = [...storeProducts].sort((a, b) => b.sold - a.sold).slice(0, 4);

  return (
    <AppLayout title="Store Dashboard">
      <div className="space-y-6">
        {/* Store banner */}
        <div className="rounded-2xl p-6 text-white overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${myStore.themeColor}, ${myStore.themeColor}cc)` }}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIj48ZyBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjxwYXRoIGQ9Ik0zNiAzNHY2aDZ2LTZoLTZ6bTYtNmg2di02aC02djZ6bS0xMiA2aDZ2LTZoLTZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StoreLogo logo={myStore.logo} name={myStore.name} className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl text-3xl" />
              <div>
                <p className="text-xl font-bold">{myStore.name}</p>
                <p className="text-white/70 text-sm">{myStore.tagline}</p>
                <p className="text-white/50 text-xs mt-0.5 font-mono">{myStore.slug}.askindia.shop</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6 text-center">
              <div>
                <p className="text-2xl font-bold">{myStore.totalOrders}</p>
                <p className="text-white/60 text-xs">Total Orders</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <p className="text-2xl font-bold">{myStore.commissionRate}%</p>
                <p className="text-white/60 text-xs">Commission Rate</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <p className="text-2xl font-bold">{statusBadge(myStore.status)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatsCard title="Total Sales" value={formatCurrency(myStore.totalSales)} change={14.2}
            changeLabel="vs last month" icon={<IndianRupee className="h-5 w-5 text-brand-600" />} iconBg="bg-brand-100" />
          <StatsCard title="Total Commission" value={formatCurrency(totalCommission)} change={14.2}
            changeLabel="vs last month" icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-100" />
          <StatsCard title="Total Orders" value={myOrders.length.toString()} change={8.5}
            changeLabel="vs last month" icon={<ShoppingCart className="h-5 w-5 text-violet-600" />} iconBg="bg-violet-100" />
          <StatsCard title="Wallet Balance" value={formatCurrency(myStore.walletBalance)}
            icon={<Wallet className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-100" />
        </div>

        {/* Charts */}
        <div className="grid xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 card p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Sales & Commission Trend</h3>
            <p className="text-sm text-slate-500 mb-5">Monthly performance this year</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={myStore.themeColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={myStore.themeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, n: string) => [formatCurrency(v), n === 'revenue' ? 'Sales' : 'Commission']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="revenue" stroke={myStore.themeColor} strokeWidth={2.5} fill="url(#sGrad)" name="revenue" />
                <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} fill="transparent" name="commission" strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick stats */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-slate-900">Performance Summary</h3>
            {[
              { label: 'Delivered Orders', value: deliveredOrders, total: myOrders.length, color: '#10b981' },
              { label: 'Pending/Processing', value: myOrders.filter(o => ['pending', 'processing'].includes(o.status)).length, total: myOrders.length, color: '#f59e0b' },
              { label: 'Avg Order Value', value: null, display: formatCurrency(myStore.totalSales / (myStore.totalOrders || 1)), color: '#4f46e5' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="text-sm font-bold text-slate-900">
                    {item.display ?? `${item.value}/${item.total}`}
                  </span>
                </div>
                {item.total && item.value !== null && (
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div className="h-1.5 rounded-full" style={{ background: item.color, width: `${(item.value! / item.total) * 100}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders + Top products */}
        <div className="grid xl:grid-cols-2 gap-5">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Recent Orders</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Order</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="table-td font-mono text-xs text-brand-600">#{order.id.toUpperCase()}</td>
                    <td className="table-td text-sm">{order.customerName}</td>
                    <td className="table-td font-semibold">{formatCurrency(order.total)}</td>
                    <td className="table-td">{statusBadge(order.status)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Top Products in Your Store</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {topProducts.map((p, i) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50">
                  <span className="text-xs text-slate-400 font-bold w-4">#{i + 1}</span>
                  <ProductImage product={p} className="w-9 h-9 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(p.price)}</p>
                    <p className="text-xs text-emerald-600">{p.commission}% comm.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
