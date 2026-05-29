import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle, Globe, Palette, Store, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import type { InvoiceSettings } from '../../types';

const THEMES = [
  { color: '#4f46e5', name: 'Indigo' },
  { color: '#ec4899', name: 'Pink' },
  { color: '#059669', name: 'Emerald' },
  { color: '#d97706', name: 'Amber' },
  { color: '#7c3aed', name: 'Violet' },
  { color: '#0891b2', name: 'Cyan' },
];

export const StoreProfile: React.FC = () => {
  const { currentUser, stores, updateStore } = useAppStore();
  const myStore = stores.find(s => s.id === currentUser?.storeId);

  const [selectedTheme, setSelectedTheme] = useState(myStore?.themeColor ?? '#4f46e5');
  const [storeName, setStoreName] = useState(myStore?.name ?? '');
  const [tagline, setTagline] = useState(myStore?.tagline ?? '');
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  // Invoice settings state
  const existing = myStore?.invoiceSettings ?? {};
  const [inv, setInv] = useState<InvoiceSettings>({
    businessName: existing.businessName ?? '',
    gstin: existing.gstin ?? '',
    pan: existing.pan ?? '',
    address: existing.address ?? '',
    city: existing.city ?? myStore?.city ?? '',
    state: existing.state ?? myStore?.state ?? '',
    stateCode: existing.stateCode ?? '',
    pincode: existing.pincode ?? '',
    phone: existing.phone ?? (currentUser?.phone ?? ''),
    email: existing.email ?? (myStore?.contactEmail ?? ''),
    bankName: existing.bankName ?? '',
    bankAccount: existing.bankAccount ?? (myStore?.bankAccount ?? ''),
    bankIfsc: existing.bankIfsc ?? (myStore?.bankIfsc ?? ''),
    bankBranch: existing.bankBranch ?? '',
    upiId: existing.upiId ?? '',
    hsnCode: existing.hsnCode ?? '',
    gstRate: existing.gstRate ?? 18,
    termsAndConditions: existing.termsAndConditions ?? '',
    signatory: existing.signatory ?? '',
  });

  const setInvField = (k: keyof InvoiceSettings, v: string | number) =>
    setInv(p => ({ ...p, [k]: v }));

  if (!myStore) {
    return (
      <AppLayout title="My Store">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your store is pending setup</h2>
          <p className="text-slate-500 text-sm">Once your store application is approved, you can manage your store profile here.</p>
        </div>
      </AppLayout>
    );
  }

  const save = () => {
    updateStore(myStore.id, {
      name: storeName,
      tagline,
      description,
      themeColor: selectedTheme,
      invoiceSettings: inv,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppLayout title="My Store">
      <div className="space-y-5 max-w-4xl">
        {/* Preview */}
        <div className="card overflow-hidden">
          <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${selectedTheme}, ${selectedTheme}aa)` }}>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
            }} />
          </div>
          <div className="px-6 pb-5">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-3xl"
                style={{ background: selectedTheme + '20' }}>
                {myStore.logo}
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{storeName}</h2>
                <p className="text-slate-500 text-sm">{tagline}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-fit">
              🌐 {myStore.slug}.askindia.shop
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Store Info */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Store className="h-4 w-4 text-brand-600" />
              <h3 className="font-semibold text-slate-900">Store Information</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Store Name</label>
              <input className="input" value={storeName} onChange={e => setStoreName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tagline</label>
              <input className="input" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Your store's tagline..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Store Description</label>
              <textarea className="input h-20 resize-none" placeholder="Tell customers about your store..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          {/* Domain & Theme */}
          <div className="space-y-5">
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-slate-900">Domain Settings</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subdomain (free)</label>
                <div className="flex">
                  <input className="input rounded-r-none border-r-0" value={myStore.slug} readOnly />
                  <span className="flex items-center px-3 bg-slate-100 border border-slate-300 rounded-r-lg text-sm text-slate-500 whitespace-nowrap">
                    .askindia.shop
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Custom Domain (pro)</label>
                <input className="input" placeholder="e.g. mystore.com" />
                <p className="text-xs text-slate-400 mt-1">Upgrade to Pro plan to use a custom domain</p>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-slate-900">Theme Color</h3>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {THEMES.map(t => (
                  <button
                    key={t.color}
                    onClick={() => setSelectedTheme(t.color)}
                    className="relative w-10 h-10 rounded-xl transition-transform hover:scale-110"
                    style={{ background: t.color }}
                    title={t.name}
                  >
                    {selectedTheme === t.color && (
                      <CheckCircle className="absolute inset-0 m-auto h-5 w-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Selected: {THEMES.find(t => t.color === selectedTheme)?.name}</p>
            </div>
          </div>
        </div>

        {/* Social links */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Social & Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp</label>
              <input className="input" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Instagram</label>
              <input className="input" placeholder="@yourstorehandle" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Facebook</label>
              <input className="input" placeholder="facebook.com/yourstore" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Support Email</label>
              <input className="input" placeholder="support@yourstore.com" />
            </div>
          </div>
        </div>

        {/* ── Invoice & GST Settings ── */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setInvoiceOpen(o => !o)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <div className="text-left">
                <p className="font-semibold text-slate-900">Invoice & GST Settings</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Business details that appear on customer invoices — GSTIN, PAN, bank, T&C
                </p>
              </div>
              {inv.gstin && (
                <span className="ml-3 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  GST Configured
                </span>
              )}
            </div>
            {invoiceOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </button>

          {invoiceOpen && (
            <div className="px-5 pb-5 space-y-5 border-t border-slate-100">
              {/* Business Identity */}
              <div className="pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Business Identity</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Legal Business Name</label>
                    <input className="input" placeholder="Your Pvt Ltd / LLP / Firm name"
                      value={inv.businessName ?? ''} onChange={e => setInvField('businessName', e.target.value)} />
                    <p className="text-xs text-slate-400 mt-1">As registered with GST</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Authorized Signatory</label>
                    <input className="input" placeholder="Name on invoice signature"
                      value={inv.signatory ?? ''} onChange={e => setInvField('signatory', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Tax Details */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tax Registration</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">GSTIN</label>
                    <input className="input font-mono" placeholder="22AAAAA0000A1Z5"
                      value={inv.gstin ?? ''} onChange={e => setInvField('gstin', e.target.value.toUpperCase())} maxLength={15} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">PAN Number</label>
                    <input className="input font-mono" placeholder="ABCDE1234F"
                      value={inv.pan ?? ''} onChange={e => setInvField('pan', e.target.value.toUpperCase())} maxLength={10} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">GST Rate (%)</label>
                    <select className="input" value={inv.gstRate ?? 18} onChange={e => setInvField('gstRate', Number(e.target.value))}>
                      <option value={0}>0% (Exempt)</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">HSN Code (Products)</label>
                    <input className="input font-mono" placeholder="e.g. 8518"
                      value={inv.hsnCode ?? ''} onChange={e => setInvField('hsnCode', e.target.value)} />
                    <p className="text-xs text-slate-400 mt-1">Harmonised System of Nomenclature code</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">State Code</label>
                    <input className="input font-mono" placeholder="e.g. 27 (Maharashtra)"
                      value={inv.stateCode ?? ''} onChange={e => setInvField('stateCode', e.target.value)} maxLength={2} />
                  </div>
                </div>
              </div>

              {/* Business Address */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Registered Address</p>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Street Address</label>
                    <input className="input" placeholder="Building, Street, Area"
                      value={inv.address ?? ''} onChange={e => setInvField('address', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                      <input className="input" placeholder="Mumbai"
                        value={inv.city ?? ''} onChange={e => setInvField('city', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                      <input className="input" placeholder="Maharashtra"
                        value={inv.state ?? ''} onChange={e => setInvField('state', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">PIN Code</label>
                      <input className="input font-mono" placeholder="400001"
                        value={inv.pincode ?? ''} onChange={e => setInvField('pincode', e.target.value)} maxLength={6} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                      <input className="input" placeholder="+91 98765 43210"
                        value={inv.phone ?? ''} onChange={e => setInvField('phone', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                      <input className="input" placeholder="accounts@yourbusiness.com"
                        value={inv.email ?? ''} onChange={e => setInvField('email', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Bank & Payment Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Bank Name</label>
                    <input className="input" placeholder="State Bank of India"
                      value={inv.bankName ?? ''} onChange={e => setInvField('bankName', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch</label>
                    <input className="input" placeholder="Andheri Branch"
                      value={inv.bankBranch ?? ''} onChange={e => setInvField('bankBranch', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Number</label>
                    <input className="input font-mono" placeholder="1234567890"
                      value={inv.bankAccount ?? ''} onChange={e => setInvField('bankAccount', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">IFSC Code</label>
                    <input className="input font-mono" placeholder="SBIN0001234"
                      value={inv.bankIfsc ?? ''} onChange={e => setInvField('bankIfsc', e.target.value.toUpperCase())} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">UPI ID</label>
                    <input className="input" placeholder="yourbusiness@okicici"
                      value={inv.upiId ?? ''} onChange={e => setInvField('upiId', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Terms & Conditions</p>
                <textarea
                  className="input h-24 resize-none text-xs"
                  placeholder="Enter terms & conditions that will appear on your invoice..."
                  value={inv.termsAndConditions ?? ''}
                  onChange={e => setInvField('termsAndConditions', e.target.value)}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                💡 <strong>Tip:</strong> All these details appear on GST invoices generated for your orders.
                Customers can download invoices from their "My Orders" page after delivery.
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button className="btn-secondary">Discard Changes</button>
          <button onClick={save} className={`btn-primary ${saved ? '!bg-emerald-600' : ''}`}>
            {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};
