import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

const POLL_INTERVAL_MS = 30_000;

export function useRealtimeOrders(): void {
  const currentUser   = useAppStore(s => s.currentUser);
  const refreshOrders = useAppStore(s => s.refreshOrders);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    // Customers see their orders immediately via addOrder() — polling not needed
    if (currentUser.role === 'customer') return;

    timerRef.current = setInterval(() => { refreshOrders(); }, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentUser?.id, currentUser?.role, refreshOrders]);
}
