import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Store, ShoppingCart, BarChart3,
  Wallet, LogOut, CreditCard, Bell, Briefcase, ClipboardList, Home, Users, Palette, UserCircle, Globe,
  Activity, ShieldCheck, TrendingUp, Truck,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { NotificationPanel } from './NotificationPanel';
import { AskIndiaLogo } from '../AskIndiaLogo';
import clsx from 'clsx';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/services', icon: Briefcase, label: 'Services' },
  { to: '/admin/stores', icon: Store, label: 'Stores' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/insights', icon: TrendingUp, label: 'Insights' },
  { to: '/admin/tracking', icon: Activity, label: 'Tracking' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/roles', icon: ShieldCheck, label: 'Roles & Perms' },
  { to: '/admin/payouts', icon: CreditCard, label: 'Payouts' },
  { to: '/admin/agents', icon: Users, label: 'Agents' },
  { to: '/admin/homepage', icon: Globe, label: 'Homepage' },
];

const storeLinks = [
  { to: '/store',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/store/profile',   icon: Store,           label: 'My Store' },
  { to: '/store/products',  icon: Package,         label: 'My Products' },
  { to: '/store/orders',    icon: ClipboardList,   label: 'Orders' },
  { to: '/store/wallet',    icon: Wallet,          label: 'Wallet' },
  { to: '/store/customize', icon: Palette,         label: 'Customize Store' },
];

const providerLinks = [
  { to: '/service-provider', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/service-provider/services', icon: Briefcase, label: 'My Services' },
  { to: '/service-provider/orders', icon: ClipboardList, label: 'Bookings' },
  { to: '/service-provider/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/service-provider/profile', icon: UserCircle, label: 'My Profile' },
];

const customerLinks = [
  { to: '/shop', icon: Home, label: 'Marketplace' },
  { to: '/shop/stores', icon: Store, label: 'All Stores' },
  { to: '/shop/services', icon: Briefcase, label: 'Browse Services' },
  { to: '/shop/cart', icon: ShoppingCart, label: 'My Cart' },
  { to: '/shop/orders', icon: ClipboardList, label: 'My Orders' },
];

const agentLinks = [
  { to: '/agent', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agent/products', icon: Package, label: 'Sell Products' },
  { to: '/agent/services', icon: Briefcase, label: 'Book Services' },
  { to: '/agent/orders', icon: ClipboardList, label: 'My Sales' },
  { to: '/agent/wallet', icon: Wallet, label: 'My Wallet' },
];

const deliveryLinks = [
  { to: '/delivery', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/delivery/orders', icon: Truck, label: 'Delivery Queue' },
  { to: '/delivery/profile', icon: UserCircle, label: 'My Profile' },
];

export const Sidebar: React.FC = () => {
  const { currentUser, logout, notifications, sidebarOpen } = useAppStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  if (!currentUser || !sidebarOpen) return null;

  const links =
    currentUser.role === 'admin' ? adminLinks :
    currentUser.role === 'store_owner' ? storeLinks :
    currentUser.role === 'service_provider' ? providerLinks :
    currentUser.role === 'agent' ? agentLinks :
    currentUser.role === 'delivery_partner' ? deliveryLinks :
    customerLinks;

  const roleLabel =
    currentUser.role === 'admin' ? 'Platform Admin' :
    currentUser.role === 'store_owner' ? 'Store Owner' :
    currentUser.role === 'service_provider' ? 'Service Provider' :
    currentUser.role === 'agent' ? 'Sales Agent' :
    currentUser.role === 'delivery_partner' ? 'Delivery Partner' :
    'Customer';

  const roleColor =
    currentUser.role === 'admin' ? 'bg-amber-500' :
    currentUser.role === 'store_owner' ? 'bg-emerald-500' :
    currentUser.role === 'service_provider' ? 'bg-violet-500' :
    currentUser.role === 'agent' ? 'bg-orange-500' :
    currentUser.role === 'delivery_partner' ? 'bg-indigo-500' :
    'bg-sky-500';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
    <aside className="fixed inset-y-0 left-0 w-60 bg-brand-900 flex flex-col z-30 hidden lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <AskIndiaLogo size={32} showText={true} textClass="text-lg" />
      </div>

      {/* User */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0', roleColor)}>
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-brand-300 text-xs">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/store' || to === '/shop' || to === '/service-provider' || to === '/agent'}
            className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {currentUser.role !== 'customer' && (
          <button className="sidebar-link w-full" onClick={() => setShowNotifications(true)}>
            <Bell className="h-4 w-4 flex-shrink-0" />
            <span>Notifications</span>
            {unread > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {currentUser.city && (
          <p className="text-brand-400 text-xs px-3 mb-2">📍 {currentUser.city}</p>
        )}
        <button onClick={handleLogout} className="sidebar-link w-full">
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>

      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
};
