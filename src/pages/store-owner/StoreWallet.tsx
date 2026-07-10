import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { Wallet, ArrowDownToLine, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export const StoreWallet: React.FC = () => {
  const { currentUser, stores, orders, withdrawalRequests, addWithdrawalRequest, loadingData, supabaseReady } = useAppStore();
  const myStore = stores.find(s => s.id === currentUser?.storeId);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const myOrders = orders.filter(o => o.storeId === currentUser?.storeId && o.status === 'delivered');
  const totalEarned = myOrders.reduce((s, o) => s + o.commissionTotal, 0);
  const myRequests = withdrawalRequests.filter(r => r.entityId === currentUser?.storeId && r.entityType === 'store');
  const totalWithdrawn = myRequests.filter(r => ['approved', 'processed'].includes(r.status)).reduce((s, r) => s + r.amount, 0);
  const available = Math.max(0, totalEarned - totalWithdrawn);

  const transactions = myOrders.map(o => ({
    id: o.id, type: 'credit' as const,
    description: `Commission for order #${o.id.toUpperCase()}`,
    amount: o.commissionTotal, date: o.createdAt, orderId: o.id,
  }));

  const handleWithdraw = () => {
    if (!myStore || !currentUser) return;
    const today = new Date().toISOString().slice(0, 10);
    addWithdrawalRequest({
      entityType: 'store',
      entityId: myStore.id,
      entityName: myStore.name,
      ownerName: currentUser.name,
      amount: Number(amount),
      bankAccount,
      ifsc,
      status: 'pending',
      requestedAt: today,
    });
    setSubmitted(true);
    setTimeout(() => {
      setShowWithdraw(false);
      setSubmitted(false);
      setAmount('');
      setBankAccount('');
      setIfsc('');
    }, 2000);
  };

  if (loadingData || !supabaseReady) {
    return (
      <AppLayout title="Wallet & Payouts">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!myStore) {
    return (
      <AppLayout title="Wallet & Payouts">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">💰</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Store setup pending</h2>
          <p className="text-slate-500 text-sm">Your wallet will be available once your store is approved.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Wallet & Payouts">
      <div className="space-y-5">
        {/* Wallet balance */}
        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/60 text-sm mb-1">Available Balance</p>
              <p className="text-4xl font-extrabold">{formatCurrency(available)}</p>
            </div>
            <div className="p-3 bg-white/15 rounded-xl">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/50 text-xs mb-0.5">Total Earned</p>
              <p className="font-bold text-sm">{formatCurrency(totalEarned)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs mb-0.5">Withdrawn</p>
              <p className="font-bold text-sm">{formatCurrency(totalWithdrawn)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs mb-0.5">Pending</p>
              <p className="font-bold text-sm">
                {formatCurrency(myRequests.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-5">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Commission Rate</p>
                <p className="text-2xl font-bold text-brand-600 mt-1">{myStore.commissionRate}%</p>
                <p className="text-xs text-slate-400 mt-1">per successful order</p>
              </div>
              <div className="p-3 bg-brand-100 rounded-xl">
                <TrendingUp className="h-5 w-5 text-brand-600" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Requests</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {myRequests.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-xs text-slate-400 mt-1">awaiting approval</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="card p-5 flex items-center justify-center">
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={available <= 0}
              className="btn-primary w-full justify-center py-3"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Request Withdrawal
            </button>
          </div>
        </div>

        {/* Transaction history */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Commission History</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 8).map(tx => (
              <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{tx.description}</p>
                    <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold">+{formatCurrency(tx.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Withdrawal requests */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Withdrawal Requests</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Request ID</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Bank Account</th>
                <th className="table-th">Requested</th>
                <th className="table-th">Status</th>
                <th className="table-th">Note</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono text-xs text-brand-600">#{req.id.toUpperCase()}</td>
                  <td className="table-td font-bold text-emerald-600">{formatCurrency(req.amount)}</td>
                  <td className="table-td text-sm">{req.bankAccount}</td>
                  <td className="table-td text-xs text-slate-500">{formatDate(req.requestedAt)}</td>
                  <td className="table-td">{statusBadge(req.status)}</td>
                  <td className="table-td text-xs text-slate-500 italic">{req.note ?? '—'}</td>
                </tr>
              ))}
              {myRequests.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">No withdrawal requests yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal modal */}
      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Request Withdrawal" size="sm">
        {!submitted ? (
          <div className="space-y-4">
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
              <p className="text-sm text-brand-700">Available balance: <strong>{formatCurrency(available)}</strong></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount to Withdraw (₹)</label>
              <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount" max={available} />
              <p className="text-xs text-slate-400 mt-1">Minimum: ₹500 | Maximum: {formatCurrency(available)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bank Account</label>
              <input className="input" value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="e.g. HDFC ****4521" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">IFSC Code</label>
              <input className="input" value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="e.g. HDFC0001234" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowWithdraw(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleWithdraw}
                disabled={!amount || Number(amount) < 500 || Number(amount) > available || !bankAccount || !ifsc}
                className="btn-primary"
              >
                Submit Request
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">Request Submitted!</p>
            <p className="text-slate-500 text-sm mt-2">Your withdrawal request of {formatCurrency(Number(amount))} has been submitted and will be processed within 2-3 business days.</p>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};
