import React, { useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import type { StoreLoginInput } from '../lib/dataService';
import { MIN_PASSWORD_LENGTH, USERNAME_RE } from '../constants/auth';

export type StoreLoginErrors = Partial<Record<keyof StoreLoginInput, string>>;

export const emptyStoreLogin: StoreLoginInput = { name: '', email: '', username: '', password: '' };

/** Client-side checks mirroring the backend's (the backend re-validates). */
export function validateStoreLogin(v: StoreLoginInput): StoreLoginErrors {
  const errors: StoreLoginErrors = {};
  if (!v.name.trim()) errors.name = 'Owner / manager name is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'A valid email is required (used for password recovery)';
  if (!USERNAME_RE.test(v.username.trim())) errors.username = '3–32 characters: letters, digits, dot, dash or underscore';
  if (v.password.length < MIN_PASSWORD_LENGTH) errors.password = `At least ${MIN_PASSWORD_LENGTH} characters`;
  return errors;
}

/** Random password without look-alike characters, for the admin to hand over. */
export function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

interface Props {
  value: StoreLoginInput;
  onChange: (next: StoreLoginInput) => void;
  errors?: StoreLoginErrors;
}

/** Name / email / User ID / password fields for a store's own login. */
export const StoreLoginFields: React.FC<Props> = ({ value, onChange, errors = {} }) => {
  const [showPass, setShowPass] = useState(false);
  const set = (key: keyof StoreLoginInput, v: string) => onChange({ ...value, [key]: v });
  const field = (key: keyof StoreLoginInput, label: string, input: React.ReactNode) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label} <span className="text-red-500">*</span></label>
      {input}
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {field('name', 'Owner / Manager Name', (
        <input className={clsx('input w-full', errors.name && 'border-red-400')} placeholder="Rahul Sharma"
          value={value.name} onChange={e => set('name', e.target.value)} />
      ))}
      {field('email', 'Login Email', (
        <input className={clsx('input w-full', errors.email && 'border-red-400')} type="email" placeholder="owner@store.com"
          value={value.email} onChange={e => set('email', e.target.value)} autoComplete="off" />
      ))}
      {field('username', 'User ID', (
        <input className={clsx('input w-full font-mono', errors.username && 'border-red-400')} placeholder="mystore01"
          value={value.username} onChange={e => set('username', e.target.value.trim())} autoComplete="off" autoCapitalize="none" />
      ))}
      {field('password', 'Password', (
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <input className={clsx('input w-full pr-9 font-mono', errors.password && 'border-red-400')}
              type={showPass ? 'text' : 'password'} value={value.password}
              onChange={e => set('password', e.target.value)} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" title={showPass ? 'Hide' : 'Show'}>
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button type="button" onClick={() => { set('password', generatePassword()); setShowPass(true); }}
            className="px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300" title="Generate password">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
