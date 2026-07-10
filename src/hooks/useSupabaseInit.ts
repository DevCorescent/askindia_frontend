import { useEffect } from 'react';
import { authService, dataLoaders } from '../lib/dataService';
import { useAppStore } from '../store/useAppStore';
import { getAccessToken } from '../api/client';

export function useSupabaseInit(): void {
  useEffect(() => {
    async function init() {
      const token = getAccessToken();

      if (!token) {
        // Guest — prefetch public catalogue so the homepage has real data
        Promise.allSettled([
          dataLoaders.loadProducts('customer'),
          dataLoaders.loadServices('customer'),
          dataLoaders.loadStores(),
          dataLoaders.loadHomepageConfig(),
        ]).then(([productsRes, servicesRes, storesRes, homepageRes]) => {
          if (useAppStore.getState().currentUser) return;
          const patch: Record<string, unknown> = {};
          if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value) && productsRes.value.length > 0)
            patch.products = productsRes.value;
          if (servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) && servicesRes.value.length > 0)
            patch.services = servicesRes.value;
          if (storesRes.status === 'fulfilled' && Array.isArray(storesRes.value) && storesRes.value.length > 0)
            patch.stores = storesRes.value;
          if (homepageRes.status === 'fulfilled' && homepageRes.value)
            patch.homepageConfig = homepageRes.value;
          if (Object.keys(patch).length > 0)
            useAppStore.setState(patch as Parameters<typeof useAppStore.setState>[0]);
        }).catch(() => {}).finally(() => {
          useAppStore.setState({ supabaseReady: true });
        });
        return;
      }

      // Authenticated — restore session from stored access token
      try {
        const user = await authService.getSession();
        const { setCurrentUser, loadFromSupabase } = useAppStore.getState();

        if (user) {
          setCurrentUser(user);
          await loadFromSupabase(user.id, user.role, user.storeId ?? null);
        } else {
          // Backend may be sleeping (cold start). If we have a persisted user, still
          // attempt to load data — loadFromSupabase is safe to call with stale credentials.
          const cachedUser = useAppStore.getState().currentUser;
          if (cachedUser) {
            await loadFromSupabase(cachedUser.id, cachedUser.role, cachedUser.storeId ?? null);
          } else {
            useAppStore.setState({ supabaseReady: true });
          }
        }
      } catch {
        // Network error — try with cached user so stores still populate after backend wakes
        const cachedUser = useAppStore.getState().currentUser;
        if (cachedUser) {
          const { loadFromSupabase } = useAppStore.getState();
          await loadFromSupabase(cachedUser.id, cachedUser.role, cachedUser.storeId ?? null);
        } else {
          useAppStore.setState({ supabaseReady: true });
        }
      }
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
