import { api, setTokens, clearTokens, getAccessToken } from '../api/client';
import type {
  User, Product, Service, Store, Order, ServiceOrder, Agent,
  WithdrawalRequest, Notification, HomepageConfig, UserActivity,
  Role, AbandonedCart, InvoiceSettings, Review, ProductReviews,
} from '../types';

function getRefreshToken(): string | null {
  try { return localStorage.getItem('ai_refresh'); } catch { return null; }
}

// ════════════════════════════════════════════════════════════════════════════
//  AUTH SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const authService = {

  async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/signin',
        { email, password },
      );
      setTokens(data.accessToken, data.refreshToken);
      return { success: true, user: data.user };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  async signUp(opts: {
    email: string;
    password: string;
    name: string;
    role: User['role'];
    phone?: string;
    city?: string;
    state?: string;
  }): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const data = await api.post<{ userId: string }>('/auth/signup', opts);
      return { success: true, userId: data.userId };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  async signOut(): Promise<void> {
    const rt = getRefreshToken();
    try { await api.post('/auth/signout', { refreshToken: rt ?? undefined }); } catch { /* best-effort */ }
    clearTokens();
  },

  async getSession(): Promise<User | null> {
    if (!getAccessToken()) return null;
    try { return await api.get<User>('/auth/me'); }
    catch { return null; }
  },
};

// ════════════════════════════════════════════════════════════════════════════
//  DATA LOADERS  — called after login to populate Zustand
// ════════════════════════════════════════════════════════════════════════════

export const dataLoaders = {

  async loadHomepageConfig(): Promise<HomepageConfig | null> {
    try { return await api.get<HomepageConfig>('/homepage'); }
    catch { return null; }
  },

  async loadProducts(role: User['role'], storeId?: string): Promise<Product[]> {
    const authed = !!getAccessToken();
    if (!authed || role === 'customer') {
      return api.get<Product[]>('/products/public');
    }
    const qs = storeId ? `?storeId=${storeId}` : '';
    return api.get<Product[]>(`/products${qs}`);
  },

  async loadServices(role: User['role'], providerId?: string): Promise<Service[]> {
    const authed = !!getAccessToken();
    if (!authed || role === 'customer') {
      return api.get<Service[]>('/services/public');
    }
    const qs = providerId ? `?providerId=${providerId}` : '';
    return api.get<Service[]>(`/services${qs}`);
  },

  async loadStores(): Promise<Store[]> {
    const authed = !!getAccessToken();
    if (!authed) return api.get<Store[]>('/stores/public');
    return api.get<Store[]>('/stores');
  },

  async loadOrders(_role: User['role'], _userId?: string, _storeId?: string): Promise<Order[]> {
    return api.get<Order[]>('/orders');
  },

  async loadServiceOrders(_role: User['role'], _userId?: string): Promise<ServiceOrder[]> {
    return api.get<ServiceOrder[]>('/service-orders');
  },

  async loadNotifications(_userId: string): Promise<Notification[]> {
    return api.get<Notification[]>('/notifications/me');
  },

  async loadAgents(): Promise<Agent[]> {
    return api.get<Agent[]>('/agents');
  },

  async loadWithdrawalRequests(entityId?: string): Promise<WithdrawalRequest[]> {
    const qs = entityId ? `?entityId=${entityId}` : '';
    return api.get<WithdrawalRequest[]>(`/withdrawals${qs}`);
  },

  async loadUserActivities(): Promise<UserActivity[]> {
    return [];
  },

  async loadAbandonedCarts(): Promise<AbandonedCart[]> {
    return [];
  },

  async loadCustomRoles(): Promise<Role[]> {
    return [];
  },

  async loadProviderInvoiceSettings(storeId: string): Promise<InvoiceSettings | null> {
    try {
      const store = await api.get<Store>(`/stores/${storeId}`);
      return (store?.invoiceSettings ?? null) as InvoiceSettings | null;
    } catch {
      return null;
    }
  },
};

// ════════════════════════════════════════════════════════════════════════════
//  MUTATIONS  — write operations, called from Zustand after local state update
// ════════════════════════════════════════════════════════════════════════════

export const mutations = {

  // ── Products ───────────────────────────────────────────────────────────────

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'sold'> & { storeId?: string }): Promise<string> {
    const result = await api.post<{ id: string }>('/products', data);
    return result.id;
  },

  async updateProduct(id: string, patch: Partial<Product>): Promise<void> {
    await api.patch(`/products/${id}`, patch);
  },

  async deleteProduct(id: string): Promise<void> {
    await api.del(`/products/${id}`);
  },

  // ── Reviews ────────────────────────────────────────────────────────────────

  async createReview(payload: {
    orderId: string; productId: string; rating: number; reviewText?: string;
  }): Promise<void> {
    await api.post('/reviews', payload);
  },

  async loadProductReviews(productId: string): Promise<ProductReviews> {
    return api.get(`/reviews/product/${productId}`);
  },

  /** Every review the signed-in customer has left — used to mark orders as rated. */
  async loadMyReviews(): Promise<Review[]> {
    return api.get('/reviews/mine');
  },

  // ── Stores ─────────────────────────────────────────────────────────────────

  async createStore(data: Omit<Store, 'id' | 'createdAt' | 'totalSales' | 'totalOrders' | 'walletBalance'>): Promise<string> {
    const result = await api.post<{ id: string }>('/stores', data);
    const storeId = result.id;
    // Link the new store back to the owner's profile
    await api.patch('/auth/me', { storeId });
    return storeId;
  },

  async updateStore(id: string, patch: Partial<Store>): Promise<void> {
    await api.patch(`/stores/${id}`, patch);
  },

  // ── Services ───────────────────────────────────────────────────────────────

  async createService(data: Omit<Service, 'id' | 'createdAt' | 'rating' | 'reviewCount'>): Promise<string> {
    const result = await api.post<{ id: string }>('/services', data);
    return result.id;
  },

  async updateService(id: string, patch: Partial<Service>): Promise<void> {
    await api.patch(`/services/${id}`, patch);
  },

  async deleteService(id: string): Promise<void> {
    await api.del(`/services/${id}`);
  },

  // ── Orders ─────────────────────────────────────────────────────────────────

  async createOrder(data: Omit<Order, 'id'>): Promise<string> {
    const result = await api.post<{ id: string }>('/orders', data);
    return result.id;
  },

  async updateOrder(id: string, patch: Partial<Order>): Promise<void> {
    await api.patch(`/orders/${id}`, patch);
  },

  // ── Service Orders ──────────────────────────────────────────────────────────

  async createServiceOrder(data: Omit<ServiceOrder, 'id'>): Promise<string> {
    const result = await api.post<{ id: string }>('/service-orders', data);
    return result.id;
  },

  async updateServiceOrder(id: string, patch: Partial<ServiceOrder>): Promise<void> {
    await api.patch(`/service-orders/${id}`, patch);
  },

  // ── Notifications ───────────────────────────────────────────────────────────

  async createNotification(userId: string, notif: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    await api.post('/notifications', { userId, ...notif });
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`, {});
  },

  async markAllNotificationsRead(_userId: string): Promise<void> {
    await api.patch('/notifications/me/read-all', {});
  },

  async deleteNotification(id: string): Promise<void> {
    await api.del(`/notifications/${id}`);
  },

  // ── Homepage Config ─────────────────────────────────────────────────────────

  async updateHomepageConfig(patch: Partial<HomepageConfig>): Promise<void> {
    await api.patch('/homepage', patch);
  },

  // ── Withdrawal Requests ─────────────────────────────────────────────────────

  async createWithdrawalRequest(data: Omit<WithdrawalRequest, 'id'>): Promise<string> {
    const result = await api.post<{ id: string }>('/withdrawals', data);
    return result.id;
  },

  async updateWithdrawalRequest(id: string, patch: Partial<WithdrawalRequest>): Promise<void> {
    await api.patch(`/withdrawals/${id}`, patch);
  },

  // ── Agents ──────────────────────────────────────────────────────────────────

  async createAgent(agentId: string, data: { agentCode: string; commissionRate: number; status: Agent['status'] }): Promise<void> {
    await api.post('/agents', { id: agentId, ...data });
  },

  async updateAgent(id: string, patch: Partial<Agent>): Promise<void> {
    await api.patch(`/agents/${id}`, patch);
  },

  // ── Wallets ──────────────────────────────────────────────────────────────────

  async creditWallet(userId: string, amount: number, description: string, referenceId?: string): Promise<void> {
    await api.post('/wallets/credit', { userId, amount, description, referenceId: referenceId ?? null });
  },

  // ── User Activities ──────────────────────────────────────────────────────────

  async trackActivity(_data: Omit<UserActivity, 'id' | 'createdAt'>): Promise<void> {
    // Activity tracking not yet implemented in backend
  },

  // ── Wallet ensure ─────────────────────────────────────────────────────────────

  async ensureWallet(userId: string): Promise<void> {
    try { await api.post('/wallets/ensure', { userId }); } catch { /* ignore */ }
  },

  // ── Profile ──────────────────────────────────────────────────────────────────

  async updateProfile(_userId: string, patch: Partial<User>): Promise<void> {
    await api.patch('/auth/me', patch);
  },

  // ── Store invoice settings ───────────────────────────────────────────────────

  async updateStoreInvoiceSettings(storeId: string, settings: Record<string, unknown>): Promise<void> {
    await api.patch(`/stores/${storeId}`, { invoiceSettings: settings });
  },
};
