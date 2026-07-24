import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAppStore } from '../../store/useAppStore';
import { mutations } from '../../lib/dataService';
import { toast } from '../../components/ui/Toast';
import { UserCircle, Loader2, Mail } from 'lucide-react';

export const DeliveryProfile: React.FC = () => {
  const { currentUser, setCurrentUser, trackActivity } = useAppStore();

  const [name, setName]   = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [city, setCity]   = useState(currentUser?.city ?? '');
  const [state, setState] = useState(currentUser?.state ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dirty =
    name.trim() !== (currentUser?.name ?? '') ||
    phone !== (currentUser?.phone ?? '') ||
    city !== (currentUser?.city ?? '') ||
    state !== (currentUser?.state ?? '');

  const save = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const updated = await mutations.updateMyProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
      });
      setCurrentUser({ ...currentUser!, ...updated });
      trackActivity('profile_update', { name: updated.name });
      toast.success('Profile updated');
    } catch (e) {
      setError((e as Error).message || 'Could not save. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setName(currentUser?.name ?? '');
    setPhone(currentUser?.phone ?? '');
    setCity(currentUser?.city ?? '');
    setState(currentUser?.state ?? '');
    setError('');
  };

  const initials = (currentUser?.name ?? 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <AppLayout title="My Profile">
      <div className="max-w-2xl space-y-5">
        {/* Identity header */}
        <div className="card p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{name || 'Delivery Partner'}</h2>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 truncate">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" /> {currentUser?.email}
            </p>
            <span className="inline-block mt-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">
              Delivery Partner
            </span>
          </div>
        </div>

        {/* Editable details */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-brand-600" />
            <h3 className="font-semibold text-slate-900">Personal Details</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input className="input disabled:bg-slate-100 disabled:text-slate-400" value={currentUser?.email ?? ''} disabled title="Email cannot be changed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
              <input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
              <input className="input" value={state} onChange={e => setState(e.target.value)} placeholder="Maharashtra" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button onClick={reset} disabled={!dirty || saving} className="btn-secondary disabled:opacity-50">Discard</button>
            <button onClick={save} disabled={!dirty || saving} className="btn-primary gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
