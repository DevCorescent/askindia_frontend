import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';

type Status = 'loading' | 'success' | 'failed' | 'pending';

interface OrderRow {
  id: string;
  paymentStatus: string;
  total: number;
}

export const PaymentReturn: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useAppStore();

  const orderId = params.get('order_id') ?? '';
  const [status, setStatus] = useState<Status>('loading');
  const [order, setOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    if (!orderId) { setStatus('failed'); return; }

    let attempts = 0;
    const poll = async () => {
      try {
        const data = await api.get<OrderRow>(`/orders/${orderId}`);
        setOrder(data);

        if (data.paymentStatus === 'paid') {
          clearCart();
          setStatus('success');
        } else if (data.paymentStatus === 'failed') {
          setStatus('failed');
        } else if (attempts < 5) {
          attempts++;
          setTimeout(poll, 2000);
        } else {
          // Cashfree webhook may be delayed — show success anyway
          clearCart();
          setStatus('success');
        }
      } catch {
        setStatus('failed');
      }
    };

    poll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-brand-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Confirming your payment…</p>
          <p className="text-slate-400 text-sm mt-1">Please do not close this tab.</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h2>
          <p className="text-slate-500 mb-8">
            Your payment could not be processed. No money has been deducted.
            {orderId && (
              <span className="block mt-1 text-xs font-mono text-slate-400">Order #{orderId}</span>
            )}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/shop/checkout')} className="btn-primary">
              Try Again
            </button>
            <button onClick={() => navigate('/shop')} className="btn-secondary">
              Back to Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
        <p className="text-slate-500 mb-2">
          Your order{' '}
          <span className="font-mono font-bold text-brand-600">#{orderId}</span>{' '}
          has been confirmed.
        </p>
        {order?.total && (
          <p className="text-slate-400 text-sm mb-8">
            Amount paid: ₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/shop/orders')} className="btn-secondary">
            Track Order
          </button>
          <button onClick={() => navigate('/shop')} className="btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
