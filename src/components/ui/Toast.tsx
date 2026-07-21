import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; type: ToastType; message: string; }

// ── Tiny module-level pub/sub so `toast()` can be called from anywhere ─────────
let counter = 0;
const listeners = new Set<(t: ToastItem) => void>();

function emit(type: ToastType, message: string) {
  const item: ToastItem = { id: ++counter, type, message };
  listeners.forEach(l => l(item));
}

export const toast = {
  success: (message: string) => emit('success', message),
  error:   (message: string) => emit('error', message),
  info:    (message: string) => emit('info', message),
};

const STYLES: Record<ToastType, { icon: React.ElementType; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle, ring: 'border-emerald-200', iconColor: 'text-emerald-600' },
  error:   { icon: XCircle,     ring: 'border-red-200',     iconColor: 'text-red-600' },
  info:    { icon: Info,        ring: 'border-brand-200',   iconColor: 'text-brand-600' },
};

const DURATION = 2600;

/** Mount once near the app root. Renders stacked, auto-dismissing toasts. */
export const ToastHost: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (t: ToastItem) => {
      setItems(prev => [...prev, t]);
      window.setTimeout(() => {
        setItems(prev => prev.filter(x => x.id !== t.id));
      }, DURATION);
    };
    listeners.add(onToast);
    return () => { listeners.delete(onToast); };
  }, []);

  const dismiss = (id: number) => setItems(prev => prev.filter(x => x.id !== id));

  return (
    <div className="fixed z-[100] bottom-20 lg:bottom-6 right-4 flex flex-col gap-2 pointer-events-none">
      {items.map(item => {
        const { icon: Icon, ring, iconColor } = STYLES[item.type];
        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-center gap-3 bg-white border ${ring} shadow-lg rounded-xl pl-3 pr-2 py-2.5 min-w-[240px] max-w-sm animate-[toastIn_0.2s_ease-out]`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
            <p className="text-sm font-medium text-slate-800 flex-1">{item.message}</p>
            <button onClick={() => dismiss(item.id)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
