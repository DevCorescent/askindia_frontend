import React, { useEffect, useState } from 'react';
import { CheckCircle, Circle, XCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { mutations } from '../lib/dataService';
import type { OrderStatusEvent } from '../types';

// Customer-facing names for each status (the stored status keys are unchanged).
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending:     'Order Placed',
  processing:  'Accepted',
  shipped:     'Dispatched',
  delivered:   'Delivered',
  cancelled:   'Cancelled',
};
export const SERVICE_STATUS_LABEL: Record<string, string> = {
  pending:     'Booked',
  confirmed:   'Confirmed',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  rejected:    'Declined',
};

const PRODUCT_FLOW = ['pending', 'processing', 'shipped', 'delivered'];
const SERVICE_FLOW = ['pending', 'confirmed', 'in_progress', 'completed'];
const TERMINAL_FAIL = ['cancelled', 'rejected'];

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

interface Props {
  orderId: string;
  kind: 'product' | 'service';
  /** Current status — the timeline refetches when it changes. */
  status: string;
}

/**
 * Vertical status timeline for one order, read from the backend's status
 * history (never derived client-side). Steps not reached yet are shown greyed.
 */
export const OrderTimeline: React.FC<Props> = ({ orderId, kind, status }) => {
  const [events, setEvents] = useState<OrderStatusEvent[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    const load = kind === 'product' ? mutations.loadOrderTracking : mutations.loadServiceOrderTracking;
    load(orderId)
      .then(r => { if (!cancelled) setEvents(r.timeline); })
      .catch(e => { if (!cancelled) setError((e as Error).message || 'Could not load tracking'); });
    return () => { cancelled = true; };
  }, [orderId, kind, status]);

  if (error) return <p className="text-xs text-red-500">{error}</p>;
  if (!events) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading tracking…
      </div>
    );
  }

  const labels = kind === 'product' ? ORDER_STATUS_LABEL : SERVICE_STATUS_LABEL;
  const flow = kind === 'product' ? PRODUCT_FLOW : SERVICE_FLOW;
  const reached = new Set(events.map(e => e.status));
  const ended = events.some(e => TERMINAL_FAIL.includes(e.status));
  // Upcoming steps, only while the order is still moving forward.
  const upcoming = ended ? [] : flow.filter(s => !reached.has(s));

  return (
    <ol className="space-y-0">
      {events.map((e, i) => {
        const failed = TERMINAL_FAIL.includes(e.status);
        const last = i === events.length - 1 && upcoming.length === 0;
        return (
          <li key={`${e.status}-${i}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              {failed
                ? <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                : <CheckCircle className="h-5 w-5 text-brand-600 flex-shrink-0" />}
              {!last && <div className="w-0.5 flex-1 min-h-[18px] bg-brand-200" />}
            </div>
            <div className="pb-3">
              <p className={clsx('text-sm font-semibold', failed ? 'text-red-600' : 'text-slate-800')}>
                {labels[e.status] ?? e.status}
              </p>
              <p className="text-xs text-slate-400">{formatDateTime(e.at)}</p>
              {e.note && <p className="text-xs text-slate-500 mt-0.5">{e.note}</p>}
            </div>
          </li>
        );
      })}
      {upcoming.map((s, i) => (
        <li key={s} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Circle className="h-5 w-5 text-slate-300 flex-shrink-0" />
            {i < upcoming.length - 1 && <div className="w-0.5 flex-1 min-h-[18px] bg-slate-200" />}
          </div>
          <p className="text-sm text-slate-400 pb-3">{labels[s]}</p>
        </li>
      ))}
    </ol>
  );
};
