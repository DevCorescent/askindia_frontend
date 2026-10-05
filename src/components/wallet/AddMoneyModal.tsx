import React, { useState } from 'react';
import { X, IndianRupee, Loader2 } from 'lucide-react';
import { mutations } from '../../lib/dataService';
import { isSupabaseConfigured } from '../../lib/supabase';

declare global {
  interface Window {
    Cashfree: (cfg: { mode: string }) => {
      checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => Promise<void>;
    };
  }
}

function loadCashfreeSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Cashfree === 'function') { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
}

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

interface Props {
  onClose: () => void;
}

export const AddMoneyModal: React.FC<Props> = ({ onClose }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProceed = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 10) { setError('Minimum recharge amount is ₹10'); return; }
    if (amt > 100000) { setError('Maximum recharge amount is ₹1,00,000'); return; }

    setError('');
    setLoading(true);
    try {
      if (!isSupabaseConfigured) { setError('Payment gateway not configured.'); setLoading(false); return; }
      const { paymentSessionId } = await mutations.walletRecharge(amt);
      try { sessionStorage.setItem('wlt_recharge_amount', String(amt)); } catch {}
      await loadCashfreeSDK();
      const cashfree = window.Cashfree({ mode: (import.meta.env.VITE_CASHFREE_ENV as string) || 'sandbox' });
      cashfree.checkout({ paymentSessionId, redirectTarget: '_self' });
    } catch (e) {
      setError((e as Error).message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Secure Payment</p>
              <h3 className="font-bold text-slate-900 text-sm">Add Money to Wallet</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Enter Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
              <input
                type="number"
                className="input pl-7 text-lg font-bold"
                placeholder="0"
                min={10}
                max={100000}
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">Quick select</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => { setAmount(String(a)); setError(''); }}
                  className={`py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    amount === String(a)
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  ₹{a.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <button
            onClick={handleProceed}
            disabled={loading || !amount}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-colors"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : `Pay ₹${parseFloat(amount || '0').toLocaleString('en-IN')} via Cashfree`}
          </button>

          <p className="text-center text-xs text-slate-400">Secured by Cashfree Payments · Instant wallet credit</p>
        </div>
      </div>
    </div>
  );
};
