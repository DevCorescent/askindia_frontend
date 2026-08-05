import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AskIndiaLogo } from '../../components/AskIndiaLogo';
import { authService } from '../../lib/dataService';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState<{ message: string; devResetLink?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }

    setError('');
    setIsLoading(true);
    const result = await authService.forgotPassword(email.trim());
    setIsLoading(false);

    if (result.success) {
      setSent({
        message: result.message ?? 'If an account exists for that email, a password reset link has been generated.',
        devResetLink: result.devResetLink,
      });
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <AskIndiaLogo size={32} showText textClass="text-lg" />
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h1>
              <p className="text-sm text-slate-500 mb-5">{sent.message}</p>
              {sent.devResetLink && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800 text-left">
                  <p className="font-semibold mb-1">⚠ Development Mode</p>
                  <p className="text-xs text-amber-700 mb-2">
                    No email service is configured, so here is the reset link (never shown in production):
                  </p>
                  <a href={sent.devResetLink} className="text-xs font-mono text-brand-600 break-all hover:underline">
                    {sent.devResetLink}
                  </a>
                </div>
              )}
              <Link to="/login" className="btn-primary w-full justify-center py-3">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-5">
                <Mail className="h-6 w-6 text-brand-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Forgot your password?</h1>
              <p className="text-sm text-slate-500 mb-6">
                Enter your registered email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    className="input"
                    placeholder="you@example.com"
                    autoComplete="email"
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
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                  <ArrowLeft className="h-4 w-4" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

