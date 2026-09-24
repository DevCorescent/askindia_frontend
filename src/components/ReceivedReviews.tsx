import React, { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { mutations } from '../lib/dataService';
import { formatDate } from '../data/mockData';
import type { Review } from '../types';

/** Customer reviews on the signed-in store's / service provider's own items. */
export const ReceivedReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    mutations.loadReceivedReviews()
      .then(r => { if (!cancelled) setReviews(r); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  const avg = reviews?.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Customer Reviews</h3>
        {!!reviews?.length && (
          <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {avg.toFixed(1)} <span className="text-slate-400 font-normal">({reviews.length})</span>
          </span>
        )}
      </div>
      {error ? (
        <p className="py-8 text-center text-slate-400 text-sm">Could not load reviews</p>
      ) : !reviews ? (
        <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-slate-400 text-sm">No reviews yet</p>
      ) : (
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {reviews.slice(0, 20).map(r => (
            <div key={r.id} className="px-5 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
              </div>
              {r.reviewText && <p className="text-sm text-slate-700 mt-1">{r.reviewText}</p>}
              <p className="text-xs text-slate-400 mt-1">
                {r.customerName ?? 'Customer'}{r.itemName ? ` · ${r.itemName}` : ''} · Order #{r.orderId.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
