import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../data/mockData';
import {
  CheckCircle, CreditCard, Smartphone, Wallet, Truck, Loader2,
  MapPin, ChevronDown, ChevronUp, Plus,
} from 'lucide-react';
import { useTracking } from '../../hooks/useTracking';
import { api } from '../../api/client';
import { mutations } from '../../lib/dataService';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { SavedAddress } from '../../types';

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
    const existing = document.querySelector('script[src*="sdk.cashfree.com"]');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
}

type Step = 'address' | 'payment' | 'success';

const PAYMENT_METHODS = [
  { id: 'upi',    label: 'UPI',                  icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card',   label: 'Credit / Debit Card',  icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
  { id: 'cod',    label: 'Cash on Delivery',     icon: Truck,      desc: 'Pay when your order arrives' },
  { id: 'wallet', label: 'AskIndia Wallet',      icon: Wallet,     desc: 'Instant, secure payment' },
] as const;

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir',
  'Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
  'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Local-dev switch: when VITE_SKIP_PAYMENT=true, UPI/Card orders are placed as
// paid without the Cashfree gateway redirect. Off unless explicitly enabled, so
// any environment that doesn't set the var (e.g. production) runs the real flow.
const SKIP_PAYMENT = import.meta.env.VITE_SKIP_PAYMENT === 'true';

// ── Saved-address helpers (localStorage, no DB migration needed) ─────────────
const ADDR_KEY = (uid: string) => `ai_addrs_${uid}`;

function loadAddresses(userId: string): SavedAddress[] {
  try {
    const raw = localStorage.getItem(ADDR_KEY(userId));
    return raw ? (JSON.parse(raw) as SavedAddress[]) : [];
  } catch { return []; }
}

function saveAddress(userId: string, addr: Omit<SavedAddress, 'id'>): void {
  try {
    const prev = loadAddresses(userId).filter(
      a => !(a.line1 === addr.line1 && a.city === addr.city && a.pinCode === addr.pinCode),
    );
    const next: SavedAddress[] = [{ ...addr, id: `addr_${Date.now()}` }, ...prev].slice(0, 5);
    localStorage.setItem(ADDR_KEY(userId), JSON.stringify(next));
  } catch { /* no localStorage */ }
}

// ────────────────────────────────────────────────────────────────────────────

export const CustomerCheckout: React.FC = () => {
  const { cart, clearCart, addOrder, currentUser, stores, markCartRecovered } = useAppStore();
  const navigate = useNavigate();
  const { track } = useTracking();

  const [step, setStep]           = useState<Step>('address');
  const [payMethod, setPayMethod] = useState<'card' | 'upi' | 'wallet' | 'cod'>('upi');
  const [placing, setPlacing]     = useState(false);
  const [placeError, setPlaceError] = useState('');
  const orderIdRef = useRef('');

  // ── Address fields ──────────────────────────────────────────────────────────
  const nameParts = (currentUser?.name ?? '').split(' ');
  const [firstName,  setFirstName]  = useState(nameParts[0] ?? '');
  const [lastName,   setLastName]   = useState(nameParts.slice(1).join(' '));
  const [phone,      setPhone]      = useState(currentUser?.phone ?? '');
  const [line1,      setLine1]      = useState('');
  const [line2,      setLine2]      = useState('');
  const [city,       setCity]       = useState(currentUser?.city  ?? 'Mumbai');
  const [addrState,  setAddrState]  = useState(currentUser?.state ?? 'Maharashtra');
  const [pinCode,    setPinCode]    = useState('');

  // ── Saved addresses ─────────────────────────────────────────────────────────
  const [showSaved,   setShowSaved]   = useState(true);
  const [addingNew,   setAddingNew]   = useState(false);
  const [addrError,   setAddrError]   = useState('');

  const savedAddresses = useMemo(
    () => (currentUser?.id ? loadAddresses(currentUser.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, step],   // re-read when step changes (after order saves address)
  );

  useEffect(() => {
    track('checkout_start', { itemCount: cart.length }, '/shop/checkout');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pricing ─────────────────────────────────────────────────────────────────
  const subtotal       = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shippingCharge = subtotal > 999 ? 0 : 49;
  const discount       = 0;   // coupon feature placeholder
  const gstAmount      = 0;   // GST calculation placeholder
  const total          = subtotal + shippingCharge - discount + gstAmount;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fillFromSaved = (addr: SavedAddress) => {
    setFirstName(addr.firstName);
    setLastName(addr.lastName ?? '');
    setPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 ?? '');
    setCity(addr.city);
    setAddrState(addr.state);
    setPinCode(addr.pinCode);
    setAddingNew(false);
    setAddrError('');
  };

  const validateAddress = (): boolean => {
    if (!line1.trim()) { setAddrError('Address line 1 is required.'); return false; }
    if (!city.trim())  { setAddrError('City is required.');           return false; }
    if (pinCode && !/^\d{6}$/.test(pinCode)) {
      setAddrError('Please enter a valid 6-digit PIN code.');
      return false;
    }
    setAddrError('');
    return true;
  };

  // ── Order placement ─────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPlacing(true);
    setPlaceError('');

    const hasRealSession = isSupabaseConfigured && UUID_RE.test(currentUser?.id ?? '');

    const realStores  = stores.filter(s => UUID_RE.test(s.id));
    const firstProd   = cart[0]?.product;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetStore = firstProd
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (realStores.find(s => s.id === (firstProd as any).storeId) ?? realStores[0] ?? stores[0])
      : (realStores[0] ?? stores[0]);

    const storeId   = targetStore?.id   ?? '';
    const storeName = targetStore?.name ?? 'AskIndia Store';

    const items = cart.map(({ product, quantity }) => ({
      productId:    product.id,
      productName:  product.name,
      productIcon:  product.imageIcon,
      productColor: product.imageColor,
      price:        product.price,
      quantity,
      commission:   product.commission,
    }));

    const commissionTotal = items.reduce(
      (s, i) => s + (i.price * i.quantity * i.commission / 100), 0,
    );
    const adminRevenue = total - commissionTotal;

    // Build a structured address string for the DB (single text column)
    const fullAddress = [line1.trim(), line2.trim()].filter(Boolean).join(', ')
      + (pinCode ? ` – ${pinCode}` : '')
      + (addrState ? `, ${addrState}` : '');

    const orderData: Omit<import('../../types').Order, 'id'> = {
      customerId:      currentUser?.id    ?? 'guest',
      customerName:    `${firstName} ${lastName}`.trim() || (currentUser?.name ?? 'Guest'),
      customerEmail:   currentUser?.email ?? '',
      storeId,
      storeName,
      items,
      subtotal,
      shippingCharge,
      discount,
      gstAmount,
      total,
      commissionTotal,
      adminRevenue,
      status:        'pending',
      paymentMethod: payMethod,
      paymentStatus: 'paid',
      address:       fullAddress || 'Address not provided',
      city:          city.trim() || 'Mumbai',
      createdAt:     new Date().toISOString(),
    };

    const localId = 'ORD' + Date.now().toString(36).toUpperCase();
    orderIdRef.current = localId;

    // For Cashfree-routed methods the payment is initially pending — unless the
    // local-dev bypass is on, in which case the order is placed straight to paid.
    const initialPaymentStatus =
      (!SKIP_PAYMENT && (payMethod === 'upi' || payMethod === 'card')) ? 'pending' : 'paid';

    try {
      if (hasRealSession) {
        try {
          const dbId = await mutations.createOrder({ ...orderData, paymentStatus: initialPaymentStatus });
          orderIdRef.current = dbId;
          addOrder({ ...orderData, paymentStatus: initialPaymentStatus }, dbId);

          // Notify store owner — fire-and-forget
          if (UUID_RE.test(targetStore?.ownerId ?? '')) {
            mutations.createNotification(targetStore!.ownerId, {
              type:    'order',
              title:   'New Order Received',
              message: `Order #${dbId} · ${formatCurrency(total)} from ${orderData.customerName}`,
              link:    '/store/orders',
            }).catch(() => {});
          }

          saveAddress(currentUser!.id, {
            firstName, lastName, phone,
            line1: line1.trim(), line2: line2.trim(),
            city: city.trim(), state: addrState, pinCode,
          });
          mutations.updateProfile(currentUser!.id, {
            city: city.trim(), state: addrState, phone: phone.trim() || undefined,
          }).catch(() => {});

          // Redirect to Cashfree for online payment methods (skipped in dev bypass)
          if (!SKIP_PAYMENT && (payMethod === 'upi' || payMethod === 'card')) {
            const { paymentSessionId } = await api.post<{ paymentSessionId: string; cfOrderId: string }>(
              '/payments/cashfree/order', { orderId: dbId },
            );
            await loadCashfreeSDK();
            const cashfree = window.Cashfree({
              mode: (import.meta.env.VITE_CASHFREE_ENV as string) || 'sandbox',
            });
            // This redirects the page — no further code runs
            cashfree.checkout({ paymentSessionId, redirectTarget: '_self' });
            return; // guard against any accidental fall-through
          }

        } catch (dbErr) {
          console.warn('[Checkout] DB write failed, saving locally:', dbErr);
          addOrder(orderData, localId);
          if (currentUser?.id) {
            saveAddress(currentUser.id, {
              firstName, lastName, phone,
              line1: line1.trim(), line2: line2.trim(),
              city: city.trim(), state: addrState, pinCode,
            });
          }
        }
      } else {
        // Demo / offline mode
        addOrder(orderData);
        if (currentUser?.id) {
          saveAddress(currentUser.id, {
            firstName, lastName, phone,
            line1: line1.trim(), line2: line2.trim(),
            city: city.trim(), state: addrState, pinCode,
          });
        }
      }

      track('checkout_complete', { total, itemCount: cart.length }, '/shop/checkout');
      markCartRecovered(`ac_${currentUser?.id}_latest`);
      setStep('success');
      setTimeout(() => { clearCart(); }, 500);
    } catch (err) {
      console.error('[Checkout] Order failed:', err);
      setPlaceError('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <AppLayout title="Order Confirmed">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-slate-500 mb-2">
            Your order{' '}
            <span className="font-mono font-bold text-brand-600">#{orderIdRef.current}</span>{' '}
            has been confirmed.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Expected delivery in 3–5 business days.
          </p>
          <div className="bg-slate-50 rounded-2xl p-5 mb-8 text-left space-y-2 text-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Order Summary</p>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery</span>
              <span className={shippingCharge === 0 ? 'text-emerald-600 font-medium' : ''}>
                {shippingCharge === 0 ? 'FREE' : formatCurrency(shippingCharge)}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-slate-200">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/shop/orders')} className="btn-secondary">
              Track Order
            </button>
            <button onClick={() => navigate('/shop')} className="btn-primary">
              Continue Shopping
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Step progress indicator ─────────────────────────────────────────────────
  const stepIndex = step === 'address' ? 0 : 1;

  return (
    <AppLayout title="Checkout">
      <div className="max-w-4xl mx-auto grid xl:grid-cols-3 gap-6">

        {/* ── Main form ───────────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            {(['address', 'payment'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${
                  step === s ? 'text-brand-600'
                  : i < stepIndex ? 'text-emerald-600'
                  : 'text-slate-400'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === s ? 'bg-brand-600 text-white'
                    : i < stepIndex ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span className="text-sm font-medium capitalize">{s}</span>
                </div>
                {i < 1 && <div className="flex-1 h-px bg-slate-200" />}
              </React.Fragment>
            ))}
          </div>

          {/* ── Address step ─────────────────────────────────────────────────── */}
          {step === 'address' && (
            <div className="space-y-4">

              {/* Saved addresses panel */}
              {savedAddresses.length > 0 && (
                <div className="card p-5">
                  <button
                    onClick={() => setShowSaved(v => !v)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand-500" />
                      <span className="font-semibold text-slate-900 text-sm">Saved Addresses</span>
                      <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-bold">
                        {savedAddresses.length}
                      </span>
                    </div>
                    {showSaved
                      ? <ChevronUp className="h-4 w-4 text-slate-400" />
                      : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>

                  {showSaved && (
                    <div className="mt-4 space-y-2">
                      {savedAddresses.map(addr => (
                        <div
                          key={addr.id}
                          className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-300 transition-colors"
                        >
                          <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">
                              {addr.firstName}{addr.lastName ? ` ${addr.lastName}` : ''}
                            </p>
                            <p className="text-slate-600 text-xs mt-0.5 truncate">
                              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {addr.city}, {addr.state}{addr.pinCode ? ` – ${addr.pinCode}` : ''}
                            </p>
                            {addr.phone && (
                              <p className="text-slate-400 text-xs mt-0.5">📞 {addr.phone}</p>
                            )}
                          </div>
                          <button
                            onClick={() => fillFromSaved(addr)}
                            className="flex-shrink-0 text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            Use
                          </button>
                        </div>
                      ))}

                      {!addingNew && (
                        <button
                          onClick={() => setAddingNew(true)}
                          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mt-1 py-1"
                        >
                          <Plus className="h-4 w-4" /> Add new address
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Address form */}
              {(savedAddresses.length === 0 || addingNew || !showSaved) && (
                <div className="card p-6 space-y-4">
                  <h3 className="font-semibold text-slate-900">
                    {savedAddresses.length > 0 ? 'New Delivery Address' : 'Delivery Address'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                      <input
                        className="input"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                      <input
                        className="input"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Last name"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Mobile Number
                      </label>
                      <input
                        className="input"
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Address Line 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="input"
                        value={line1}
                        onChange={e => { setLine1(e.target.value); setAddrError(''); }}
                        placeholder="House / Flat / Block no., Building name"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Address Line 2
                      </label>
                      <input
                        className="input"
                        value={line2}
                        onChange={e => setLine2(e.target.value)}
                        placeholder="Street, Area, Landmark (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="input"
                        value={city}
                        onChange={e => { setCity(e.target.value); setAddrError(''); }}
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">PIN Code</label>
                      <input
                        className="input"
                        value={pinCode}
                        onChange={e => { setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setAddrError(''); }}
                        placeholder="400001"
                        maxLength={6}
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                      <select
                        className="input"
                        value={addrState}
                        onChange={e => setAddrState(e.target.value)}
                      >
                        {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {addrError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                      {addrError}
                    </p>
                  )}

                  <button
                    onClick={() => { if (validateAddress()) setStep('payment'); }}
                    className="btn-primary w-full justify-center py-3"
                  >
                    Continue to Payment →
                  </button>
                </div>
              )}

              {/* Show "continue" when saved address is filled but form is hidden */}
              {savedAddresses.length > 0 && !addingNew && showSaved && line1 && (
                <div className="card p-4 flex items-center justify-between bg-emerald-50 border-emerald-200">
                  <div className="text-sm">
                    <p className="font-semibold text-emerald-800">Address selected</p>
                    <p className="text-emerald-600 text-xs">{line1}, {city}</p>
                  </div>
                  <button
                    onClick={() => setStep('payment')}
                    className="btn-primary py-2"
                  >
                    Continue →
                  </button>
                </div>
              )}

              {savedAddresses.length > 0 && !addingNew && showSaved && !line1 && (
                <p className="text-sm text-slate-500 text-center py-2">
                  Select a saved address above or{' '}
                  <button
                    onClick={() => setAddingNew(true)}
                    className="text-brand-600 font-medium hover:underline"
                  >
                    add a new one
                  </button>
                </p>
              )}
            </div>
          )}

          {/* ── Payment step ─────────────────────────────────────────────────── */}
          {step === 'payment' && (
            <div className="card p-6 space-y-4">
              {/* Delivery address summary */}
              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl text-sm">
                <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {firstName}{lastName ? ` ${lastName}` : ''}
                    {phone ? <span className="text-slate-400 font-normal ml-2">· {phone}</span> : ''}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {line1}{line2 ? `, ${line2}` : ''}, {city}{pinCode ? ` – ${pinCode}` : ''}, {addrState}
                  </p>
                </div>
                <button
                  onClick={() => setStep('address')}
                  className="ml-auto text-xs text-brand-600 hover:underline font-medium flex-shrink-0"
                >
                  Change
                </button>
              </div>

              <h3 className="font-semibold text-slate-900">Payment Method</h3>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                  <label
                    key={id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      payMethod === id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={id}
                      checked={payMethod === id}
                      onChange={() => setPayMethod(id as typeof payMethod)}
                      className="text-brand-600"
                    />
                    <div className={`p-2 rounded-lg ${payMethod === id ? 'bg-brand-100' : 'bg-slate-100'}`}>
                      <Icon className={`h-5 w-5 ${payMethod === id ? 'text-brand-600' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {payMethod === 'card' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                  <input className="input" placeholder="Card Number" />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="MM / YY" />
                    <input className="input" placeholder="CVV" />
                  </div>
                  <input className="input" placeholder="Cardholder Name" />
                </div>
              )}

              {payMethod === 'upi' && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <input className="input" placeholder="Enter UPI ID (e.g. name@paytm)" />
                </div>
              )}

              {placeError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {placeError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('address')}
                  disabled={placing}
                  className="btn-secondary flex-1 justify-center"
                >
                  ← Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="btn-primary flex-1 justify-center py-3 gap-2"
                >
                  {placing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order…</>
                    : <>Place Order & Pay {formatCurrency(total)}</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Cart summary sidebar ────────────────────────────────────────────── */}
        <div className="card p-5 h-fit sticky top-24">
          <h3 className="font-semibold text-slate-900 mb-4">Order ({cart.length} item{cart.length !== 1 ? 's' : ''})</h3>

          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${product.imageColor} flex items-center justify-center text-xl flex-shrink-0`}>
                  {product.imageIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{product.name}</p>
                  <p className="text-xs text-slate-400">Qty: {quantity}</p>
                </div>
                <p className="text-sm font-bold flex-shrink-0">{formatCurrency(product.price * quantity)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery</span>
              <span className={shippingCharge === 0 ? 'text-emerald-600 font-medium' : ''}>
                {shippingCharge === 0 ? 'FREE' : formatCurrency(shippingCharge)}
              </span>
            </div>
            {shippingCharge > 0 && (
              <p className="text-xs text-emerald-600">
                Add {formatCurrency(1000 - subtotal)} more for FREE delivery
              </p>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-brand-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
