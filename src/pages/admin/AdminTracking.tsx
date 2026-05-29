import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  Activity, ShoppingCart, Users, Eye, Trash2, CheckCircle,
  Clock, Search, Filter, X, RefreshCw, AlertCircle,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../data/mockData';
import type { ActivityEvent, UserActivity, AbandonedCart } from '../../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Event meta ─────────────────────────────────────────────────────────────

type EventMeta = { icon: string; label: string; category: 'nav' | 'commerce' | 'search' | 'auth' | 'service' | 'other' };

const EVENT_META: Record<ActivityEvent, EventMeta> = {
  page_view:         { icon: '👁️',  label: 'Page View',        category: 'nav' },
  product_view:      { icon: '📦',  label: 'Product View',     category: 'nav' },
  service_view:      { icon: '🔧',  label: 'Service View',     category: 'service' },
  store_view:        { icon: '🏪',  label: 'Store View',       category: 'nav' },
  add_to_cart:       { icon: '🛒',  label: 'Add to Cart',      category: 'commerce' },
  remove_from_cart:  { icon: '❌',  label: 'Remove from Cart', category: 'commerce' },
  update_cart_qty:   { icon: '🔢',  label: 'Update Qty',       category: 'commerce' },
  checkout_start:    { icon: '💳',  label: 'Checkout Started', category: 'commerce' },
  checkout_complete: { icon: '✅',  label: 'Order Placed',     category: 'commerce' },
  search:            { icon: '🔍',  label: 'Search',           category: 'search' },
  login:             { icon: '🔑',  label: 'Login',            category: 'auth' },
  logout:            { icon: '🚪',  label: 'Logout',           category: 'auth' },
  register:          { icon: '🆕',  label: 'Register',         category: 'auth' },
  service_book:      { icon: '📅',  label: 'Service Booked',   category: 'service' },
  order_placed:      { icon: '📦',  label: 'Order Placed',     category: 'commerce' },
  profile_update:    { icon: '✏️',  label: 'Profile Update',   category: 'other' },
  invoice_download:  { icon: '📄',  label: 'Invoice Download', category: 'other' },
  filter_apply:      { icon: '🎛️', label: 'Filter Applied',   category: 'search' },
  wishlist_add:      { icon: '❤️',  label: 'Wishlist Add',     category: 'other' },
};

const CATEGORY_BORDER: Record<EventMeta['category'], string> = {
  nav:      'border-l-4 border-l-blue-400',
  commerce: 'border-l-4 border-l-emerald-400',
  search:   'border-l-4 border-l-amber-400',
  auth:     'border-l-4 border-l-violet-400',
  service:  'border-l-4 border-l-cyan-400',
  other:    'border-l-4 border-l-slate-300',
};

const ROLE_COLORS: Record<string, string> = {
  admin:       'bg-violet-100 text-violet-700',
  store_owner: 'bg-blue-100 text-blue-700',
  customer:    'bg-emerald-100 text-emerald-700',
};

const ALL_EVENTS = Object.keys(EVENT_META) as ActivityEvent[];
const PAGE_SIZE = 20;

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps { label: string; value: string | number; icon: React.ReactNode; color: string }
const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <div className="card p-4 flex items-center gap-4">
    <div className={clsx('p-3 rounded-xl', color)}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const AdminTracking: React.FC = () => {
  const { userActivities, abandonedCarts, clearActivities, markCartRecovered } = useAppStore();

  const [tab, setTab] = useState<'feed' | 'carts'>('feed');
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<ActivityEvent | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [cartFilter, setCartFilter] = useState<'all' | 'pending' | 'recovered'>('all');

  // ── Activity Feed derived state ──────────────────────────────────────────

  const uniqueUsers = useMemo(() => new Set(userActivities.map(a => a.userId)).size, [userActivities]);
  const activeSessions = useMemo(() => new Set(userActivities.map(a => a.sessionId)).size, [userActivities]);
  const eventsToday = useMemo(() => {
    const today = todayISO();
    return userActivities.filter(a => a.createdAt.startsWith(today)).length;
  }, [userActivities]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(userActivities.map(a => a.userRole));
    return ['all', ...Array.from(roles)];
  }, [userActivities]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return userActivities.filter(a => {
      if (q && !a.userName.toLowerCase().includes(q) && !a.userEmail.toLowerCase().includes(q)) return false;
      if (eventFilter !== 'all' && a.event !== eventFilter) return false;
      if (roleFilter !== 'all' && a.userRole !== roleFilter) return false;
      return true;
    });
  }, [userActivities, search, eventFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setSearch(''); setEventFilter('all'); setRoleFilter('all'); setPage(1);
  }

  function handleClearActivities() {
    if (window.confirm('Clear all activity records? This cannot be undone.')) clearActivities();
  }

  function metaSnippet(activity: UserActivity): string {
    const m = activity.metadata;
    if (!m) return '—';
    const entries = Object.entries(m).slice(0, 2);
    return entries.map(([k, v]) => `${k}: ${v}`).join(' · ') || '—';
  }

  // ── Abandoned Carts derived state ────────────────────────────────────────

  const pending = useMemo(() => abandonedCarts.filter(c => !c.recovered), [abandonedCarts]);
  const recovered = useMemo(() => abandonedCarts.filter(c => c.recovered), [abandonedCarts]);
  const abandonedValue = useMemo(() => pending.reduce((s, c) => s + c.total, 0), [pending]);
  const recoveryRate = abandonedCarts.length > 0
    ? ((recovered.length / abandonedCarts.length) * 100).toFixed(1)
    : '0.0';

  const filteredCarts = useMemo(() => {
    if (cartFilter === 'pending') return pending;
    if (cartFilter === 'recovered') return recovered;
    return abandonedCarts;
  }, [abandonedCarts, pending, recovered, cartFilter]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Tracking & Behaviour">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        {(['feed', 'carts'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-5 py-2 rounded-lg font-medium text-sm transition-colors',
              tab === t ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
            )}
          >
            {t === 'feed' ? (
              <span className="flex items-center gap-2"><Activity size={15} /> Activity Feed</span>
            ) : (
              <span className="flex items-center gap-2"><ShoppingCart size={15} /> Abandoned Carts</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ TAB 1: Activity Feed ═══════════════════════════════════════════ */}
      {tab === 'feed' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Events"    value={userActivities.length} icon={<Activity size={20} className="text-indigo-600" />}  color="bg-indigo-50" />
            <StatCard label="Unique Users"    value={uniqueUsers}           icon={<Users size={20} className="text-emerald-600" />}     color="bg-emerald-50" />
            <StatCard label="Active Sessions" value={activeSessions}        icon={<Eye size={20} className="text-blue-600" />}          color="bg-blue-50" />
            <StatCard label="Events Today"    value={eventsToday}           icon={<Clock size={20} className="text-amber-600" />}       color="bg-amber-50" />
          </div>

          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9 w-full text-sm"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>

              {/* Event type */}
              <select
                className="input text-sm min-w-[160px]"
                value={eventFilter}
                onChange={e => { setEventFilter(e.target.value as ActivityEvent | 'all'); setPage(1); }}
              >
                <option value="all">All Event Types</option>
                {ALL_EVENTS.map(ev => (
                  <option key={ev} value={ev}>{EVENT_META[ev].label}</option>
                ))}
              </select>

              {/* Role filter pills */}
              <div className="flex gap-1.5 flex-wrap">
                {uniqueRoles.map(r => (
                  <button
                    key={r}
                    onClick={() => { setRoleFilter(r); setPage(1); }}
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                      roleFilter === r
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300',
                    )}
                  >
                    {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-auto">
                <button onClick={resetFilters} className="btn-secondary flex items-center gap-1.5 text-sm">
                  <X size={14} /> Clear Filters
                </button>
                <button onClick={handleClearActivities} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
                  <Trash2 size={14} /> Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <AlertCircle size={36} />
                <p className="font-medium">No activities match your filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="table-th">Event</th>
                        <th className="table-th">User</th>
                        <th className="table-th hidden md:table-cell">Page</th>
                        <th className="table-th hidden lg:table-cell">Details</th>
                        <th className="table-th text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginated.map((activity: UserActivity) => {
                        const meta = EVENT_META[activity.event] ?? { icon: '•', label: activity.event, category: 'other' as const };
                        return (
                          <tr
                            key={activity.id}
                            className={clsx('hover:bg-slate-50 transition-colors', CATEGORY_BORDER[meta.category])}
                          >
                            <td className="table-td">
                              <span className="flex items-center gap-2 whitespace-nowrap">
                                <span className="text-base">{meta.icon}</span>
                                <span className="text-sm font-medium text-slate-700">{meta.label}</span>
                              </span>
                            </td>
                            <td className="table-td">
                              <p className="font-medium text-slate-800 text-sm">{activity.userName}</p>
                              <p className="text-xs text-slate-500">{activity.userEmail}</p>
                              <span className={clsx('inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[activity.userRole] ?? 'bg-slate-100 text-slate-600')}>
                                {activity.userRole.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="table-td hidden md:table-cell text-sm text-slate-500 max-w-[140px] truncate">
                              {activity.page ?? '—'}
                            </td>
                            <td className="table-td hidden lg:table-cell text-xs text-slate-500 max-w-[200px] truncate">
                              {metaSnippet(activity)}
                            </td>
                            <td className="table-td text-right text-xs text-slate-400 whitespace-nowrap">
                              {relativeTime(activity.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-secondary text-sm disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm text-slate-600">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="btn-secondary text-sm disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB 2: Abandoned Carts ══════════════════════════════════════════ */}
      {tab === 'carts' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total Abandoned"    value={abandonedCarts.length}    icon={<ShoppingCart size={20} className="text-slate-600" />}   color="bg-slate-100" />
            <StatCard label="Pending Recovery"   value={pending.length}           icon={<AlertCircle size={20} className="text-red-500" />}       color="bg-red-50" />
            <StatCard label="Recovered"          value={recovered.length}         icon={<CheckCircle size={20} className="text-emerald-600" />}   color="bg-emerald-50" />
            <StatCard label="Abandoned Value"    value={formatCurrency(abandonedValue)} icon={<RefreshCw size={20} className="text-amber-600" />} color="bg-amber-50" />
            <StatCard label="Recovery Rate"      value={`${recoveryRate}%`}       icon={<Filter size={20} className="text-indigo-600" />}         color="bg-indigo-50" />
          </div>

          {/* Filter toggle */}
          <div className="flex gap-2">
            {(['all', 'pending', 'recovered'] as const).map(f => (
              <button
                key={f}
                onClick={() => setCartFilter(f)}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  cartFilter === f
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300',
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Carts table */}
          <div className="card overflow-hidden">
            {filteredCarts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <ShoppingCart size={36} />
                <p className="font-medium">No abandoned carts in this view</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="table-th">Customer</th>
                      <th className="table-th">Items</th>
                      <th className="table-th text-right">Cart Value</th>
                      <th className="table-th text-center hidden md:table-cell">Count</th>
                      <th className="table-th hidden lg:table-cell">Last Activity</th>
                      <th className="table-th">Status</th>
                      <th className="table-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCarts.map((cart: AbandonedCart) => {
                      const shown = cart.cartItems.slice(0, 3);
                      const extra = cart.cartItems.length - shown.length;
                      return (
                        <tr key={cart.id} className="hover:bg-slate-50 transition-colors">
                          <td className="table-td">
                            <p className="font-medium text-slate-800 text-sm">{cart.userName}</p>
                            <p className="text-xs text-slate-500">{cart.userEmail}</p>
                          </td>
                          <td className="table-td">
                            <div className="flex items-center gap-1">
                              {shown.map(item => (
                                <span key={item.productId} className="text-lg" title={item.productName}>
                                  {item.productIcon}
                                </span>
                              ))}
                              {extra > 0 && (
                                <span className="text-xs text-slate-500 ml-1">+{extra} more</span>
                              )}
                            </div>
                          </td>
                          <td className="table-td text-right font-semibold text-slate-800">
                            {formatCurrency(cart.total)}
                          </td>
                          <td className="table-td text-center hidden md:table-cell text-slate-600">
                            {cart.itemCount}
                          </td>
                          <td className="table-td hidden lg:table-cell text-sm text-slate-500">
                            {relativeTime(cart.lastActivity)}
                          </td>
                          <td className="table-td">
                            {cart.recovered ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                  <CheckCircle size={11} /> Recovered
                                </span>
                                {cart.recoveredAt && (
                                  <p className="text-xs text-slate-400 mt-1">{relativeTime(cart.recoveredAt)}</p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <Clock size={11} /> Pending
                              </span>
                            )}
                          </td>
                          <td className="table-td text-right">
                            {!cart.recovered && (
                              <button
                                onClick={() => markCartRecovered(cart.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              >
                                <CheckCircle size={13} /> Mark Recovered
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminTracking;
