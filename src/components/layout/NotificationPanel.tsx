import React from 'react';
import {
  Bell, X, CheckCheck, ShoppingBag, IndianRupee, CreditCard,
  Store, Settings, Briefcase, Trash2, Circle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import clsx from 'clsx';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order:      { icon: ShoppingBag,   color: 'text-blue-600',    bg: 'bg-blue-50' },
  commission: { icon: IndianRupee,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  payout:     { icon: CreditCard,    color: 'text-violet-600',  bg: 'bg-violet-50' },
  store:      { icon: Store,         color: 'text-orange-600',  bg: 'bg-orange-50' },
  system:     { icon: Settings,      color: 'text-slate-600',   bg: 'bg-slate-100' },
  service:    { icon: Briefcase,     color: 'text-cyan-600',    bg: 'bg-cyan-50' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

interface Props {
  onClose: () => void;
}

export const NotificationPanel: React.FC<Props> = ({ onClose }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useAppStore();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
              <Bell className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Notifications</h2>
              {unread > 0 && (
                <p className="text-xs text-slate-400">{unread} unread</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold hover:text-brand-700 px-2.5 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                All read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="flex items-center gap-1.5 text-xs text-slate-500 font-medium hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-600 mb-1">All caught up!</p>
              <p className="text-sm text-slate-400">
                You'll see order updates, commission alerts, and other important notifications here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    className={clsx(
                      'w-full flex items-start gap-3.5 px-5 py-4 text-left hover:bg-slate-50 transition-colors',
                      !notif.read && 'bg-brand-50/40'
                    )}
                  >
                    <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                      <Icon className={clsx('h-4 w-4', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={clsx('text-sm font-semibold truncate', notif.read ? 'text-slate-600' : 'text-slate-900')}>
                          {notif.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {relativeTime(notif.createdAt)}
                          </span>
                          {!notif.read && (
                            <Circle className="h-2 w-2 fill-brand-500 text-brand-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400 text-center">
              Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </>
  );
};
