import React, { useMemo, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { Users, Activity, ShoppingCart, Search, TrendingUp, Eye, BarChart3, Percent, ArrowUp } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  admin: '#f59e0b',
  store_owner: '#10b981',
  service_provider: '#8b5cf6',
  customer: '#3b82f6',
  agent: '#f97316',
};

const EVENT_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899'];

type Period = '7d' | '30d' | 'all';

function getPeriodCutoff(period: Period): Date | null {
  if (period === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - (period === '7d' ? 7 : 30));
  return d;
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

export const AdminInsights: React.FC = () => {
  const { userActivities, registeredUsers, products } = useAppStore();
  const [period, setPeriod] = useState<Period>('7d');

  const cutoff = useMemo(() => getPeriodCutoff(period), [period]);

  const filtered = useMemo(
    () => cutoff
      ? userActivities.filter(a => new Date(a.createdAt) >= cutoff)
      : userActivities,
    [userActivities, cutoff],
  );

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalUsers = registeredUsers.length;
  const totalSessions = useMemo(() => new Set(filtered.map(a => a.sessionId)).size, [filtered]);
  const totalPageViews = useMemo(() => filtered.filter(a => a.event === 'page_view').length, [filtered]);
  const totalSearches = useMemo(() => filtered.filter(a => a.event === 'search').length, [filtered]);
  const cartAdds = useMemo(() => filtered.filter(a => a.event === 'add_to_cart').length, [filtered]);
  const checkoutStarts = useMemo(() => filtered.filter(a => a.event === 'checkout_start').length, [filtered]);
  const checkoutCompletes = useMemo(() => filtered.filter(a => a.event === 'checkout_complete').length, [filtered]);
  const conversionRate = checkoutStarts > 0
    ? ((checkoutCompletes / checkoutStarts) * 100).toFixed(1)
    : '0.0';

  const kpis = [
    { label: 'Total Users', value: totalUsers.toLocaleString(), icon: <Users className="h-5 w-5 text-indigo-600" />, bg: 'bg-indigo-100', trend: '+12%' },
    { label: 'Total Sessions', value: totalSessions.toLocaleString(), icon: <Activity className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-100', trend: '+8%' },
    { label: 'Page Views', value: totalPageViews.toLocaleString(), icon: <Eye className="h-5 w-5 text-sky-600" />, bg: 'bg-sky-100', trend: '+15%' },
    { label: 'Searches', value: totalSearches.toLocaleString(), icon: <Search className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-100', trend: '+5%' },
    { label: 'Cart Adds', value: cartAdds.toLocaleString(), icon: <ShoppingCart className="h-5 w-5 text-orange-600" />, bg: 'bg-orange-100', trend: '+18%' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: <Percent className="h-5 w-5 text-violet-600" />, bg: 'bg-violet-100', trend: '+3%' },
  ];

  // ── Activity Over Time (last 7 days always shown as 7 points) ───────────────
  const activityOverTime = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 14 : 7;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayActs = filtered.filter(a => {
        const t = new Date(a.createdAt);
        return t >= d && t < next;
      });
      return {
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        pageViews: dayActs.filter(a => a.event === 'page_view').length,
        cartEvents: dayActs.filter(a => ['add_to_cart', 'checkout_start', 'checkout_complete'].includes(a.event)).length,
      };
    });
  }, [filtered, period]);

  // ── Event Type Breakdown (top 8) ────────────────────────────────────────────
  const eventBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(a => { counts[a.event] = (counts[a.event] ?? 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([event, count]) => ({ event: event.replace(/_/g, ' '), count }));
  }, [filtered]);

  // ── User Role Distribution ───────────────────────────────────────────────────
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    registeredUsers.forEach(u => { counts[u.role] = (counts[u.role] ?? 0) + 1; });
    return Object.entries(counts).map(([role, value]) => ({ name: role.replace(/_/g, ' '), value, role }));
  }, [registeredUsers]);

  // ── Top Searched Queries ────────────────────────────────────────────────────
  const topSearches = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered
      .filter(a => a.event === 'search' && typeof a.metadata?.query === 'string')
      .forEach(a => {
        const q = String(a.metadata!.query).toLowerCase().trim();
        if (q) counts[q] = (counts[q] ?? 0) + 1;
      });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = entries[0]?.[1] ?? 1;
    return entries.map(([query, count]) => ({ query, count, pct: Math.round((count / max) * 100) }));
  }, [filtered]);

  // ── Top Viewed Products ─────────────────────────────────────────────────────
  const topViewedProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered
      .filter(a => a.event === 'product_view')
      .forEach(a => {
        const name = String(a.metadata?.productName ?? a.metadata?.productId ?? 'Unknown');
        counts[name] = (counts[name] ?? 0) + 1;
      });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, views]) => {
        const product = products.find(p => p.name === name);
        return { name, views, icon: product?.imageIcon ?? '📦' };
      });
  }, [filtered, products]);

  // ── Funnel ──────────────────────────────────────────────────────────────────
  const funnelSteps = [
    { label: 'Page Views', count: totalPageViews },
    { label: 'Cart Adds', count: cartAdds },
    { label: 'Checkout Starts', count: checkoutStarts },
    { label: 'Checkout Completes', count: checkoutCompletes },
  ];
  const funnelMax = funnelSteps[0].count || 1;

  // ── User Acquisition (last 7 days by role) ──────────────────────────────────
  const acquisition = useMemo(() => {
    const cutoff7 = new Date();
    cutoff7.setDate(cutoff7.getDate() - 7);
    const newUsers = registeredUsers.filter(u => new Date(u.createdAt) >= cutoff7);
    const byRole: Record<string, number> = {};
    newUsers.forEach(u => { byRole[u.role] = (byRole[u.role] ?? 0) + 1; });
    return Object.entries(byRole)
      .sort((a, b) => b[1] - a[1])
      .map(([role, count]) => ({ role, count, color: ROLE_COLORS[role] ?? '#94a3b8' }));
  }, [registeredUsers]);

  return (
    <AppLayout title="Insights">
      <div className="space-y-6 pb-8">

        {/* Header + Period Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Platform Insights</h2>
            <p className="text-sm text-slate-500 mt-0.5">User behaviour & engagement analytics</p>
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden self-start">
            {(['7d', '30d', 'all'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === p ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'All time'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="card p-4 flex flex-col gap-2">
              <div className={`${k.bg} w-9 h-9 rounded-lg flex items-center justify-center`}>{k.icon}</div>
              <div className="text-2xl font-bold text-slate-900">{k.value}</div>
              <div className="text-xs text-slate-500">{k.label}</div>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                <ArrowUp className="h-3 w-3" />{k.trend} this week
              </span>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Activity Over Time */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-600" /> Activity Over Time
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityOverTime} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#4f46e5" fill="url(#colorPV)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="cartEvents" name="Cart Events" stroke="#10b981" fill="url(#colorCart)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* User Role Distribution */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-600" /> User Role Distribution
            </h3>
            {roleDistribution.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No user data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={roleDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {roleDistribution.map((entry) => (
                      <Cell key={entry.role} fill={ROLE_COLORS[entry.role] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Event Breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-600" /> Event Type Breakdown (Top 8)
          </h3>
          {eventBreakdown.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">No activity data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={eventBreakdown} layout="vertical" margin={{ top: 0, right: 16, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="event" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" name="Events" radius={[0, 4, 4, 0]}>
                  {eventBreakdown.map((_, i) => (
                    <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Searched Queries */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-brand-600" /> Top Searched Queries
            </h3>
            {topSearches.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No search data for this period</p>
            ) : (
              <div className="space-y-2">
                {topSearches.map(({ query, count, pct }) => (
                  <div key={query} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 w-36 truncate capitalize">{query}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Viewed Products */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-brand-600" /> Top Viewed Products
            </h3>
            {topViewedProducts.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No product view data for this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">Product</th>
                    <th className="table-th text-right">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {topViewedProducts.map(({ name, views, icon }) => (
                    <tr key={name} className="border-t border-slate-100">
                      <td className="table-td">
                        <span className="mr-2">{icon}</span>
                        <span className="truncate max-w-[160px] inline-block align-middle">{name}</span>
                      </td>
                      <td className="table-td text-right font-medium text-slate-700">{views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Funnel + Acquisition Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Abandoned Cart Funnel */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-brand-600" /> Checkout Funnel
            </h3>
            <div className="space-y-3">
              {funnelSteps.map((step, i) => {
                const prev = i > 0 ? funnelSteps[i - 1].count : null;
                const dropPct = prev && prev > 0 ? ((1 - step.count / prev) * 100).toFixed(0) : null;
                const barWidth = funnelMax > 0 ? Math.round((step.count / funnelMax) * 100) : 0;
                return (
                  <div key={step.label}>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>{step.label}</span>
                      <span className="font-medium">{step.count.toLocaleString()}{dropPct ? <span className="text-rose-500 ml-2">-{dropPct}%</span> : null}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{ width: `${barWidth}%`, background: `hsl(${240 - i * 40}, 70%, 55%)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Acquisition */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-600" /> New Users (Last 7 Days) by Role
            </h3>
            {acquisition.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No new users in the last 7 days</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">Role</th>
                    <th className="table-th text-right">New Users</th>
                  </tr>
                </thead>
                <tbody>
                  {acquisition.map(({ role, count, color }) => (
                    <tr key={role} className="border-t border-slate-100">
                      <td className="table-td">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="capitalize">{role.replace(/_/g, ' ')}</span>
                        </span>
                      </td>
                      <td className="table-td text-right font-semibold text-slate-700">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

export default AdminInsights;
