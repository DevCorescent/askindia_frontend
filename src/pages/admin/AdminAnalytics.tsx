import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatsCard } from '../../components/ui/StatsCard';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatCurrency, computeMonthlyRevenue } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { IndianRupee, ShoppingCart, TrendingUp, Percent } from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const paymentMix = [
  { name: 'UPI', value: 42 },
  { name: 'Credit/Debit Card', value: 33 },
  { name: 'Wallet', value: 15 },
  { name: 'Cash on Delivery', value: 10 },
];

export const AdminAnalytics: React.FC = () => {
  const { orders, stores, products } = useAppStore();
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');

  const revenueData = computeMonthlyRevenue(orders);

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalCommission = revenueData.reduce((s, d) => s + d.commission, 0);
  const totalOrders = revenueData.reduce((s, d) => s + d.orders, 0);
  const avgCommissionRate = totalRevenue > 0
    ? ((totalCommission / totalRevenue) * 100).toFixed(1)
    : '0.0';

  const quarterlyData = [
    { date: 'Q1', revenue: revenueData.slice(0, 3).reduce((s, d) => s + d.revenue, 0), orders: revenueData.slice(0, 3).reduce((s, d) => s + d.orders, 0), commission: revenueData.slice(0, 3).reduce((s, d) => s + d.commission, 0) },
    { date: 'Q2', revenue: revenueData.slice(3, 6).reduce((s, d) => s + d.revenue, 0), orders: revenueData.slice(3, 6).reduce((s, d) => s + d.orders, 0), commission: revenueData.slice(3, 6).reduce((s, d) => s + d.commission, 0) },
    { date: 'Q3', revenue: revenueData.slice(6, 9).reduce((s, d) => s + d.revenue, 0), orders: revenueData.slice(6, 9).reduce((s, d) => s + d.orders, 0), commission: revenueData.slice(6, 9).reduce((s, d) => s + d.commission, 0) },
    { date: 'Q4', revenue: revenueData.slice(9, 12).reduce((s, d) => s + d.revenue, 0), orders: revenueData.slice(9, 12).reduce((s, d) => s + d.orders, 0), commission: revenueData.slice(9, 12).reduce((s, d) => s + d.commission, 0) },
  ];

  const chartData = period === 'monthly' ? revenueData : quarterlyData;
  const hasData = chartData.some(d => d.revenue > 0);

  const storeData = stores.filter(s => s.status === 'active').map(s => ({
    name: s.name.length > 15 ? s.name.slice(0, 15) + '…' : s.name,
    sales: s.totalSales,
    orders: s.totalOrders,
    commission: Math.round(s.totalSales * (s.commissionRate / 100)),
  }));

  const topProducts = [...products]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)
    .map(p => ({
      name: p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name,
      sold: p.sold,
      revenue: p.price * p.sold,
      icon: p.imageIcon,
    }));

  return (
    <AppLayout title="Analytics & Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Platform Analytics</h2>
            <p className="text-sm text-slate-500 mt-0.5">AskIndia performance overview</p>
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['monthly', 'quarterly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === p ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatsCard title="Total Revenue" value={formatCurrency(totalRevenue)} change={18.4} changeLabel="YoY"
            icon={<IndianRupee className="h-5 w-5 text-brand-600" />} iconBg="bg-brand-100" />
          <StatsCard title="Total Orders" value={totalOrders.toLocaleString()} change={14.2} changeLabel="YoY"
            icon={<ShoppingCart className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-100" />
          <StatsCard title="Commission Paid Out" value={formatCurrency(totalCommission)} change={16.8} changeLabel="YoY"
            icon={<TrendingUp className="h-5 w-5 text-violet-600" />} iconBg="bg-violet-100" />
          <StatsCard title="Avg Commission Rate" value={`${avgCommissionRate}%`} change={0.5} changeLabel="vs target"
            icon={<Percent className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-100" />
        </div>

        {/* Main chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Revenue vs Commission Trend</h3>
          <p className="text-sm text-slate-500 mb-5">{period === 'monthly' ? 'Monthly' : 'Quarterly'} breakdown</p>
          {!hasData ? (
            <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
              No revenue data yet. Orders will populate this chart automatically.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="aRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aCommGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
                <Tooltip formatter={(v: number, n: string) => [formatCurrency(v), n === 'revenue' ? 'Revenue' : 'Commission']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend formatter={(v) => v === 'revenue' ? 'Revenue' : 'Commission'} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fill="url(#aRevGrad)" />
                <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2.5} fill="url(#aCommGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bottom row */}
        <div className="grid xl:grid-cols-3 gap-5">
          {/* Store performance */}
          <div className="xl:col-span-2 card p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Store Performance</h3>
            <p className="text-sm text-slate-500 mb-5">Sales & commission by store</p>
            {storeData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
                No active store data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={storeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Sales" />
                  <Bar dataKey="commission" fill="#10b981" radius={[4, 4, 0, 0]} name="Commission" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment mix */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Payment Methods</h3>
            <p className="text-sm text-slate-500 mb-4">Distribution by method</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={paymentMix} cx="50%" cy="50%" outerRadius={65} dataKey="value" stroke="none">
                  {paymentMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {paymentMix.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-slate-600 text-xs">{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 text-xs">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top products */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Top Selling Products</h3>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No product sales data yet
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Product</th>
                  <th className="table-th">Units Sold</th>
                  <th className="table-th">Revenue Generated</th>
                  <th className="table-th">Performance</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.name} className="hover:bg-slate-50">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs font-bold w-4">#{i + 1}</span>
                        <span className="text-xl">{p.icon}</span>
                        <span className="font-medium text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="table-td font-semibold">{p.sold.toLocaleString()}</td>
                    <td className="table-td font-semibold text-brand-600">{formatCurrency(p.revenue)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className="bg-brand-500 h-2 rounded-full"
                            style={{ width: `${topProducts[0].sold > 0 ? (p.sold / topProducts[0].sold) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8">
                          {topProducts[0].sold > 0 ? Math.round((p.sold / topProducts[0].sold) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
