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
