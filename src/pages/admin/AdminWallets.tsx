import React, { useEffect, useState } from 'react';
import { Search, Wallet, TrendingUp, ArrowDownCircle, Plus, Minus, Loader2, X } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { mutations } from '../../lib/dataService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast';

interface WalletRow {
  user_id: string;
  name: string;
  email: string;
  role: string;
  city?: string;
  balance: string;
  pending: string;
  total_earned: string;
  withdrawn: string;
  updated_at: string;
}

const fmt = (n: string | number) =>
  `₹${parseFloat(String(n)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ROLE_COLORS: Record<string, string> = {
  agent:            'bg-orange-100 text-orange-700',
  store_owner:      'bg-blue-100 text-blue-700',
  service_provider: 'bg-emerald-100 text-emerald-700',
  customer:         'bg-pink-100 text-pink-700',
  delivery_partner: 'bg-cyan-100 text-cyan-700',
  admin:            'bg-violet-100 text-violet-700',
};

export const AdminWallets: React.FC = () => {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [actionWallet, setActionWallet] = useState<WalletRow | null>(null);
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  const [actionAmount, setActionAmount] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) { setLoading(false); return; }
      const rows = await mutations.adminListWallets();
      setWallets(rows as unknown as WalletRow[]);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = wallets.filter(w => {
    const matchSearch = !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || w.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalBalance  = wallets.reduce((s, w) => s + parseFloat(w.balance), 0);
  const totalEarned   = wallets.reduce((s, w) => s + parseFloat(w.total_earned), 0);
  const totalWithdrawn = wallets.reduce((s, w) => s + parseFloat(w.withdrawn), 0);

  const openAction = (w: WalletRow, type: 'credit' | 'debit') => {
    setActionWallet(w);
    setActionType(type);
    setActionAmount('');
    setActionNote('');
    setActionError('');
  };

  const handleAction = async () => {
    if (!actionWallet) return;
    const amt = parseFloat(actionAmount);
    if (!amt || amt <= 0) { setActionError('Enter a valid amount'); return; }
    if (!actionNote.trim()) { setActionError('Note is required'); return; }
    setActionBusy(true); setActionError('');
    try {
      if (actionType === 'credit') {
        await mutations.creditWallet(actionWallet.user_id, amt, actionNote);
      } else {
        await mutations.debitWallet(actionWallet.user_id, amt, actionNote);
      }
      toast.success(`${actionType === 'credit' ? 'Credited' : 'Debited'} ₹${amt} ${actionType === 'credit' ? 'to' : 'from'} ${actionWallet.name}'s wallet`);
      setActionWallet(null);
      load();
    } catch (e) {
      setActionError((e as Error).message || 'Failed');
    }
    setActionBusy(false);
  };

  return (
    <AppLayout title="Wallet Management">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Wallet Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">View and manage all user wallets</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Wallet Balance', value: fmt(totalBalance), icon: Wallet, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Total Ever Earned', value: fmt(totalEarned), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Withdrawn', value: fmt(totalWithdrawn), icon: ArrowDownCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input max-w-[180px]" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="agent">Agent</option>
            <option value="store_owner">Store Owner</option>
            <option value="service_provider">Service Provider</option>
            <option value="customer">Customer</option>
            <option value="delivery_partner">Delivery Partner</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="card py-16 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading wallets…
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['User', 'Role', 'Balance', 'Total Earned', 'Withdrawn', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">No wallets found</td></tr>
                  ) : filtered.map(w => (
                    <tr key={w.user_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{w.name}</p>
                        <p className="text-xs text-slate-400">{w.email}</p>
                        {w.city && <p className="text-xs text-slate-400">{w.city}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[w.role] ?? 'bg-slate-100 text-slate-600'}`}>
                          {w.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{fmt(w.balance)}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">{fmt(w.total_earned)}</td>
                      <td className="px-4 py-3 text-slate-600">{fmt(w.withdrawn)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openAction(w, 'credit')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                          >
                            <Plus className="h-3 w-3" /> Credit
                          </button>
                          <button
                            onClick={() => openAction(w, 'debit')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors"
                          >
                            <Minus className="h-3 w-3" /> Debit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Credit/Debit Modal */}
      {actionWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setActionWallet(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-400">{actionType === 'credit' ? 'Add money to' : 'Deduct money from'}</p>
                <h3 className="font-bold text-slate-900">{actionWallet.name}'s Wallet</h3>
                <p className="text-xs text-slate-500">Current balance: {fmt(actionWallet.balance)}</p>
              </div>
              <button onClick={() => setActionWallet(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="Enter amount"
                  min={1}
                  value={actionAmount}
                  onChange={e => { setActionAmount(e.target.value); setActionError(''); }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Note / Reason</label>
                <input
                  className="input w-full"
                  placeholder={actionType === 'credit' ? 'e.g. Bonus, Refund, Manual top-up' : 'e.g. Penalty, Correction'}
                  value={actionNote}
                  onChange={e => { setActionNote(e.target.value); setActionError(''); }}
                />
              </div>
              {actionError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {actionError}
                </div>
              )}
              <button
                onClick={handleAction}
                disabled={actionBusy}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-colors ${
                  actionType === 'credit'
                    ? 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300'
                    : 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
                }`}
              >
                {actionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : actionType === 'credit' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                {actionBusy ? 'Processing…' : `${actionType === 'credit' ? 'Credit' : 'Debit'} ₹${parseFloat(actionAmount || '0').toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
