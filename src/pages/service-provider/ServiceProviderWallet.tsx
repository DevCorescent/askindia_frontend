import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import {
  Wallet, ArrowDownToLine, TrendingUp, Clock, CheckCircle,
  IndianRupee, AlertCircle, ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Sub-components ───────────────────────────────────────────────────────────

const WithdrawalStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'pending') return <Badge variant="warning">Pending</Badge>;
  if (status === 'approved') return <Badge variant="info">Approved</Badge>;
  if (status === 'processed') return <Badge variant="success">Processed</Badge>;
  if (status === 'rejected') return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="neutral">{status}</Badge>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ServiceProviderWallet: React.FC = () => {
  const { currentUser, serviceOrders, withdrawalRequests, addWithdrawalRequest } = useAppStore();
  const providerId = currentUser?.id ?? '';

  // ─── Compute wallet ───────────────────────────────────────────────────────

  const myOrders = serviceOrders.filter(o => o.providerId === providerId);
  const completedOrders = myOrders.filter(o => o.status === 'completed');
  const totalEarned = completedOrders.reduce((sum, o) => sum + o.amount, 0);

  const myWithdrawals = withdrawalRequests
    .filter(r => r.entityId === providerId && r.entityType === 'service_provider')
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const totalWithdrawn = myWithdrawals
    .filter(r => r.status === 'approved' || r.status === 'processed')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingWithdrawals = myWithdrawals
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const available = totalEarned - totalWithdrawn - pendingWithdrawals;

  // ─── Modal state ──────────────────────────────────────────────────────────

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [note, setNote] = useState('');
  const [formErrors, setFormErrors] = useState<{ amount?: string; bankAccount?: string; ifsc?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetModal = () => {
    setAmount('');
    setBankAccount('');
    setIfsc('');
    setNote('');
    setFormErrors({});
    setSubmitted(false);
  };

  const openModal = () => {
    resetModal();
    setShowModal(true);
  };

  const validateWithdrawal = (): boolean => {
    const e: typeof formErrors = {};
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) e.amount = 'Enter a valid amount';
    else if (amt < 500) e.amount = 'Minimum withdrawal amount is ₹500';
    else if (amt > available) e.amount = `Maximum available: ${formatCurrency(available)}`;
    if (!bankAccount.trim()) e.bankAccount = 'Bank account number is required';
    if (!ifsc.trim()) e.ifsc = 'IFSC code is required';
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) e.ifsc = 'Invalid IFSC format (e.g. HDFC0001234)';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmitWithdrawal = async () => {
    if (!validateWithdrawal()) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    addWithdrawalRequest({
      entityType: 'service_provider',
      entityId: providerId,
      entityName: currentUser?.name ?? '',
      ownerName: currentUser?.name ?? '',
      amount: Number(amount),
      bankAccount: bankAccount.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      status: 'pending',
      requestedAt: new Date().toISOString().slice(0, 10),
      note: note.trim() || undefined,
    });
    setIsSubmitting(false);
    setSubmitted(true);
  };

  // ─── Recent earnings (completed orders, last 10) ──────────────────────────

  const recentEarnings = [...completedOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <AppLayout title="Wallet">
      <div className="space-y-5">

        {/* Balance card */}
        <div className="rounded-2xl p-6 text-white overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9, #4c1d95)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v6h6v-6h-6zm6-6h6v-6h-6v6zm-12 6h6v-6h-6v6'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-white/15 rounded-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <p className="text-violet-200 text-sm font-medium">Available Balance</p>
              </div>
              <p className="text-4xl font-extrabold mb-1">{formatCurrency(Math.max(0, available))}</p>
              <p className="text-violet-300 text-xs">Updated in real-time</p>
            </div>
            <button
              onClick={openModal}
              disabled={available < 500}
              className={clsx(
                'flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all self-start',
                available >= 500
                  ? 'bg-white text-violet-700 hover:bg-violet-50 shadow-lg'
                  : 'bg-white/20 text-white/50 cursor-not-allowed'
              )}>
              <ArrowDownToLine className="h-4 w-4" />
              Request Withdrawal
            </button>
          </div>

          <div className="relative grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/20">
            <div>
              <p className="text-violet-300 text-xs mb-0.5">Total Earned</p>
              <p className="font-bold text-sm">{formatCurrency(totalEarned)}</p>
            </div>
            <div>
              <p className="text-violet-300 text-xs mb-0.5">Withdrawn</p>
              <p className="font-bold text-sm">{formatCurrency(totalWithdrawn)}</p>
            </div>
            <div>
              <p className="text-violet-300 text-xs mb-0.5">Pending</p>
              <p className="font-bold text-sm">{formatCurrency(pendingWithdrawals)}</p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed Bookings</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{completedOrders.length}</p>
                <p className="text-xs text-slate-400 mt-1">Revenue generating</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Withdrawal</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {myWithdrawals.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatCurrency(pendingWithdrawals)} awaiting
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Processed</p>
                <p className="text-2xl font-bold text-violet-600 mt-1">
                  {myWithdrawals.filter(r => r.status === 'processed').length}
                </p>
                <p className="text-xs text-slate-400 mt-1">{formatCurrency(totalWithdrawn)} paid out</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-xl">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent earnings */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Earnings</h3>
            <p className="text-xs text-slate-400 mt-0.5">From completed service bookings</p>
          </div>
          {recentEarnings.length === 0 ? (
            <div className="py-12 text-center">
              <IndianRupee className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No earnings yet. Complete your first booking to start earning.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Service</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEarnings.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${order.serviceColor} flex items-center justify-center text-sm flex-shrink-0`}>
                            {order.serviceIcon}
                          </div>
                          <span className="text-sm text-slate-700">{order.serviceTitle}</span>
                        </div>
                      </td>
                      <td className="table-td text-sm text-slate-600">{order.customerName}</td>
                      <td className="table-td text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                      <td className="table-td">
                        <span className="font-bold text-emerald-600">+{formatCurrency(order.amount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdrawal history */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Withdrawal History</h3>
          </div>
          {myWithdrawals.length === 0 ? (
            <div className="py-12 text-center">
              <ArrowDownToLine className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No withdrawal requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Request ID</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Bank Account</th>
                    <th className="table-th">IFSC</th>
                    <th className="table-th">Requested</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {myWithdrawals.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="table-td font-mono text-xs text-violet-600 font-semibold">
                        #{req.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="table-td font-bold text-emerald-600">{formatCurrency(req.amount)}</td>
                      <td className="table-td text-sm text-slate-700">{req.bankAccount}</td>
                      <td className="table-td font-mono text-xs text-slate-600">{req.ifsc}</td>
                      <td className="table-td text-xs text-slate-500">{formatDate(req.requestedAt)}</td>
                      <td className="table-td"><WithdrawalStatusBadge status={req.status} /></td>
                      <td className="table-td text-xs text-slate-400 italic">{req.note ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetModal(); }}
        title="Request Withdrawal"
        size="md"
      >
        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 mb-2">Request Submitted!</p>
            <p className="text-sm text-slate-500 mb-6">
              Your withdrawal of <strong>{formatCurrency(Number(amount))}</strong> has been submitted.
              Funds will be transferred within 2–3 business days after approval.
            </p>
            <div className="flex items-center gap-2 justify-center text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-violet-500" />
              Secured and verified by AskIndia
            </div>
            <button
              onClick={() => { setShowModal(false); resetModal(); }}
              className="mt-6 w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Balance info */}
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-violet-500 font-medium">Available Balance</p>
                  <p className="text-2xl font-bold text-violet-700">{formatCurrency(Math.max(0, available))}</p>
                </div>
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-violet-600" />
                </div>
              </div>
              {available < 500 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Minimum withdrawal amount is ₹500.
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Amount to Withdraw (₹) <span className="text-red-500">*</span>
              </label>
              <input
                className={clsx('input', formErrors.amount && 'border-red-400 bg-red-50')}
                type="number" value={amount}
                onChange={e => {
                  setAmount(e.target.value);
                  setFormErrors(fe => ({ ...fe, amount: undefined }));
                }}
                placeholder="Enter amount"
                min={500} max={available}
              />
              <p className="text-xs text-slate-400 mt-1">
                Minimum: ₹500 | Maximum: {formatCurrency(Math.max(0, available))}
              </p>
              {formErrors.amount && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.amount}
                </p>
              )}
            </div>

            {/* Bank account */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Bank Account Number <span className="text-red-500">*</span>
              </label>
              <input
                className={clsx('input', formErrors.bankAccount && 'border-red-400 bg-red-50')}
                value={bankAccount}
                onChange={e => {
                  setBankAccount(e.target.value);
                  setFormErrors(fe => ({ ...fe, bankAccount: undefined }));
                }}
                placeholder="Your bank account number"
              />
              {formErrors.bankAccount && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.bankAccount}
                </p>
              )}
            </div>

            {/* IFSC */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                IFSC Code <span className="text-red-500">*</span>
              </label>
              <input
                className={clsx('input font-mono', formErrors.ifsc && 'border-red-400 bg-red-50')}
                value={ifsc}
                onChange={e => {
                  setIfsc(e.target.value.toUpperCase().slice(0, 11));
                  setFormErrors(fe => ({ ...fe, ifsc: undefined }));
                }}
                placeholder="HDFC0001234"
                maxLength={11}
              />
              {formErrors.ifsc && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.ifsc}
                </p>
              )}
            </div>

            {/* Optional note */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Note <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <input className="input" value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any remarks for this withdrawal request" />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowModal(false); resetModal(); }}
                className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSubmitWithdrawal}
                disabled={isSubmitting || available < 500}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60">
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};
