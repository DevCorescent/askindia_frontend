import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { Wallet, TrendingUp, ArrowDownCircle } from 'lucide-react';
import clsx from 'clsx';

export const AgentWallet: React.FC = () => {
  const { currentUser, orders, serviceOrders, agents, addWithdrawalRequest } = useAppStore();

  const agent = agents.find(a => a.id === currentUser?.id);
  const myOrders = orders.filter(o => o.agentId === currentUser?.id && o.agentCommission && o.agentCommission > 0);
  const mySvcOrders = serviceOrders.filter(o => o.agentId === currentUser?.id && o.agentCommission && o.agentCommission > 0);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [amount, setAmount] = useState('');
  const [wError, setWError] = useState('');
  const [wSuccess, setWSuccess] = useState(false);

  if (!agent || !currentUser) {
    return (
      <AppLayout title="My Wallet">
        <div className="py-20 text-center text-slate-400">Wallet not found.</div>
      </AppLayout>
    );
  }

  const handleWithdraw = () => {
    if (!bankAccount.trim()) { setWError('Bank account number is required.'); return; }
    if (!ifsc.trim()) { setWError('IFSC code is required.'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setWError('Enter a valid withdrawal amount.'); return; }
    if (amt > agent.walletBalance) { setWError('Amount exceeds wallet balance.'); return; }

    addWithdrawalRequest({
      entityType: 'store',
      entityId: agent.id,
      entityName: `Agent: ${agent.name}`,
      ownerName: agent.name,
      amount: amt,
      bankAccount: bankAccount.trim(),
      ifsc: ifsc.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
    });

    setWSuccess(true);
    setWError('');
  };

  return (
    <AppLayout title="My Wallet">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Wallet</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track your earnings and withdraw commissions</p>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <p className="font-semibold text-orange-100">Available Balance</p>
            </div>
            <p className="text-4xl font-extrabold">{formatCurrency(agent.walletBalance)}</p>
            <p className="text-orange-200 text-sm mt-1">Available for withdrawal</p>
            <button
              onClick={() => { setShowWithdrawModal(true); setWSuccess(false); setWError(''); }}
              className="mt-4 flex items-center gap-2 bg-white text-orange-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <ArrowDownCircle className="h-4 w-4" />
              Request Withdrawal
            </button>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="font-semibold text-slate-600">Total Earned</p>
            </div>
            <p className="text-4xl font-extrabold text-slate-900">{formatCurrency(agent.totalEarned)}</p>
            <p className="text-slate-400 text-sm mt-1">Lifetime commissions earned</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Total Orders</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{agent.totalOrders}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Commission Rate</p>
                <p className="text-lg font-bold text-orange-600 mt-0.5">{agent.commissionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission history */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Commission History</h3>
            <p className="text-xs text-slate-400 mt-0.5">Products + Services — all orders where you earned commission</p>
          </div>
          {myOrders.length === 0 && mySvcOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Wallet className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No commission history yet</p>
              <p className="text-sm mt-1">Record sales or bookings to start earning.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {/* Product orders */}
              {myOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${order.items[0]?.productColor ?? 'from-orange-400 to-amber-500'} flex items-center justify-center text-base flex-shrink-0`}>
                      {order.items[0]?.productIcon ?? '📦'}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-400 font-mono">#{order.id.slice(-8).toUpperCase()} · {formatDate(order.createdAt)}</p>
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">Product Sale</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">+{formatCurrency(order.agentCommission ?? 0)}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(order.total)} order</p>
                  </div>
                </div>
              ))}
              {/* Service bookings */}
              {mySvcOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${order.serviceColor} flex items-center justify-center text-base flex-shrink-0`}>
                      {order.serviceIcon}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-400 font-mono">#{order.id.slice(-8).toUpperCase()} · {formatDate(order.createdAt)}</p>
                      <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">Service Booking</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">+{formatCurrency(order.agentCommission ?? 0)}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(order.amount)} booking</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Request Withdrawal</h3>
              <p className="text-xs text-slate-400 mt-0.5">Available: {formatCurrency(agent.walletBalance)}</p>
            </div>
            {wSuccess ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowDownCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-lg font-bold text-slate-900">Request Submitted!</p>
                <p className="text-sm text-slate-500 mt-2">Your withdrawal request is being processed.</p>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹) *</label>
                  <input
                    className="input"
                    type="number"
                    placeholder={`Max: ${agent.walletBalance}`}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Bank Account Number *</label>
                  <input
                    className="input"
                    placeholder="Enter account number"
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">IFSC Code *</label>
                  <input
                    className="input"
                    placeholder="e.g. SBIN0001234"
                    value={ifsc}
                    onChange={e => setIfsc(e.target.value.toUpperCase())}
                  />
                </div>
                {wError && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    ⚠ {wError}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    className={clsx('flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors bg-orange-500 hover:bg-orange-600')}
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};
