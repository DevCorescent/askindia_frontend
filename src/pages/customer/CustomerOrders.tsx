import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { statusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import type { Order, ServiceOrder } from '../../types';
import { Package, MapPin, Calendar, Briefcase, ShoppingBag, Clock, CheckCircle, XCircle, Download, Star, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InvoiceModal } from '../../components/InvoiceTemplate';
import { mutations } from '../../lib/dataService';
import clsx from 'clsx';

const TRACKING_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '📋' },
  { key: 'processing', label: 'Processing', icon: '⚙️' },
  { key: 'shipped', label: 'Shipped', icon: '🚚' },
  { key: 'delivered', label: 'Delivered', icon: '✅' },
];

const SERVICE_STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',   dot: 'bg-amber-500' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',       dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', dot: 'bg-violet-500' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-700 ring-1 ring-red-200',         dot: 'bg-red-500' },
};

const ServiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = SERVICE_STATUS_CONFIG[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const SERVICE_TIMELINE: ServiceOrder['status'][] = ['pending', 'confirmed', 'in_progress', 'completed'];

export const CustomerOrders: React.FC = () => {
  const { currentUser, orders, serviceOrders, stores, providerInvoiceSettings } = useAppStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'products' | 'services'>('products');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [invoiceSvcOrder, setInvoiceSvcOrder] = useState<ServiceOrder | null>(null);

  // Review state — a review is per (order, product), so an order with several
  // products can be rated one product at a time.
  const [reviewOrder, setReviewOrder]         = useState<Order | null>(null);
  const [reviewProductId, setReviewProductId] = useState<string>('');
  const [reviewRating, setReviewRating]       = useState(0);
  const [reviewHover, setReviewHover]         = useState(0);
  const [reviewText, setReviewText]           = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError]           = useState('');
  const [reviewedKeys, setReviewedKeys]         = useState<Set<string>>(new Set());

  const reviewKey = (orderId: string, productId: string) => `${orderId}:${productId}`;

  // Hydrate what this customer has already rated, so the state survives a reload.
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    mutations.loadMyReviews()
      .then(reviews => {
        if (cancelled) return;
        setReviewedKeys(new Set(reviews.map(r => reviewKey(r.orderId, r.productId))));
      })
      .catch(() => { /* non-fatal: the Rate button just stays visible */ });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const unratedItems = (order: Order) =>
    order.items.filter(i => !reviewedKeys.has(reviewKey(order.id, i.productId)));

  const openReview = (order: Order) => {
    const pending = unratedItems(order);
    setReviewOrder(order);
    setReviewProductId(pending[0]?.productId ?? '');
    setReviewRating(0);
    setReviewText('');
    setReviewError('');
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder || !reviewProductId || reviewRating === 0) return;
    setSubmittingReview(true);
    setReviewError('');
    try {
      await mutations.createReview({
        orderId:    reviewOrder.id,
        productId:  reviewProductId,
        rating:     reviewRating,
        reviewText: reviewText.trim(),
      });
      setReviewedKeys(prev => new Set(prev).add(reviewKey(reviewOrder.id, reviewProductId)));

      // Multi-product order: roll straight on to the next unrated product.
      const next = reviewOrder.items.find(
        i => i.productId !== reviewProductId &&
             !reviewedKeys.has(reviewKey(reviewOrder.id, i.productId)),
      );
      if (next) {
        setReviewProductId(next.productId);
        setReviewRating(0);
        setReviewText('');
      } else {
        setReviewOrder(null);
      }
    } catch (e) {
      setReviewError((e as Error).message || 'Could not save your review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const myOrders = orders.filter(o => o.customerId === currentUser?.id);
  const myServiceOrders = serviceOrders.filter(o => o.customerId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const trackingStep = (status: Order['status']) =>
    ['pending', 'processing', 'shipped', 'delivered'].indexOf(status);

  return (
    <AppLayout title="My Orders">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Orders</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {myOrders.length} product order{myOrders.length !== 1 ? 's' : ''} · {myServiceOrders.length} service booking{myServiceOrders.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('products')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'products'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            Product Orders
            {myOrders.length > 0 && (
              <span className={clsx(
                'text-xs px-1.5 py-0.5 rounded-full font-bold',
                tab === 'products' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'
              )}>
                {myOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('services')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'services'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Briefcase className="h-4 w-4" />
            Service Bookings
            {myServiceOrders.length > 0 && (
              <span className={clsx(
                'text-xs px-1.5 py-0.5 rounded-full font-bold',
                tab === 'services' ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
              )}>
                {myServiceOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Product Orders Tab ─────────────────────────────────────────── */}
        {tab === 'products' && (
          <>
            {myOrders.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No product orders yet</h3>
                <p className="text-slate-400 text-sm mb-6">Start shopping to see your orders here</p>
                <button onClick={() => navigate('/shop')} className="btn-primary">
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map(order => (
                  <div key={order.id} className="card p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-bold text-brand-600">#{order.id.toUpperCase()}</p>
                          {statusBadge(order.status)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Placed on {formatDate(order.createdAt)} · from {order.storeName}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-slate-900">{formatCurrency(order.total)}</p>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, i) => (
                          <div key={i} className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.productColor} flex items-center justify-center text-2xl border-2 border-white`}>
                            {item.productIcon}
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {order.items[0].productName}{order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}
                        </p>
                        <p className="text-xs text-slate-400">Payment: {order.paymentMethod.toUpperCase()}</p>
                      </div>
                    </div>

                    {order.status !== 'cancelled' && (
                      <div className="flex items-center gap-0 mb-4">
                        {TRACKING_STEPS.map((step, i) => {
                          const current = trackingStep(order.status);
                          const done = i <= current;
                          return (
                            <React.Fragment key={step.key}>
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                                  done ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-300'
                                }`}>
                                  {done ? '✓' : i + 1}
                                </div>
                                <p className={`text-xs mt-1 whitespace-nowrap ${done ? 'text-brand-600 font-medium' : 'text-slate-400'}`}>
                                  {step.label}
                                </p>
                              </div>
                              {i < TRACKING_STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mb-4 ${i < current ? 'bg-brand-600' : 'bg-slate-200'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {order.address}, {order.city}
                      </p>
                      <div className="flex items-center gap-2">
                        {order.status === 'delivered' && (
                          unratedItems(order).length > 0 ? (
                            <button
                              onClick={() => openReview(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
                            >
                              <Star className="h-3.5 w-3.5" />
                              {order.items.length > 1
                                ? `Rate (${unratedItems(order).length} left)`
                                : 'Rate'}
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium px-2">
                              <Star className="h-3 w-3 fill-emerald-500" /> Reviewed
                            </span>
                          )
                        )}
                        {(order.status === 'delivered' || order.paymentStatus === 'paid') && (
                          <button
                            onClick={() => setInvoiceOrder(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Invoice
                          </button>
                        )}
                        <button onClick={() => setSelectedOrder(order)} className="btn-secondary text-xs py-1.5">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Service Bookings Tab ───────────────────────────────────────── */}
        {tab === 'services' && (
          <>
            {myServiceOrders.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-24 h-24 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="h-12 w-12 text-violet-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No service bookings yet</h3>
                <p className="text-slate-400 text-sm mb-6">Browse services and book one to get started</p>
                <button onClick={() => navigate('/shop/services')} className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors">
                  Browse Services
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myServiceOrders.map(order => {
                  const timelineIdx = SERVICE_TIMELINE.indexOf(order.status as ServiceOrder['status']);
                  return (
                    <div key={order.id} className="card p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${order.serviceColor} flex items-center justify-center text-2xl flex-shrink-0`}>
                            {order.serviceIcon}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{order.serviceTitle}</p>
                            <p className="text-xs text-slate-400 mt-0.5">by {order.providerName}</p>
                            <p className="font-mono text-xs text-violet-600 mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-900">{formatCurrency(order.amount)}</p>
                          <ServiceStatusBadge status={order.status} />
                        </div>
                      </div>

                      {/* Booking details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                          <span>{formatDate(order.scheduledDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                          <span>{order.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                          <span>Booked {formatDate(order.createdAt)}</span>
                        </div>
                      </div>

                      {/* Progress timeline */}
                      {order.status !== 'cancelled' && (
                        <div className="flex items-center mb-4">
                          {SERVICE_TIMELINE.map((s, i) => {
                            const done = i <= timelineIdx;
                            const labels = ['Pending', 'Confirmed', 'In Progress', 'Completed'];
                            return (
                              <React.Fragment key={s}>
                                <div className="flex flex-col items-center flex-shrink-0">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition-all ${
                                    done ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-200 text-slate-300'
                                  }`}>
                                    {done ? '✓' : i + 1}
                                  </div>
                                  <p className={`text-[10px] mt-1 whitespace-nowrap ${done ? 'text-violet-600 font-medium' : 'text-slate-400'}`}>
                                    {labels[i]}
                                  </p>
                                </div>
                                {i < SERVICE_TIMELINE.length - 1 && (
                                  <div className={`flex-1 h-0.5 mb-4 ${i < timelineIdx ? 'bg-violet-600' : 'bg-slate-200'}`} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}

                      {order.status === 'cancelled' && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                          <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          This booking was cancelled.
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {order.address}
                        </p>
                        <div className="flex items-center gap-2">
                          {order.status === 'completed' && (
                            <button
                              onClick={() => setInvoiceSvcOrder(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Invoice
                            </button>
                          )}
                          <button onClick={() => setSelectedServiceOrder(order)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-600 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details" size="lg">
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-brand-600 font-bold">#{selectedOrder.id.toUpperCase()}</p>
              <div className="flex items-center gap-2">
                {statusBadge(selectedOrder.status)}
                {(selectedOrder.status === 'delivered' || selectedOrder.paymentStatus === 'paid') && (
                  <button
                    onClick={() => { setSelectedOrder(null); setInvoiceOrder(selectedOrder); }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="h-3 w-3" /> Invoice
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Delivery Address</p>
                <p className="font-medium text-sm">{selectedOrder.address}, {selectedOrder.city}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Store</p>
                <p className="font-medium text-sm">{selectedOrder.storeName}</p>
                <p className="text-xs text-slate-400">Payment: {selectedOrder.paymentMethod.toUpperCase()}</p>
              </div>
            </div>
            <div className="space-y-2">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.productColor} flex items-center justify-center text-xl`}>
                      {item.productIcon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {(selectedOrder.discount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span><span>–{formatCurrency(selectedOrder.discount!)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span className={(selectedOrder.shippingCharge ?? 0) === 0 ? 'text-emerald-600 font-medium' : ''}>
                  {(selectedOrder.shippingCharge ?? 0) === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingCharge!)}
                </span>
              </div>
              {(selectedOrder.gstAmount ?? 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST</span><span>{formatCurrency(selectedOrder.gstAmount!)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-slate-200 pt-2">
                <span>Total</span><span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal — one product at a time */}
      {reviewOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Rate Your Purchase</h3>
            <p className="text-sm text-slate-500 mb-4">
              Order #{reviewOrder.id.toUpperCase()} · {reviewOrder.storeName}
            </p>

            {/* Product picker — only when the order has more than one product */}
            {reviewOrder.items.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {reviewOrder.items.map(item => {
                  const done = reviewedKeys.has(reviewKey(reviewOrder.id, item.productId));
                  const active = item.productId === reviewProductId;
                  return (
                    <button
                      key={item.productId}
                      onClick={() => {
                        if (done) return;
                        setReviewProductId(item.productId);
                        setReviewRating(0);
                        setReviewText('');
                        setReviewError('');
                      }}
                      disabled={done}
                      title={item.productName}
                      className={clsx(
                        'relative w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl border-2 transition-all bg-gradient-to-br',
                        item.productColor,
                        active ? 'border-brand-500' : 'border-transparent',
                        done && 'opacity-40 cursor-not-allowed',
                      )}
                    >
                      {item.productIcon}
                      {done && (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                          <CheckCircle className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-sm font-medium text-slate-800 text-center mb-3 truncate">
              {reviewOrder.items.find(i => i.productId === reviewProductId)?.productName}
            </p>

            {/* Stars */}
            <div className="flex gap-2 justify-center mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setReviewHover(star)}
                  onMouseLeave={() => setReviewHover(0)}
                  onClick={() => setReviewRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`h-9 w-9 transition-colors ${
                    star <= (reviewHover || reviewRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200 fill-slate-200'
                  }`} />
                </button>
              ))}
            </div>
            {reviewRating > 0 && (
              <p className="text-center text-sm font-medium text-amber-600 mb-3">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
              </p>
            )}
            <textarea
              className="input resize-none mb-2"
              rows={3}
              placeholder="Tell us about your experience (optional)…"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
            />
            {reviewError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                {reviewError}
              </p>
            )}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setReviewOrder(null)} className="btn-secondary flex-1 justify-center">
                {unratedItems(reviewOrder).length < reviewOrder.items.length ? 'Done' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || submittingReview}
                className="btn-primary flex-1 justify-center gap-2"
              >
                {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modals */}
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          invoiceSettings={stores.find(s => s.id === invoiceOrder.storeId)?.invoiceSettings}
          type="product"
          onClose={() => setInvoiceOrder(null)}
        />
      )}
      {invoiceSvcOrder && (
        <InvoiceModal
          order={invoiceSvcOrder}
          invoiceSettings={providerInvoiceSettings[invoiceSvcOrder.providerId]}
          type="service"
          onClose={() => setInvoiceSvcOrder(null)}
        />
      )}

      {/* Service Order Detail Modal */}
      <Modal isOpen={!!selectedServiceOrder} onClose={() => setSelectedServiceOrder(null)} title="Booking Details" size="lg">
        {selectedServiceOrder && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Booking ID</p>
                <p className="font-mono text-violet-600 font-bold">#{selectedServiceOrder.id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2">
                <ServiceStatusBadge status={selectedServiceOrder.status} />
                {selectedServiceOrder.status === 'completed' && (
                  <button
                    onClick={() => { setSelectedServiceOrder(null); setInvoiceSvcOrder(selectedServiceOrder); }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="h-3 w-3" /> Invoice
                  </button>
                )}
              </div>
            </div>

            {/* Service info */}
            <div className="flex items-center gap-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedServiceOrder.serviceColor} flex items-center justify-center text-3xl flex-shrink-0`}>
                {selectedServiceOrder.serviceIcon}
              </div>
              <div>
                <p className="font-bold text-slate-900">{selectedServiceOrder.serviceTitle}</p>
                <p className="text-sm text-slate-500">Provided by {selectedServiceOrder.providerName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Scheduled Date</p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  {formatDate(selectedServiceOrder.scheduledDate)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Location</p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  <MapPin className="h-4 w-4 text-violet-500" />
                  {selectedServiceOrder.city}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedServiceOrder.address}</p>
              </div>
            </div>

            {selectedServiceOrder.notes && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Your Notes</p>
                <p className="text-sm text-slate-700">{selectedServiceOrder.notes}</p>
              </div>
            )}

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-violet-500 uppercase">Booking Amount</p>
                <p className="text-2xl font-bold text-violet-700 mt-0.5">{formatCurrency(selectedServiceOrder.amount)}</p>
              </div>
              {selectedServiceOrder.status === 'completed' && (
                <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" /> Completed
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};
