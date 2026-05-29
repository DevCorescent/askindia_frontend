import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import {
  UserCircle, FileText, CreditCard, CheckCircle, Building2,
  Phone, Mail, MapPin, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { InvoiceSettings } from '../../types';
import clsx from 'clsx';

type Section = 'profile' | 'invoice' | 'bank';

export const ServiceProviderProfile: React.FC = () => {
  const { currentUser, providerInvoiceSettings, updateProviderInvoiceSettings } = useAppStore();
  const providerId = currentUser?.id ?? '';
  const existing = providerInvoiceSettings[providerId] ?? {};

  const [saved, setSaved] = useState(false);
  const [openSection, setOpenSection] = useState<Section | null>('profile');

  const [inv, setInv] = useState<InvoiceSettings>({
    businessName:      existing.businessName      ?? '',
    gstin:             existing.gstin             ?? '',
    pan:               existing.pan               ?? '',
    address:           existing.address           ?? '',
    city:              existing.city              ?? (currentUser?.city ?? ''),
    state:             existing.state             ?? (currentUser?.state ?? ''),
    stateCode:         existing.stateCode         ?? '',
    pincode:           existing.pincode           ?? '',
    phone:             existing.phone             ?? (currentUser?.phone ?? ''),
    email:             existing.email             ?? (currentUser?.email ?? ''),
    bankName:          existing.bankName          ?? '',
    bankAccount:       existing.bankAccount       ?? '',
    bankIfsc:          existing.bankIfsc          ?? '',
    bankBranch:        existing.bankBranch        ?? '',
    upiId:             existing.upiId             ?? '',
    sacCode:           existing.sacCode           ?? '',
    gstRate:           existing.gstRate           ?? 18,
    termsAndConditions: existing.termsAndConditions ?? '',
    signatory:         existing.signatory         ?? (currentUser?.name ?? ''),
  });

  const setF = (k: keyof InvoiceSettings, v: string | number) =>
    setInv(p => ({ ...p, [k]: v }));

  const save = () => {
    updateProviderInvoiceSettings(providerId, inv);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggle = (s: Section) => setOpenSection(o => o === s ? null : s);

  const SectionHeader: React.FC<{
    id: Section; icon: React.ElementType; title: string; subtitle: string; badge?: string;
  }> = ({ id, icon: Icon, title, subtitle, badge }) => (
    <button
      onClick={() => toggle(id)}
      className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
          <Icon className="h-5 w-5 text-violet-600" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-slate-900 text-sm">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        {badge && (
          <span className="ml-2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            {badge}
          </span>
        )}
      </div>
      {openSection === id
        ? <ChevronUp className="h-4 w-4 text-slate-400" />
        : <ChevronDown className="h-4 w-4 text-slate-400" />}
    </button>
  );

  return (
    <AppLayout title="My Profile">
      <div className="space-y-5 max-w-3xl">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Profile & Business Settings</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your profile, GST details, and invoice settings
          </p>
        </div>

        {/* Profile Summary Card */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-violet-700">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-lg">{currentUser?.name}</p>
              <p className="text-sm text-slate-500">{currentUser?.email}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                {currentUser?.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {currentUser.phone}</span>
                )}
                {currentUser?.city && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {currentUser.city}, {currentUser.state}</span>
                )}
              </div>
            </div>
            <span className="bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full">
              Service Provider
            </span>
          </div>
        </div>

        {/* ── Section: Business Identity ── */}
        <div className="card overflow-hidden">
          <SectionHeader
            id="profile"
            icon={Building2}
            title="Business Identity"
            subtitle="Your business name, GST registration, and contact info"
            badge={inv.gstin ? 'GST Registered' : undefined}
          />
          {openSection === 'profile' && (
            <div className="px-5 pb-5 border-t border-slate-100 space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Legal Business Name</label>
                  <input className="input" placeholder="Your Pvt Ltd / LLP / Sole Proprietorship"
                    value={inv.businessName ?? ''} onChange={e => setF('businessName', e.target.value)} />
                  <p className="text-xs text-slate-400 mt-1">Name as registered with GST / ROC</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Authorized Signatory Name</label>
                  <input className="input" placeholder="Person whose name appears on invoices"
                    value={inv.signatory ?? ''} onChange={e => setF('signatory', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">GSTIN</label>
                  <input className="input font-mono" placeholder="22AAAAA0000A1Z5"
                    value={inv.gstin ?? ''} onChange={e => setF('gstin', e.target.value.toUpperCase())} maxLength={15} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">PAN Number</label>
                  <input className="input font-mono" placeholder="ABCDE1234F"
                    value={inv.pan ?? ''} onChange={e => setF('pan', e.target.value.toUpperCase())} maxLength={10} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">GST Rate (%)</label>
                  <select className="input" value={inv.gstRate ?? 18} onChange={e => setF('gstRate', Number(e.target.value))}>
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">SAC Code (Services)</label>
                  <input className="input font-mono" placeholder="e.g. 998600"
                    value={inv.sacCode ?? ''} onChange={e => setF('sacCode', e.target.value)} />
                  <p className="text-xs text-slate-400 mt-1">Service Accounting Code for GST</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">State Code</label>
                  <input className="input font-mono" placeholder="e.g. 27 (MH)"
                    value={inv.stateCode ?? ''} onChange={e => setF('stateCode', e.target.value)} maxLength={2} />
                </div>
              </div>

              {/* Address */}
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Business Address</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Street Address</label>
                    <input className="input" placeholder="Building, Street, Area"
                      value={inv.address ?? ''} onChange={e => setF('address', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                      <input className="input" value={inv.city ?? ''} onChange={e => setF('city', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                      <input className="input" value={inv.state ?? ''} onChange={e => setF('state', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">PIN Code</label>
                      <input className="input font-mono" placeholder="400001" maxLength={6}
                        value={inv.pincode ?? ''} onChange={e => setF('pincode', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                      <input className="input" value={inv.phone ?? ''} onChange={e => setF('phone', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Email</label>
                      <input className="input" value={inv.email ?? ''} onChange={e => setF('email', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Invoice & T&C ── */}
        <div className="card overflow-hidden">
          <SectionHeader
            id="invoice"
            icon={FileText}
            title="Invoice Settings"
            subtitle="Terms & conditions and other details shown on invoices"
          />
          {openSection === 'invoice' && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Terms & Conditions</label>
                <textarea
                  className="input h-28 resize-none text-xs"
                  placeholder="Terms that appear at the bottom of your invoice..."
                  value={inv.termsAndConditions ?? ''}
                  onChange={e => setF('termsAndConditions', e.target.value)}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
                <strong>📄 Invoice tip:</strong> Customers can download invoices from their booking details
                once a service is marked <strong>Completed</strong>. Your business name, GSTIN, and address
                will appear automatically on the invoice.
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Bank Details ── */}
        <div className="card overflow-hidden">
          <SectionHeader
            id="bank"
            icon={CreditCard}
            title="Bank & Payment Details"
            subtitle="Bank account and UPI shown on invoices for direct payments"
            badge={inv.bankAccount ? 'Configured' : undefined}
          />
          {openSection === 'bank' && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Bank Name</label>
                  <input className="input" placeholder="State Bank of India"
                    value={inv.bankName ?? ''} onChange={e => setF('bankName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch</label>
                  <input className="input" placeholder="Andheri West Branch"
                    value={inv.bankBranch ?? ''} onChange={e => setF('bankBranch', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Number</label>
                  <input className="input font-mono" placeholder="1234567890"
                    value={inv.bankAccount ?? ''} onChange={e => setF('bankAccount', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">IFSC Code</label>
                  <input className="input font-mono" placeholder="SBIN0001234"
                    value={inv.bankIfsc ?? ''} onChange={e => setF('bankIfsc', e.target.value.toUpperCase())} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">UPI ID</label>
                  <input className="input" placeholder="yourbusiness@okicici"
                    value={inv.upiId ?? ''} onChange={e => setF('upiId', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3">
          <button
            onClick={save}
            className={clsx('btn-primary flex items-center gap-2', saved && '!bg-emerald-600')}
          >
            {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : 'Save Profile & Settings'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};
