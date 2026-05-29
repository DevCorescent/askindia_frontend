import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';

import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';
import { RegisterStoreOwner } from './pages/auth/RegisterStoreOwner';
import { RegisterServiceProvider } from './pages/auth/RegisterServiceProvider';
import { RegisterCustomer } from './pages/auth/RegisterCustomer';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminServices } from './pages/admin/AdminServices';
import { AdminStores } from './pages/admin/AdminStores';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminPayouts } from './pages/admin/AdminPayouts';
import { AdminAgents } from './pages/admin/AdminAgents';
import { AdminHomepage } from './pages/admin/AdminHomepage';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminRoles } from './pages/admin/AdminRoles';
import { AdminInsights } from './pages/admin/AdminInsights';
import { AdminTracking } from './pages/admin/AdminTracking';

import { AgentDashboard } from './pages/agent/AgentDashboard';
import { AgentProducts } from './pages/agent/AgentProducts';
import { AgentServices } from './pages/agent/AgentServices';
import { AgentOrders } from './pages/agent/AgentOrders';
import { AgentWallet } from './pages/agent/AgentWallet';

import { StoreDashboard } from './pages/store-owner/StoreDashboard';
import { StoreProfile } from './pages/store-owner/StoreProfile';
import { StoreOrders } from './pages/store-owner/StoreOrders';
import { StoreWallet } from './pages/store-owner/StoreWallet';
import { StoreCustomize } from './pages/store-owner/StoreCustomize';

import { ServiceProviderDashboard } from './pages/service-provider/ServiceProviderDashboard';
import { ServiceProviderServices } from './pages/service-provider/ServiceProviderServices';
import { ServiceProviderOrders } from './pages/service-provider/ServiceProviderOrders';
import { ServiceProviderWallet } from './pages/service-provider/ServiceProviderWallet';
import { ServiceProviderProfile } from './pages/service-provider/ServiceProviderProfile';

import { CustomerStorefront } from './pages/customer/CustomerStorefront';
import { CustomerCart } from './pages/customer/CustomerCart';
import { CustomerCheckout } from './pages/customer/CustomerCheckout';
import { CustomerOrders } from './pages/customer/CustomerOrders';
import { CustomerServices } from './pages/customer/CustomerServices';
import { ProductDetail } from './pages/customer/ProductDetail';
import { ServiceDetail } from './pages/customer/ServiceDetail';
import { StoreStorefront } from './pages/customer/StoreStorefront';
import { StoresListing } from './pages/customer/StoresListing';

type Role = 'admin' | 'store_owner' | 'service_provider' | 'customer' | 'agent';

const ProtectedRoute: React.FC<{ role: Role; children: React.ReactNode }> = ({ role, children }) => {
  const { currentUser } = useAppStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) {
    if (currentUser.role === 'admin') return <Navigate to="/admin" replace />;
    if (currentUser.role === 'store_owner') return <Navigate to="/store" replace />;
    if (currentUser.role === 'service_provider') return <Navigate to="/service-provider" replace />;
    if (currentUser.role === 'agent') return <Navigate to="/agent" replace />;
    return <Navigate to="/shop" replace />;
  }
  return <>{children}</>;
};

// Any authenticated user can view store storefronts (admin preview, store owners, customers)
const AnyAuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/store-owner" element={<RegisterStoreOwner />} />
        <Route path="/register/service-provider" element={<RegisterServiceProvider />} />
        <Route path="/register/customer" element={<RegisterCustomer />} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute role="admin"><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedRoute role="admin"><AdminServices /></ProtectedRoute>} />
        <Route path="/admin/stores" element={<ProtectedRoute role="admin"><AdminStores /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/payouts" element={<ProtectedRoute role="admin"><AdminPayouts /></ProtectedRoute>} />
        <Route path="/admin/agents" element={<ProtectedRoute role="admin"><AdminAgents /></ProtectedRoute>} />
        <Route path="/admin/homepage" element={<ProtectedRoute role="admin"><AdminHomepage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/roles" element={<ProtectedRoute role="admin"><AdminRoles /></ProtectedRoute>} />
        <Route path="/admin/insights" element={<ProtectedRoute role="admin"><AdminInsights /></ProtectedRoute>} />
        <Route path="/admin/tracking" element={<ProtectedRoute role="admin"><AdminTracking /></ProtectedRoute>} />

        {/* Store owner */}
        <Route path="/store" element={<ProtectedRoute role="store_owner"><StoreDashboard /></ProtectedRoute>} />
        <Route path="/store/profile" element={<ProtectedRoute role="store_owner"><StoreProfile /></ProtectedRoute>} />
        <Route path="/store/orders" element={<ProtectedRoute role="store_owner"><StoreOrders /></ProtectedRoute>} />
        <Route path="/store/wallet" element={<ProtectedRoute role="store_owner"><StoreWallet /></ProtectedRoute>} />
        <Route path="/store/customize" element={<ProtectedRoute role="store_owner"><StoreCustomize /></ProtectedRoute>} />

        {/* Service provider */}
        <Route path="/service-provider" element={<ProtectedRoute role="service_provider"><ServiceProviderDashboard /></ProtectedRoute>} />
        <Route path="/service-provider/services" element={<ProtectedRoute role="service_provider"><ServiceProviderServices /></ProtectedRoute>} />
        <Route path="/service-provider/orders" element={<ProtectedRoute role="service_provider"><ServiceProviderOrders /></ProtectedRoute>} />
        <Route path="/service-provider/wallet" element={<ProtectedRoute role="service_provider"><ServiceProviderWallet /></ProtectedRoute>} />
        <Route path="/service-provider/profile" element={<ProtectedRoute role="service_provider"><ServiceProviderProfile /></ProtectedRoute>} />

        {/* Customer */}
        <Route path="/shop" element={<ProtectedRoute role="customer"><CustomerStorefront /></ProtectedRoute>} />
        <Route path="/shop/services" element={<ProtectedRoute role="customer"><CustomerServices /></ProtectedRoute>} />
        <Route path="/shop/stores" element={<AnyAuthRoute><StoresListing /></AnyAuthRoute>} />
        <Route path="/shop/cart" element={<ProtectedRoute role="customer"><CustomerCart /></ProtectedRoute>} />
        <Route path="/shop/checkout" element={<ProtectedRoute role="customer"><CustomerCheckout /></ProtectedRoute>} />
        <Route path="/shop/orders" element={<ProtectedRoute role="customer"><CustomerOrders /></ProtectedRoute>} />
        <Route path="/shop/product/:id" element={<ProtectedRoute role="customer"><ProductDetail /></ProtectedRoute>} />
        <Route path="/shop/service/:id" element={<ProtectedRoute role="customer"><ServiceDetail /></ProtectedRoute>} />
        {/* Store storefront — any authenticated user (admin preview, store owners, customers) */}
        <Route path="/shop/store/:slug" element={<AnyAuthRoute><StoreStorefront /></AnyAuthRoute>} />

        {/* Agent */}
        <Route path="/agent" element={<ProtectedRoute role="agent"><AgentDashboard /></ProtectedRoute>} />
        <Route path="/agent/products" element={<ProtectedRoute role="agent"><AgentProducts /></ProtectedRoute>} />
        <Route path="/agent/services" element={<ProtectedRoute role="agent"><AgentServices /></ProtectedRoute>} />
        <Route path="/agent/orders" element={<ProtectedRoute role="agent"><AgentOrders /></ProtectedRoute>} />
        <Route path="/agent/wallet" element={<ProtectedRoute role="agent"><AgentWallet /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
