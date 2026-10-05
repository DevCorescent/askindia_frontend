import React, { useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import { mutations } from '../../lib/dataService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AddMoneyModal } from '../../components/wallet/AddMoneyModal';
import { Wallet, Plus, Loader2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface WalletData {
  balance: number;
  pending: number;
  total_earned: number;
  withdrawn: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    created_at: string;
    reference_id?: string;
  }>;
}

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const CustomerWallet: React.FC = () => {
  const { currentUser } = useAppStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) { setLoading(false); return; }
    mutations.getMyWallet()
      .then(d => setWallet(d as WalletData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  return (
    <>
    <AppLayout title="My Wallet">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Balance card */}
        <div className="rounded-2xl p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5, #3730a3)' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-indigo-200 text-sm mb-1">Wallet Balance</p>
              {loading
                ? <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse" />
                : <p className="text-4xl font-extrabold">{fmt(wallet?.balance ?? 0)}</p>
              }
              <p className="text-indigo-300 text-xs mt-1">Available for payments</p>
            </div>
            <div className="p-3 bg-white/15 rounded-xl">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <button
            onClick={() => setShowAddMoney(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Money
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <p className="text-xs text-slate-500 mb-1">Total Recharged</p>
            <p className="text-lg font-bold text-slate-900">{fmt(wallet?.total_earned ?? 0)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 mb-1">Total Spent</p>
            <p className="text-lg font-bold text-slate-900">{fmt(wallet?.withdrawn ?? 0)}</p>
          </div>
        </div>

        {/* Transactions */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Transaction History</h3>
          </div>
          {loading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : !wallet?.transactions?.length ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {wallet.transactions.slice(0, 20).map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'credit' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {tx.type === 'credit'
                      ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                      : <ArrowUpRight className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{tx.description}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
    {showAddMoney && <AddMoneyModal onClose={() => setShowAddMoney(false)} />}
    </>
  );
};
