import React from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { TrendingUp, ShoppingBag, DollarSign, Percent, ArrowRight, Briefcase } from 'lucide-react';
import clsx from 'clsx';

export const AgentDashboard: React.FC = () => {
  const { currentUser, orders, serviceOrders, agents } = useAppStore();

  const agent = agents.find(a => a.id === currentUser?.id);
  const myOrders = orders.filter(o => o.agentId === currentUser?.id);
  const mySvcOrders = serviceOrders.filter(o => o.agentId === currentUser?.id);
  const recentOrders = myOrders.slice(0, 5);

  if (!agent || !currentUser) {
    return (
      <AppLayout title="Agent Dashboard">
        <div className="py-20 text-center text-slate-400">Agent data not found.</div>
      </AppLayout>
    );
  }

  const stats = [
    {
      label: 'Total Earnings',
      value: formatCurrency(agent.walletBalance),
      sub: 'Wallet balance',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      ring: 'ring-emerald-200',
    },
    {
      label: 'Total Sales',
      value: formatCurrency(agent.totalSales),
      sub: 'Revenue generated',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      ring: 'ring-blue-200',
    },
    {
      label: 'Total Orders',
      value: String(agent.totalOrders),
      sub: 'Orders placed',
      icon: ShoppingBag,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      ring: 'ring-violet-200',
    },
    {
      label: 'Commission Rate',
      value: `${agent.commissionRate}%`,
      sub: 'Per sale earned',
      icon: Percent,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      ring: 'ring-orange-200',
    },
  ];

  return (
    <AppLayout title="Agent Dashboard">
      <div className="space-y-6">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Welcome, {currentUser.name}!</h2>
              <p className="text-orange-100 mt-1 flex items-center gap-1.5">
                <span>📍</span>
                <span>{agent.city}, {agent.state}</span>
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-sm font-bold">
                🆔 {agent.agentCode}
              </span>
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-sm font-bold">
                💰 {agent.commissionRate}% Commission
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className={clsx('card p-5 ring-1', stat.ring)}>
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
                <stat.icon className={clsx('h-5 w-5', stat.color)} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm font-medium text-slate-600 mt-0.5">{stat.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/agent/products"
            className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-800">Sell Products</p>
              <p className="text-xs text-slate-400">{myOrders.length} sold</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-orange-400 transition-colors" />
          </Link>
          <Link
            to="/agent/services"
            className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <Briefcase className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-800">Book Services</p>
              <p className="text-xs text-slate-400">{mySvcOrders.length} booked</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-violet-400 transition-colors" />
          </Link>
        </div>

        {/* Recent Sales */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Your last 5 product orders</p>
            </div>
            <Link
              to="/agent/orders"
              className="flex items-center gap-1.5 text-sm text-orange-600 font-semibold hover:text-orange-700 transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-slate-500">No sales yet</p>
              <p className="text-sm mt-1">Start recording sales to see them here.</p>
              <Link
                to="/agent/products"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                Browse Products to Sell
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${order.items[0]?.productColor ?? 'from-orange-400 to-amber-500'} flex items-center justify-center text-lg flex-shrink-0`}>
                    {order.items[0]?.productIcon ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{order.customerName}</p>
                    <p className="text-xs text-slate-400 truncate">{order.items[0]?.productName}</p>
                    <p className="text-xs font-mono text-slate-400">#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-slate-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs font-semibold text-emerald-600">+{formatCurrency(order.agentCommission ?? 0)} earned</p>
                  </div>
                  <div className="flex-shrink-0">{statusBadge(order.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
