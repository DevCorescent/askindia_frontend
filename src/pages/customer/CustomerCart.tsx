import React, { useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import { ProductImage } from '../../components/ui/ProductImage';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../data/mockData';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useTracking } from '../../hooks/useTracking';

export const CustomerCart: React.FC = () => {
  const { cart, updateCartQty, removeFromCart, snapshotAbandonedCart } = useAppStore();
  const navigate = useNavigate();
  const { track } = useTracking();

  // Track page view + snapshot abandoned cart on unmount (if not checked out)
  useEffect(() => {
    track('page_view', {}, '/shop/cart');
    return () => {
      // Snapshot if user leaves cart without checking out
      snapshotAbandonedCart();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <AppLayout title="My Cart">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-12 w-12 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Browse products and add them to your cart</p>
          <button onClick={() => navigate('/shop')} className="btn-primary">
            <ShoppingBag className="h-4 w-4" /> Start Shopping
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Cart">
      <div className="grid xl:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Cart ({cart.length} items)</h2>
            <button onClick={() => navigate('/shop')} className="text-brand-600 text-sm font-medium hover:text-brand-700">
              + Add more items
            </button>
          </div>

          {cart.map(({ product, quantity }) => (
            <div key={product.id} className="card p-4 flex items-center gap-4">
              <ProductImage product={product} fit="contain" className="w-20 h-20 rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{product.category}</p>
                <p className="font-semibold text-slate-900 text-sm mt-0.5 leading-tight">{product.name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-bold text-slate-900">{formatCurrency(product.price)}</span>
                  <span className="text-xs text-slate-400 line-through">{formatCurrency(product.mrp)}</span>
                </div>
                <p className="text-xs text-emerald-600 mt-0.5">Free delivery on this item</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button onClick={() => removeFromCart(product.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button onClick={() => updateCartQty(product.id, quantity - 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-semibold text-slate-900 border-x border-slate-200 min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button onClick={() => updateCartQty(product.id, quantity + 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="font-bold text-slate-900">{formatCurrency(product.price * quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-24">
            <h3 className="font-semibold text-slate-900 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-slate-600">
                  <span className="truncate mr-2">{product.name} × {quantity}</span>
                  <span className="font-medium flex-shrink-0">{formatCurrency(product.price * quantity)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className={shipping === 0 ? 'text-emerald-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                  </span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1">
                    You saved ₹49 on delivery!
                  </p>
                )}
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-brand-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <button onClick={() => navigate('/shop/checkout')} className="btn-primary w-full justify-center py-3 mt-5">
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <span>🔒</span>
              <span>Secure checkout with SSL encryption</span>
            </div>
          </div>

          {/* Offers */}
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-900 mb-2">Apply Coupon</p>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="Enter coupon code" />
              <button className="btn-secondary text-sm px-3">Apply</button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Try: SAVE10 for 10% off</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
