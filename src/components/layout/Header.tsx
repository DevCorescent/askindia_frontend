import React, { useState } from 'react';
import { Bell, Menu, X, ShoppingBag, MapPin, Layers } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  const { currentUser, notifications, cart, toggleSidebar, sidebarOpen } = useAppStore();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = notifications.filter(n => !n.read).length;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors hidden lg:flex"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-base">AskIndia</span>
        </div>
        <h1 className="text-base sm:text-lg font-semibold text-slate-900 hidden lg:block truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Location for customers */}
        {currentUser?.role === 'customer' && currentUser.city && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <MapPin className="h-3.5 w-3.5 text-brand-500" />
            <span className="font-medium">{currentUser.city}</span>
          </div>
        )}

        {/* Cart for customers */}
        {currentUser?.role === 'customer' && (
          <button
            onClick={() => navigate('/shop/cart')}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        )}

        {/* Notifications for non-customers */}
        {currentUser?.role !== 'customer' && (
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2" />
              )}
            </button>

            {showNotifs && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
                <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="font-semibold text-slate-900 text-sm">Notifications</p>
                    {unread > 0 && <span className="text-xs text-brand-600 font-medium">{unread} unread</span>}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 && (
                      <p className="text-center text-slate-400 text-sm py-8">No notifications yet</p>
                    )}
                    {notifications.slice(0, 5).map(n => (
                      <div key={n.id} className={clsx('px-4 py-3', !n.read && 'bg-brand-50')}>
                        <p className={clsx('text-sm font-medium', n.read ? 'text-slate-700' : 'text-slate-900')}>{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-1">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-semibold">
            {currentUser?.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight truncate max-w-[120px]">{currentUser?.name}</p>
            <p className="text-xs text-slate-400 truncate max-w-[120px]">{currentUser?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
