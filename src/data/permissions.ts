import type { Permission, Role } from '../types';

export const ALL_PERMISSIONS: Permission[] = [
  // Dashboard
  { key: 'dashboard.view', label: 'View Dashboard', category: 'Dashboard' },
  // Products
  { key: 'products.view', label: 'View Products', category: 'Products' },
  { key: 'products.create', label: 'Create Products', category: 'Products' },
  { key: 'products.edit', label: 'Edit Products', category: 'Products' },
  { key: 'products.delete', label: 'Delete Products', category: 'Products' },
  // Orders
  { key: 'orders.view', label: 'View All Orders', category: 'Orders' },
  { key: 'orders.update_status', label: 'Update Order Status', category: 'Orders' },
  { key: 'orders.refund', label: 'Process Refunds', category: 'Orders' },
  // Services
  { key: 'services.view', label: 'View Services', category: 'Services' },
  { key: 'services.approve', label: 'Approve Services', category: 'Services' },
  { key: 'services.reject', label: 'Reject Services', category: 'Services' },
  // Users
  { key: 'users.view', label: 'View All Users', category: 'Users' },
  { key: 'users.create', label: 'Create Users', category: 'Users' },
  { key: 'users.edit', label: 'Edit Users', category: 'Users' },
  { key: 'users.delete', label: 'Delete Users', category: 'Users' },
  { key: 'users.suspend', label: 'Suspend/Activate Users', category: 'Users' },
  // Stores
  { key: 'stores.view', label: 'View Stores', category: 'Stores' },
  { key: 'stores.activate', label: 'Activate Stores', category: 'Stores' },
  { key: 'stores.reject', label: 'Reject Stores', category: 'Stores' },
  // Finance
  { key: 'finance.view_payouts', label: 'View Payouts', category: 'Finance' },
  { key: 'finance.process_payouts', label: 'Process Payouts', category: 'Finance' },
  { key: 'finance.view_revenue', label: 'View Revenue Reports', category: 'Finance' },
  // Analytics
  { key: 'analytics.view', label: 'View Analytics', category: 'Analytics' },
  { key: 'analytics.tracking', label: 'View Behaviour Tracking', category: 'Analytics' },
  { key: 'analytics.abandoned_carts', label: 'View Abandoned Carts', category: 'Analytics' },
  // Settings
  { key: 'settings.homepage', label: 'Manage Homepage', category: 'Settings' },
  { key: 'settings.roles', label: 'Manage Roles & Permissions', category: 'Settings' },
  { key: 'settings.agents', label: 'Manage Agents', category: 'Settings' },
];

export const PERMISSION_CATEGORIES = [...new Set(ALL_PERMISSIONS.map(p => p.category))];

// All permissions (admin has all)
const ALL_KEYS = ALL_PERMISSIONS.map(p => p.key);

export const SYSTEM_ROLES: Role[] = [
  {
    id: 'role_admin',
    name: 'Super Admin',
    description: 'Full platform access. Can manage everything.',
    permissions: ALL_KEYS,
    color: '#f59e0b',
    isSystem: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'role_store_owner',
    name: 'Store Owner',
    description: 'Manages their own store, products, orders and wallet.',
    permissions: ['dashboard.view', 'products.view', 'orders.view', 'finance.view_payouts'],
    color: '#10b981',
    isSystem: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'role_service_provider',
    name: 'Service Provider',
    description: 'Manages their own services, bookings and wallet.',
    permissions: ['dashboard.view', 'services.view', 'orders.view', 'finance.view_payouts'],
    color: '#8b5cf6',
    isSystem: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'role_customer',
    name: 'Customer',
    description: 'Can browse, buy products and book services.',
    permissions: ['products.view', 'services.view', 'stores.view', 'orders.view'],
    color: '#3b82f6',
    isSystem: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'role_agent',
    name: 'Sales Agent',
    description: 'Can refer products/services and earn commission.',
    permissions: ['dashboard.view', 'products.view', 'services.view', 'orders.view', 'finance.view_payouts'],
    color: '#f97316',
    isSystem: true,
    createdAt: '2024-01-01',
  },
];
