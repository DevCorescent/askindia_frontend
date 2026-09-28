import React, { useEffect, useState } from 'react';
import { CheckCircle, Circle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { mutations } from '../lib/dataService';
import { userFacingError } from '../api/client';
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
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError('');
    setEvents(null);
    const load = kind === 'product' ? mutations.loadOrderTracking : mutations.loadServiceOrderTracking;
    load(orderId)
      .then(r => { if (!cancelled) setEvents(r.timeline ?? []); })
      .catch(e => { if (!cancelled) setError(userFacingError(e, 'Status history is unavailable right now.')); });
    return () => { cancelled = true; };
  }, [orderId, kind, status, attempt]);

  const labels = kind === 'product' ? ORDER_STATUS_LABEL : SERVICE_STATUS_LABEL;

  if (error) {
    // The history couldn't be fetched; the order's own current status is still
    // known, so show that rather than an empty or broken section.
    return (
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <div>
          <p>
            Current status: <span className="font-semibold text-slate-700">{labels[status] ?? status}</span>
          </p>
          <p className="text-slate-400 mt-0.5">
            {error}{' '}
            <button type="button" onClick={() => setAttempt(a => a + 1)} className="text-brand-600 hover:text-brand-700 font-medium">
              Retry
            </button>
          </p>
        </div>
      </div>
    );
  }
  if (!events) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading tracking…
      </div>
    );
  }

  if (events.length === 0) {
    // e.g. orders placed before status history was recorded.
    return (
      <p className="text-xs text-slate-500">
        Current status: <span className="font-semibold text-slate-700">{labels[status] ?? status}</span>
        <span className="block text-slate-400 mt-0.5">No status updates have been recorded for this order yet.</span>
      </p>
    );
  }

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
