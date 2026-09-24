import { api, setTokens, clearTokens, getAccessToken } from '../api/client';
import type {
  User, Product, Service, Store, Order, ServiceOrder, Agent,
  WithdrawalRequest, Notification, HomepageConfig, UserActivity,
  Role, AbandonedCart, InvoiceSettings, Review, ProductReviews, OrderStatusEvent,
} from '../types';

/** Credentials an admin assigns to a store / service store. */
export interface StoreLoginInput {
  name: string;
  email: string;
  username: string;
  password: string;
}

function getRefreshToken(): string | null {
  try { return localStorage.getItem('ai_refresh'); } catch { return null; }
}

// ════════════════════════════════════════════════════════════════════════════
//  AUTH SERVICE
// ════════════════════════════════════════════════════════════════════════════

export const authService = {

  /** `email` may also be a store account's User ID. */
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
    dateOfBirth?: string;
    gender?: string;
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    pinCode?: string;
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

  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; emailSent?: boolean; devResetLink?: string; error?: string }> {
    try {
      const data = await api.post<{ message: string; emailSent: boolean; devResetLink?: string }>('/auth/forgot-password', { email });
      return { success: true, message: data.message, emailSent: data.emailSent, devResetLink: data.devResetLink };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const data = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword });
      return { success: true, message: data.message };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  // ── Email-OTP recovery (final stage — the backend flag decides) ────────────

  /** Which recovery flows the backend has enabled; OTP is off until final stage. */
  async recoveryOptions(): Promise<{ otpEnabled: boolean }> {
    try { return await api.get<{ otpEnabled: boolean }>('/auth/recovery-options'); }
    catch { return { otpEnabled: false }; }
  },

  async requestPasswordOtp(identifier: string): Promise<{ success: boolean; message?: string; devOtp?: string; error?: string }> {
    try {
      const data = await api.post<{ message: string; devOtp?: string }>('/auth/forgot-password/otp', { identifier });
      return { success: true, message: data.message, devOtp: data.devOtp };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  /** Exchanges a valid code for a reset token used with /reset-password. */
  async verifyPasswordOtp(identifier: string, otp: string): Promise<{ success: boolean; resetToken?: string; error?: string }> {
    try {
      const data = await api.post<{ resetToken: string }>('/auth/forgot-password/verify-otp', { identifier, otp });
      return { success: true, resetToken: data.resetToken };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  async forgotUsername(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const data = await api.post<{ message: string }>('/auth/forgot-username', { email });
      return { success: true, message: data.message };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
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

  async loadAgents(role?: string, userId?: string): Promise<Agent[]> {
    if (role === 'agent' && userId) {
      try {
        const agent = await api.get<Agent>(`/agents/${userId}`);
        return [agent];
      } catch {
        return [];
      }
    }
    return api.get<Agent[]>('/agents');
  },

  async loadWithdrawalRequests(entityId?: string): Promise<WithdrawalRequest[]> {
    const qs = entityId ? `?entityId=${entityId}` : '';
    return api.get<WithdrawalRequest[]>(`/withdrawals${qs}`);
  },

  async loadUserActivities(): Promise<UserActivity[]> {
    try { return await api.get<UserActivity[]>('/analytics/activities'); }
    catch { return []; }
  },

  async loadAbandonedCarts(): Promise<AbandonedCart[]> {
    try { return await api.get<AbandonedCart[]>('/analytics/abandoned-carts'); }
    catch { return []; }
  },

  async loadCustomRoles(): Promise<Role[]> {
    return [];
  },

  /** Admin: every real user profile from the backend. */
  async loadAllUsers(): Promise<User[]> {
    return api.get<User[]>('/admin/users');
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

  // ── Admin: users ─────────────────────────────────────────────────────────
  async adminUpdateUser(id: string, patch: { name?: string; role?: string; city?: string; state?: string; is_active?: boolean }): Promise<void> {
    await api.patch(`/admin/users/${id}`, patch);
  },

  async adminDeleteUser(id: string): Promise<void> {
    await api.del(`/admin/users/${id}`);
  },

  /** Admin: set a new password for an existing user (Bug 4). */
  async adminResetUserPassword(id: string, newPassword: string): Promise<void> {
    await api.post(`/admin/users/${id}/reset-password`, { newPassword });
  },

  /** Update the signed-in user's own profile; returns the fresh profile. */
  async updateMyProfile(patch: { name?: string; phone?: string; city?: string; state?: string; avatar?: string }): Promise<User> {
    return api.patch<User>('/auth/me', patch);
  },

  async deleteProduct(id: string): Promise<void> {
    await api.del(`/products/${id}`);
  },

  // ── Reviews ────────────────────────────────────────────────────────────────

  /** Review a delivered product (productId) or a completed service booking (serviceId). */
  async createReview(payload: {
    orderId: string; productId?: string; serviceId?: string; rating: number; reviewText?: string;
  }): Promise<void> {
    await api.post('/reviews', payload);
  },

  /** Reviews customers left on the signed-in store's / provider's items. */
  async loadReceivedReviews(): Promise<Review[]> {
    return api.get('/reviews/received');
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
    // The backend links the store to its owner's profile (profiles.store_id).
    // The client used to re-link it via PATCH /auth/me, which pointed the
    // *admin's* profile at every store the admin created.
    const result = await api.post<{ id: string }>('/stores', data);
    return result.id;
  },

  /** Admin: create a store together with its own login (User ID + password). */
  async createStoreWithLogin(
    data: Omit<Store, 'id' | 'createdAt' | 'totalSales' | 'totalOrders' | 'walletBalance' | 'ownerId' | 'ownerName'>,
    ownerAccount: StoreLoginInput,
  ): Promise<Store> {
    return api.post<Store>('/stores', { ...data, ownerAccount });
  },

  /** Admin: give an existing admin-owned store its own login. */
  async createStoreLogin(storeId: string, account: StoreLoginInput): Promise<Store> {
    return api.post<Store>(`/stores/${storeId}/owner-account`, account);
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

  /** Order status timeline (from the backend's order_status_history). */
  async loadOrderTracking(id: string): Promise<{ order: Order; timeline: OrderStatusEvent[] }> {
    return api.get(`/orders/${encodeURIComponent(id)}/tracking`);
  },

  async loadServiceOrderTracking(id: string): Promise<{ order: ServiceOrder; timeline: OrderStatusEvent[] }> {
    return api.get(`/service-orders/${encodeURIComponent(id)}/tracking`);
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

  async createAgent(agentId: string, data: { agentCode?: string; commissionRate: number; status: Agent['status'] }): Promise<Agent> {
    // `agentId` is the documented field the API keys the new row off.
    // Omit agentCode to have the server assign the next sequential one.
    return api.post<Agent>('/agents', { agentId, ...data });
  },

  async updateAgent(id: string, patch: Partial<Agent>): Promise<void> {
    await api.patch(`/agents/${id}`, patch);
  },

  // ── Wallets ──────────────────────────────────────────────────────────────────

  async creditWallet(userId: string, amount: number, description: string, referenceId?: string): Promise<void> {
    await api.post('/wallets/credit', { userId, amount, description, referenceId: referenceId ?? null });
  },

  // ── User Activities ──────────────────────────────────────────────────────────

  async trackActivity(data: Omit<UserActivity, 'id' | 'createdAt'>): Promise<void> {
    await api.post('/analytics/track', data);
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
