import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldAlert, Package, Store } from 'lucide-react';
import { StaticPageLayout } from '../../components/layout/StaticPageLayout';
import { useAppStore } from '../../store/useAppStore';
import { env } from '../../utils/env';

const ContactCard: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <div className="card p-5 flex gap-4">
    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
      <Icon className="h-5 w-5 text-brand-600" />
    </div>
    <div className="min-w-0 space-y-1 text-sm text-slate-600 leading-relaxed">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  </div>
);

const EmailLink: React.FC<{ address: string }> = ({ address }) => (
  <a href={`mailto:${address}`} className="font-medium text-brand-600 hover:text-brand-700 break-all">{address}</a>
);

export const ContactUs: React.FC = () => {
  const { currentUser } = useAppStore();

  return (
    <StaticPageLayout
      title="Contact Us"
      intro="Have a question about an order, a store or your account? Here's how to reach the AskIndia team."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <ContactCard icon={Mail} title="Customer support">
          <p>For help with orders, payments, deliveries or your account, email us at:</p>
          <p><EmailLink address={env.supportEmail} /></p>
        </ContactCard>

        <ContactCard icon={ShieldAlert} title="Grievances">
          <p>If you'd like to raise a complaint or grievance, write to:</p>
          <p><EmailLink address={env.grievanceEmail} /></p>
        </ContactCard>

        <ContactCard icon={Package} title="Help with an order">
          <p>
            Please include your order ID (shown as #ORD… in My Orders) so we can find your order quickly.
          </p>
          {currentUser?.role === 'customer' && (
            <p>
              You can also track orders and download invoices from{' '}
              <Link to="/shop/orders" className="font-medium text-brand-600 hover:text-brand-700">My Orders</Link>.
            </p>
          )}
        </ContactCard>

        <ContactCard icon={Store} title="Stores and service providers">
          <p>
            Sellers and service providers can use the same support address. Please mention your store name or User ID.
          </p>
        </ContactCard>
      </div>
    </StaticPageLayout>
  );
};
