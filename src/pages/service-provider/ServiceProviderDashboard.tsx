import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import {
  Briefcase, CalendarCheck, IndianRupee, Clock,
  PlusCircle, ListOrdered, MapPin, TrendingUp,
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ServiceProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, services, serviceOrders } = useAppStore();

  const providerId = currentUser?.id ?? '';
  const myServices = services.filter(s => s.providerId === providerId);
  const myOrders = serviceOrders.filter(o => o.providerId === providerId);

  // Stats
  const activeServices = myServices.filter(s => s.status === 'active').length;
  const totalBookings = myOrders.length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const earningsThisMonth = myOrders
    .filter(o => {
      if (o.status !== 'completed') return false;
      const d = new Date(o.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, o) => sum + o.amount, 0);

  const pendingBookings = myOrders.filter(o =>
    o.status === 'pending' || o.status === 'confirmed'
  ).length;

  // Monthly booking chart data
  const chartData = MONTHS.map((month, i) => ({
    month,
    bookings: myOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === i && d.getFullYear() === currentYear;
    }).length,
  }));

  // Recent bookings (last 5)
  const recentOrders = [...myOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const orderStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
      confirmed: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
      in_progress: { label: 'In Progress', cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
      completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
      cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
    };
    const cfg = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
  };

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">

        {/* Welcome banner */}
        <div className="rounded-2xl p-6 text-white overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">Welcome back, {currentUser?.name?.split(' ')[0] ?? 'Provider'}!</p>
                {currentUser?.city && (
                  <p className="text-violet-200 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {currentUser.city}
                    {currentUser.state ? `, ${currentUser.state}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6 text-center">
              <div>
                <p className="text-2xl font-bold">{activeServices}</p>
                <p className="text-violet-300 text-xs">Active Services</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <p className="text-2xl font-bold">{totalBookings}</p>
                <p className="text-violet-300 text-xs">Total Bookings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            {
              title: 'Active Services',
              value: activeServices.toString(),
              sub: `${myServices.filter(s => s.status === 'pending_review').length} pending review`,
              icon: <Briefcase className="h-5 w-5 text-violet-600" />,
              iconBg: 'bg-violet-100',
              valueColor: 'text-violet-700',
            },
            {
              title: 'Total Bookings',
              value: totalBookings.toString(),
              sub: `${myOrders.filter(o => o.status === 'completed').length} completed`,
              icon: <CalendarCheck className="h-5 w-5 text-blue-600" />,
              iconBg: 'bg-blue-100',
              valueColor: 'text-blue-700',
            },
            {
              title: 'Earnings This Month',
              value: formatCurrency(earningsThisMonth),
              sub: 'From completed bookings',
              icon: <IndianRupee className="h-5 w-5 text-emerald-600" />,
              iconBg: 'bg-emerald-100',
              valueColor: 'text-emerald-700',
            },
            {
              title: 'Pending Bookings',
              value: pendingBookings.toString(),
              sub: 'Require your attention',
              icon: <Clock className="h-5 w-5 text-amber-600" />,
              iconBg: 'bg-amber-100',
              valueColor: 'text-amber-700',
            },
          ].map(card => (
            <div key={card.title} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.valueColor}`}>{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.iconBg}`}>{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Quick actions */}
        <div className="grid xl:grid-cols-3 gap-5">
          {/* Monthly bookings chart */}
          <div className="xl:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-900">Booking Trend</h3>
                <p className="text-sm text-slate-500">Monthly bookings for {currentYear}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium bg-violet-50 px-3 py-1.5 rounded-full">
                <TrendingUp className="h-3 w-3" /> This Year
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  allowDecimals={false}
                  tickFormatter={v => v.toString()}
                />
                <Tooltip
                  formatter={(v: number) => [v, 'Bookings']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Area
                  type="monotone" dataKey="bookings" stroke="#7c3aed"
                  strokeWidth={2.5} fill="url(#bookingGrad)" name="bookings"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick actions */}
          <div className="card p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Quick Actions</h3>
              <p className="text-sm text-slate-500 mb-5">Manage your provider account</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/service-provider/services')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors text-sm font-medium"
                >
                  <div className="w-8 h-8 bg-violet-200 rounded-lg flex items-center justify-center">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                  Add New Service
                </button>
                <button
                  onClick={() => navigate('/service-provider/orders')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
                >
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                    <ListOrdered className="h-4 w-4" />
                  </div>
                  View All Bookings
                </button>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Profile Completion</span>
                <span className="text-violet-600 font-semibold">85%</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full">
                <div className="h-2 bg-violet-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Bookings</h3>
            <button
              onClick={() => navigate('/service-provider/orders')}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              View all →
            </button>
          </div>

          {myServices.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-violet-400" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">No services listed yet</h4>
              <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
                Start by listing your first service to receive bookings from customers across India.
              </p>
              <button
                onClick={() => navigate('/service-provider/services')}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
              >
                List Your First Service
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Customer</th>
                    <th className="table-th">Service</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                        No bookings yet. Share your services to start receiving bookings.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="table-td">
                          <div>
                            <p className="font-medium text-sm text-slate-900">{order.customerName}</p>
                            <p className="text-xs text-slate-400">{order.city}</p>
                          </div>
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${order.serviceColor} flex items-center justify-center text-sm flex-shrink-0`}>
                              {order.serviceIcon}
                            </div>
                            <span className="text-sm text-slate-700 truncate max-w-[140px]">{order.serviceTitle}</span>
                          </div>
                        </td>
                        <td className="table-td font-semibold text-slate-900">{formatCurrency(order.amount)}</td>
                        <td className="table-td">{orderStatusBadge(order.status)}</td>
                        <td className="table-td text-xs text-slate-500">{formatDate(order.scheduledDate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status breakdown */}
        {myOrders.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Pending', count: myOrders.filter(o => o.status === 'pending').length, color: 'bg-amber-500' },
              { label: 'Confirmed', count: myOrders.filter(o => o.status === 'confirmed').length, color: 'bg-blue-500' },
              { label: 'In Progress', count: myOrders.filter(o => o.status === 'in_progress').length, color: 'bg-violet-500' },
              { label: 'Completed', count: myOrders.filter(o => o.status === 'completed').length, color: 'bg-emerald-500' },
              { label: 'Cancelled', count: myOrders.filter(o => o.status === 'cancelled').length, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label} className="card p-4 text-center">
                <div className={`w-2 h-2 rounded-full ${item.color} mx-auto mb-2`} />
                <p className="text-xl font-bold text-slate-900">{item.count}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
