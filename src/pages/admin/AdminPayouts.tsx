import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import type { WithdrawalRequest } from '../../types';
import { CheckCircle, XCircle, Wallet, Clock, ArrowDownToLine, Store, Briefcase } from 'lucide-react';

export const AdminPayouts: React.FC = () => {
  const { withdrawalRequests, stores, updateWithdrawalRequest } = useAppStore();

  const [selected, setSelected] = useState<WithdrawalRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);

  const approve = (id: string) => {
    updateWithdrawalRequest(id, {
      status: 'approved',
      processedAt: new Date().toISOString().slice(0, 10),
    });
    setSelected(null);
  };

  const reject = (id: string) => {
    updateWithdrawalRequest(id, { status: 'rejected', note: rejectNote });
    setSelected(null);
    setShowReject(false);
    setRejectNote('');
  };

  const pending = withdrawalRequests.filter(r => r.status === 'pending');
  const totalPendingAmt = pending.reduce((s, r) => s + r.amount, 0);
  const processed = withdrawalRequests.filter(r => r.status === 'approved' || r.status === 'processed');
  const totalProcessedAmt = processed.reduce((s, r) => s + r.amount, 0);
  const totalWalletBalance = stores.reduce((s, st) => s + st.walletBalance, 0);
  const activeStores = stores.filter(s => s.status === 'active').length;

  const entityTypeBadge = (type: WithdrawalRequest['entityType']) => {
    if (type === 'store') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">
          <Store className="h-3 w-3" /> Store
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-medium">
        <Briefcase className="h-3 w-3" /> Service Provider
      </span>
    );
  };

  return (
    <AppLayout title="Payout Management">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payouts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage withdrawal requests from stores and service providers on AskIndia</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Requests</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{pending.length}</p>
                <p className="text-sm text-slate-400 mt-1">{formatCurrency(totalPendingAmt)} awaiting</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Approved Payouts</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatCurrency(totalProcessedAmt)}
                </p>
                <p className="text-sm text-slate-400 mt-1">{processed.length} payouts</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <ArrowDownToLine className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Wallet Balances</p>
                <p className="text-2xl font-bold text-brand-600 mt-1">
                  {formatCurrency(totalWalletBalance)}
                </p>
                <p className="text-sm text-slate-400 mt-1">Across {activeStores} stores</p>
              </div>
              <div className="p-3 bg-brand-100 rounded-xl">
                <Wallet className="h-5 w-5 text-brand-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Store wallet overview */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Store Wallet Balances</h3>
          </div>
          {stores.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              No stores registered yet
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Store</th>
                  <th className="table-th">Owner</th>
                  <th className="table-th">City / State</th>
                  <th className="table-th">Total Sales</th>
                  <th className="table-th">Wallet Balance</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(store => (
                  <tr key={store.id} className="hover:bg-slate-50">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{store.logo}</span>
                        <span className="font-medium text-sm">{store.name}</span>
                      </div>
                    </td>
                    <td className="table-td text-sm text-slate-600">{store.ownerName}</td>
                    <td className="table-td text-sm text-slate-500">
                      {[store.city, store.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="table-td font-semibold">{formatCurrency(store.totalSales)}</td>
                    <td className="table-td">
                      <span className={`font-bold ${store.walletBalance > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {formatCurrency(store.walletBalance)}
                      </span>
                    </td>
                    <td className="table-td">{statusBadge(store.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Withdrawal requests */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Withdrawal Requests</h3>
          </div>
          {withdrawalRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Wallet className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-slate-500">No withdrawal requests yet</p>
              <p className="text-sm mt-1">Store owners and service providers will submit requests here</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Request ID</th>
                  <th className="table-th">Entity</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Bank Account</th>
                  <th className="table-th">Requested</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="table-td font-mono text-xs text-brand-600">#{req.id.toUpperCase()}</td>
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-sm">{req.ownerName}</p>
                        <p className="text-xs text-slate-400">{req.entityName}</p>
                      </div>
                    </td>
                    <td className="table-td">{entityTypeBadge(req.entityType)}</td>
                    <td className="table-td font-bold text-emerald-600">{formatCurrency(req.amount)}</td>
                    <td className="table-td text-sm text-slate-600">{req.bankAccount}</td>
                    <td className="table-td text-xs text-slate-500">{formatDate(req.requestedAt)}</td>
                    <td className="table-td">{statusBadge(req.status)}</td>
                    <td className="table-td">
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => approve(req.id)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors" title="Approve">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setSelected(req); setShowReject(true); }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Reject">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {req.note && <p className="text-xs text-red-500 italic">{req.note}</p>}
                      {req.processedAt && <p className="text-xs text-slate-400">{formatDate(req.processedAt)}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reject modal */}
      <Modal isOpen={showReject} onClose={() => { setShowReject(false); setSelected(null); }} title="Reject Withdrawal" size="sm">
        {selected && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              Rejecting <strong>{formatCurrency(selected.amount)}</strong> request from <strong>{selected.ownerName}</strong>
              {' '}({selected.entityName})
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for rejection</label>
              <textarea
                className="input h-20 resize-none"
                placeholder="e.g. Bank details mismatch, insufficient balance..."
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowReject(false); setSelected(null); }} className="btn-secondary">Cancel</button>
              <button onClick={() => reject(selected.id)} className="btn-danger">Reject Request</button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};
