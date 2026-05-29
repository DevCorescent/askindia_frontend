import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Store, ShoppingCart, Wallet,
  Home, Briefcase, ShoppingBag, ClipboardList, User, CreditCard, Palette,
} from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';
import clsx from 'clsx';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products', end: false },
  { to: '/admin/stores', icon: Store, label: 'Stores', end: false },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders', end: false },
  { to: '/admin/payouts', icon: CreditCard, label: 'Payouts', end: false },
];

const storeNav = [
  { to: '/store', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/store/profile', icon: Store, label: 'Store', end: false },
  { to: '/store/customize', icon: Palette, label: 'Customize', end: false },
  { to: '/store/orders', icon: ClipboardList, label: 'Orders', end: false },
  { to: '/store/wallet', icon: Wallet, label: 'Wallet', end: false },
];

const providerNav = [
  { to: '/service-provider', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/service-provider/services', icon: Briefcase, label: 'Services', end: false },
  { to: '/service-provider/orders', icon: ClipboardList, label: 'Bookings', end: false },
  { to: '/service-provider/wallet', icon: Wallet, label: 'Wallet', end: false },
];

const customerNav = [
  { to: '/shop', icon: Home, label: 'Home', end: true },
  { to: '/shop/stores', icon: Store, label: 'Stores', end: false },
  { to: '/shop/cart', icon: ShoppingBag, label: 'Cart', end: false },
  { to: '/shop/orders', icon: ClipboardList, label: 'Orders', end: false },
  { to: '/shop/account', icon: User, label: 'Account', end: false },
];

const agentNav = [
  { to: '/agent', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/agent/products', icon: Package, label: 'Sell', end: false },
  { to: '/agent/services', icon: Briefcase, label: 'Services', end: false },
  { to: '/agent/orders', icon: ClipboardList, label: 'Sales', end: false },
  { to: '/agent/wallet', icon: Wallet, label: 'Wallet', end: false },
];

export const BottomNav: React.FC = () => {
  const { currentUser, cart } = useAppStore();
  if (!currentUser) return null;

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const links =
    currentUser.role === 'admin' ? adminNav :
    currentUser.role === 'store_owner' ? storeNav :
    currentUser.role === 'service_provider' ? providerNav :
    currentUser.role === 'agent' ? agentNav :
    customerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch h-16">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative',
                isActive ? 'text-accent-500' : 'text-slate-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-500 rounded-b-full" />
                )}
                <div className="relative">
                  <Icon className={clsx('h-5 w-5', isActive && 'scale-110 transition-transform')} />
                  {to.includes('cart') && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-accent-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>
                <span className={clsx('text-[10px] font-medium leading-none', isActive ? 'text-accent-500' : 'text-slate-400')}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
