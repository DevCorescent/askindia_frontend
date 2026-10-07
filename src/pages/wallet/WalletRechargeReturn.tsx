import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const WalletRechargeReturn: React.FC = () => {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const { currentUser } = useAppStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [amount, setAmount] = useState<string | null>(null);

  useEffect(() => {
    const orderStatus = params.get('order_status');
    try { setAmount(sessionStorage.getItem('wlt_recharge_amount')); } catch {}
    if (orderStatus === 'PAID') {
      setStatus('success');
    } else {
      setStatus('failed');
    }
  }, [params]);

  const walletRoute = () => {
    const role = currentUser?.role;
    if (role === 'agent') return '/agent/wallet';
    if (role === 'store_owner') return '/store/wallet';
    if (role === 'service_provider') return '/service-provider/wallet';
    if (role === 'customer') return '/shop/wallet';
    return '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600 font-medium">Confirming payment…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Wallet Credited!</h2>
            {amount && (
              <p className="text-3xl font-black text-emerald-600 mb-2">₹{parseFloat(amount).toLocaleString('en-IN')}</p>
            )}
            <p className="text-sm text-slate-500 mb-6">Your wallet has been topped up successfully.</p>
            <button
              onClick={() => navigate(walletRoute())}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors"
            >
              Go to My Wallet
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Failed</h2>
            <p className="text-sm text-slate-500 mb-6">Your payment was not completed. No amount was deducted.</p>
            <button
              onClick={() => navigate(walletRoute())}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors"
            >
              Back to Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
};
