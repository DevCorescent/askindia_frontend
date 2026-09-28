import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Loader2, CheckCircle, PenLine } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { mutations } from '../lib/dataService';
import { ApiError, userFacingError } from '../api/client';
import { toast } from './ui/Toast';

/** Backend limit for review text (POST /reviews). */
export const MAX_REVIEW_LENGTH = 2000;

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

/** User-facing text for a failed POST /reviews. */
export function reviewErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 409) return 'You have already reviewed this product for this order.';
    if (e.status === 401) return 'Your session has expired. Please sign in again to submit your review.';
    if (e.status === 403) return 'Only customers who have received this product can review it.';
    if (e.status === 404) return "We couldn't find that order. Please refresh the page and try again.";
  }
  return userFacingError(e, 'Could not save your review. Please try again.');
}

const reviewKey = (orderId: string, productId: string) => `${orderId}:${productId}`;

interface Props {
  productId: string;
  /** Called after a review is saved (or found to exist) so the page can reload its reviews. */
  onReviewed: () => void;
}

/**
 * "Write a Review" for a product page. Only a customer with a delivered order
 * containing this product, not yet reviewed for that order, gets the form —
 * the same rules the backend enforces.
 */
export const ProductReviewForm: React.FC<Props> = ({ productId, onReviewed }) => {
  const { currentUser, orders, supabaseReady, loadingData } = useAppStore();
  const isCustomer = currentUser?.role === 'customer';

  // (order, product) pairs this customer has already reviewed; null while loading.
  const [reviewed, setReviewed] = useState<Set<string> | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Outlives the form, e.g. the duplicate-review message after it closes.
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isCustomer) return;
    let cancelled = false;
    setReviewed(null);
    mutations.loadMyReviews()
      .then(rs => { if (!cancelled) setReviewed(new Set(rs.filter(r => r.productId).map(r => reviewKey(r.orderId, r.productId!)))); })
      // Unknown: let them try — the backend still refuses a duplicate with 409.
      .catch(() => { if (!cancelled) setReviewed(new Set()); });
    return () => { cancelled = true; };
  }, [isCustomer, currentUser?.id]);

  // Delivered orders containing this product, newest first.
  const deliveredOrders = useMemo(() => (
    isCustomer
      ? orders
        .filter(o => o.customerId === currentUser!.id && o.status === 'delivered' && o.items.some(i => i.productId === productId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : []
  ), [isCustomer, orders, currentUser, productId]);

  const eligibleOrder = reviewed ? deliveredOrders.find(o => !reviewed.has(reviewKey(o.id, productId))) : undefined;

  const reset = () => { setOpen(false); setRating(0); setHover(0); setText(''); setTouched(false); setError(''); };

  // A different product page reuses this component instance.
  useEffect(() => { reset(); setNotice(''); }, [productId]);

  if (!currentUser) {
    return (
      <p className="text-sm text-slate-500">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link> to write a review.
      </p>
    );
  }
  // Stores, admins, etc. can read reviews but never write them.
  if (!isCustomer) return null;

  if (!supabaseReady || loadingData || !reviewed) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking whether you can review this product…
      </div>
    );
  }
  if (deliveredOrders.length === 0) {
    return <p className="text-sm text-slate-500">Only customers who have received this product can review it.</p>;
  }
  const noticeBox = notice && (
    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{notice}</p>
  );
  if (!eligibleOrder) {
    return (
      <div className="space-y-2">
        {noticeBox}
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <CheckCircle className="h-4 w-4" /> You have already reviewed this product.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="space-y-2">
        {noticeBox}
        <button type="button" onClick={() => { setOpen(true); setNotice(''); }} className="btn-primary text-sm gap-2">
          <PenLine className="h-4 w-4" /> Write a Review
        </button>
      </div>
    );
  }

  const trimmed = text.trim();
  const textError = !trimmed ? 'Please write a few words about the product.' : '';
  const canSubmit = rating > 0 && !textError && !submitting;
  // Whitespace-only input is flagged right away, not only after leaving the box.
  const showTextError = (touched || text.length > 0) && !!textError;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await mutations.createReview({ orderId: eligibleOrder.id, productId, rating, reviewText: trimmed });
      setReviewed(prev => new Set(prev).add(reviewKey(eligibleOrder.id, productId)));
      reset();
      toast.success('Thanks! Your review has been posted.');
      onReviewed();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Already on the server: stop offering this order and show the saved review.
        setReviewed(prev => new Set(prev).add(reviewKey(eligibleOrder.id, productId)));
        reset();
        setNotice(reviewErrorMessage(err));
        onReviewed();
      } else {
        setError(reviewErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">Write a Review</h3>

      <div>
        <p className="text-xs font-medium text-slate-600 mb-1.5">Your rating <span className="text-red-500">*</span></p>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              aria-pressed={star <= rating}
              onMouseEnter={() => setHover(star)}
              onClick={() => { setRating(star); setError(''); }}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star className={clsx('h-7 w-7 transition-colors', star <= (hover || rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300 fill-slate-100')} />
            </button>
          ))}
          {rating > 0 && <span className="ml-2 text-sm font-medium text-amber-600">{RATING_LABELS[rating]}</span>}
        </div>
        {touched && rating === 0 && <p className="text-xs text-red-500 mt-1">Please select a rating.</p>}
      </div>

      <div>
        <label htmlFor="review-text" className="block text-xs font-medium text-slate-600 mb-1.5">
          Your review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-text"
          className={clsx('input resize-none bg-white', showTextError && 'border-red-400')}
          rows={4}
          maxLength={MAX_REVIEW_LENGTH}
          placeholder="Write your review here…"
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          onBlur={() => setTouched(true)}
        />
        <div className="flex items-start justify-between gap-3 mt-1">
          <p className="text-xs text-red-500">{showTextError ? textError : ''}</p>
          <p className="text-xs text-slate-400 flex-shrink-0">{text.length} / {MAX_REVIEW_LENGTH}</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={reset} disabled={submitting} className="btn-secondary flex-1 sm:flex-none justify-center">
          Cancel
        </button>
        <button type="submit" disabled={!canSubmit} className="btn-primary flex-1 sm:flex-none justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Review
        </button>
      </div>
    </form>
  );
};
