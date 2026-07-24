import type { User, Category, ServiceCategory, Order, RevenueDataPoint } from '../types';

export const ADMIN_USER: User = {
  id: 'admin_001',
  name: 'AskIndia Admin',
  email: 'admin@askindia.shop',
  role: 'admin',
  createdAt: '2024-01-01',
};

export const PRODUCT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Electronics', slug: 'electronics', icon: '💻' },
  { id: 'c2', name: 'Fashion & Apparel', slug: 'fashion', icon: '👗' },
  { id: 'c3', name: 'Sports & Fitness', slug: 'sports', icon: '🏋️' },
  { id: 'c4', name: 'Home & Living', slug: 'home', icon: '🏠' },
  { id: 'c5', name: 'Beauty & Care', slug: 'beauty', icon: '✨' },
  { id: 'c6', name: 'Books & Education', slug: 'books', icon: '📚' },
  { id: 'c7', name: 'Food & Grocery', slug: 'food', icon: '🛒' },
  { id: 'c8', name: 'Toys & Games', slug: 'toys', icon: '🧸' },
  { id: 'c9', name: 'Automotive', slug: 'auto', icon: '🚗' },
  { id: 'c10', name: 'Health & Wellness', slug: 'health', icon: '💊' },
];

/**
 * Canonical lookup of category id by display name (e.g. "Electronics" → "c1").
 * The backend seeds `category_id` as a slugified name ("electronics", "home_&_living"),
 * while admin-created products store the frontend id ("c1"). The display-name `category`
 * field is the only value that is consistent across both, so we resolve through it.
 */
const CATEGORY_ID_BY_NAME = new Map(PRODUCT_CATEGORIES.map(c => [c.name, c.id]));

/** Resolve a product's canonical frontend category id, regardless of how it was stored. */
export const resolveCategoryId = (p: { categoryId?: string; category?: string }): string =>
  (PRODUCT_CATEGORIES.some(c => c.id === p.categoryId) ? p.categoryId : undefined)
  ?? CATEGORY_ID_BY_NAME.get(p.category ?? '')
  ?? p.categoryId ?? '';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'sc1', name: 'Home Repairs', slug: 'home-repairs', icon: '🔧' },
  { id: 'sc2', name: 'Cleaning', slug: 'cleaning', icon: '🧹' },
  { id: 'sc3', name: 'Tutoring & Education', slug: 'tutoring', icon: '📖' },
  { id: 'sc4', name: 'Beauty & Salon', slug: 'beauty-salon', icon: '💅' },
  { id: 'sc5', name: 'Fitness & Yoga', slug: 'fitness', icon: '🏋️' },
  { id: 'sc6', name: 'IT & Tech Support', slug: 'tech-support', icon: '💻' },
  { id: 'sc7', name: 'Photography', slug: 'photography', icon: '📸' },
  { id: 'sc8', name: 'Events & Catering', slug: 'events', icon: '🎉' },
  { id: 'sc9', name: 'Transport & Logistics', slug: 'transport', icon: '🚚' },
  { id: 'sc10', name: 'Legal & Financial', slug: 'legal', icon: '⚖️' },
];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const computeMonthlyRevenue = (orders: Order[]): RevenueDataPoint[] => {
  const currentYear = new Date().getFullYear();
  const map = new Map<string, RevenueDataPoint>();
  MONTHS.forEach(m => map.set(m, { date: m, revenue: 0, orders: 0, commission: 0 }));

  orders.forEach(order => {
    const date = new Date(order.createdAt);
    if (date.getFullYear() === currentYear && order.status !== 'cancelled') {
      const month = MONTHS[date.getMonth()];
      const dp = map.get(month)!;
      dp.revenue += order.total;
      dp.orders += 1;
      dp.commission += order.commissionTotal;
    }
  });

  return MONTHS.map(m => map.get(m)!);
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
