import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Loader2, Lock } from 'lucide-react';
import { AskIndiaLogo } from '../../components/AskIndiaLogo';
import { authService } from '../../lib/dataService';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError('Missing or invalid reset token.'); return; }
    if (!password) { setError('New password is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setError('');
    setIsLoading(true);
    const result = await authService.resetPassword(token, password);
    setIsLoading(false);

    if (result.success) {
      setDone(true);
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md card p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Reset Link</h1>
          <p className="text-sm text-slate-500 mb-6">This link is missing or malformed. Please request a new one.</p>
          <Link to="/forgot-password" className="btn-primary w-full justify-center py-3">Request New Link</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md card p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Password Reset Complete</h1>
          <p className="text-sm text-slate-500 mb-6">Your password has been updated. You can now sign in with your new password.</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center py-3">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <AskIndiaLogo size={32} showText textClass="text-lg" />
        </div>

        <div className="card p-8">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-5">
            <Lock className="h-6 w-6 text-brand-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Create a new password</h1>
          <p className="text-sm text-slate-500 mb-6">Choose a strong password you don't use elsewhere.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="input pr-10"
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                className="input"
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Resetting…
                </span>
              ) : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

