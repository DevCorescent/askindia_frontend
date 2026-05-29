import React from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatsCard } from '../../components/ui/StatsCard';
import { statusBadge } from '../../components/ui/Badge';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { formatCurrency, formatDate, computeMonthlyRevenue } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { TrendingUp, ShoppingCart, Store, Package, IndianRupee, Briefcase } from 'lucide-react';

const PIE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const AdminDashboard: React.FC = () => {
  const { products, stores, orders, services } = useAppStore();

  const totalRevenue = stores.reduce((s, st) => s + st.totalSales, 0);
  const totalOrders = orders.length;
  const activeStores = stores.filter(s => s.status === 'active').length;
  const totalProducts = products.filter(p => p.status === 'active').length;
  const totalServices = services.length;
  const pendingServices = services.filter(s => s.status === 'pending_review').length;

  const recentOrders = orders.slice(0, 6);

  const revenueData = computeMonthlyRevenue(orders);

  const storePerf = stores.filter(s => s.status === 'active').map(s => ({
    name: s.name.length > 15 ? s.name.slice(0, 15) + '…' : s.name,
    sales: s.totalSales,
    orders: s.totalOrders,
  }));

  const commissionPie = stores.filter(s => s.status === 'active' && s.totalSales > 0).map(s => ({
    name: s.name.length > 15 ? s.name.slice(0, 15) + '…' : s.name,
    value: Math.round(s.totalSales * (s.commissionRate / 100)),
  }));

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5">
          <StatsCard
            title="Total Revenue" value={formatCurrency(totalRevenue)}
            change={18.4} changeLabel="vs last month"
            icon={<IndianRupee className="h-5 w-5 text-brand-600" />}
            iconBg="bg-brand-100" trend="up"
          />
          <StatsCard
            title="Total Orders" value={totalOrders.toString()}
            change={12.1} changeLabel="vs last month"
            icon={<ShoppingCart className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-100" trend="up"
          />
          <StatsCard
            title="Active Stores" value={activeStores.toString()}
            change={5} changeLabel="this month"
            icon={<Store className="h-5 w-5 text-violet-600" />}
            iconBg="bg-violet-100" trend="up"
          />
          <StatsCard
            title="Products Listed" value={totalProducts.toString()}
            change={8.3} changeLabel="new products"
            icon={<Package className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-100" trend="up"
          />
          <StatsCard
            title="Total Services" value={totalServices.toString()}
            change={0} changeLabel="listed"
            icon={<Briefcase className="h-5 w-5 text-sky-600" />}
            iconBg="bg-sky-100" trend="up"
          />
          <StatsCard
            title="Pending Review" value={pendingServices.toString()}
            change={0} changeLabel="services"
            icon={<Briefcase className="h-5 w-5 text-orange-600" />}
            iconBg="bg-orange-100" trend="up"
          />
        </div>

        {/* Charts row */}
        <div className="grid xl:grid-cols-3 gap-5">
          {/* Revenue chart */}
          <div className="xl:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-900">Revenue Overview</h3>
                <p className="text-sm text-slate-500 mt-0.5">Monthly revenue — AskIndia</p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
                <TrendingUp className="h-3.5 w-3.5" /> Live data
              </div>
            </div>
            {revenueData.every(d => d.revenue === 0) ? (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                No revenue data yet. Orders will appear here once placed.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name === 'revenue' ? 'Revenue' : 'Commission']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#revGrad)" name="revenue" />
                  <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} fill="url(#commGrad)" name="commission" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Commission pie */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Commission by Store</h3>
            <p className="text-sm text-slate-500 mb-4">Total earnings breakdown</p>
            {commissionPie.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-slate-400 text-sm text-center">
                No store sales yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={commissionPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      dataKey="value" stroke="none">
                      {commissionPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {commissionPie.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <span className="font-medium text-slate-900">{formatCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Store performance + Recent Orders */}
        <div className="grid xl:grid-cols-3 gap-5">
          {/* Store bar chart */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Store Performance</h3>
            <p className="text-sm text-slate-500 mb-4">Sales by store (₹)</p>
            {storePerf.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm text-center">
                No active stores yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={storePerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="sales" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recent Orders */}
          <div className="xl:col-span-2 card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent Orders</h3>
              <a href="/admin/orders" className="text-brand-600 text-sm font-medium hover:text-brand-700">View all →</a>
            </div>
            {recentOrders.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No orders yet</p>
                <p className="text-sm mt-1">Orders from customers will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th">Order ID</th>
                      <th className="table-th">Customer</th>
                      <th className="table-th">Store</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="table-td font-mono text-xs text-brand-600">#{order.id.toUpperCase()}</td>
                        <td className="table-td font-medium">{order.customerName}</td>
                        <td className="table-td text-slate-500">{order.storeName}</td>
                        <td className="table-td font-semibold">{formatCurrency(order.total)}</td>
                        <td className="table-td">{statusBadge(order.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
