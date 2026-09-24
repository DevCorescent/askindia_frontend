import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { AskIndiaLogo } from '../../components/AskIndiaLogo';
import { authService } from '../../lib/dataService';

const ErrorNote: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
    <span>{message}</span>
  </div>
);

/**
 * Final-stage recovery: Email/User ID → email OTP → verify → reset password.
 * Only rendered when the backend reports PASSWORD_RESET_OTP_ENABLED; the
 * verified code is exchanged for a normal reset token and handed to the
 * existing /reset-password page.
 */
const OtpRecovery: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'password' | 'username'>('password');
  const [step, setStep] = useState<'identify' | 'verify' | 'done'>('identify');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [info, setInfo] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (next: 'password' | 'username') => {
    setMode(next); setStep('identify'); setError(''); setInfo(''); setDevOtp(''); setOtp('');
  };

  const submitIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = identifier.trim();
    if (!id) { setError(mode === 'username' ? 'Email address is required.' : 'Email address or User ID is required.'); return; }
    if ((mode === 'username' || id.includes('@')) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
      setError('Please enter a valid email address.'); return;
    }
    setError('');
    setIsLoading(true);
    const result = mode === 'username'
      ? await authService.forgotUsername(id)
      : await authService.requestPasswordOtp(id);
    setIsLoading(false);
    if (!result.success) { setError(result.error ?? 'Something went wrong. Please try again.'); return; }
    setInfo(result.message ?? '');
    if (mode === 'username') { setStep('done'); return; }
    setDevOtp((result as { devOtp?: string }).devOtp ?? '');
    setStep('verify');
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) { setError('Enter the 6-digit code from the email.'); return; }
    setError('');
    setIsLoading(true);
    const result = await authService.verifyPasswordOtp(identifier.trim(), otp.trim());
    setIsLoading(false);
    if (!result.success || !result.resetToken) { setError(result.error ?? 'Invalid or expired code'); return; }
    navigate(`/reset-password?token=${encodeURIComponent(result.resetToken)}`);
  };

  if (step === 'done') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h1>
        <p className="text-sm text-slate-500 mb-5">{info}</p>
        <Link to="/login" className="btn-primary w-full justify-center py-3">Back to Sign In</Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-5">
        {step === 'verify' ? <KeyRound className="h-6 w-6 text-brand-600" /> : <Mail className="h-6 w-6 text-brand-600" />}
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-1">
        {mode === 'username' ? 'Forgot your User ID?' : step === 'verify' ? 'Enter verification code' : 'Forgot your password?'}
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {mode === 'username'
          ? 'Enter your registered email and we will send your User ID to it.'
          : step === 'verify'
            ? info
            : 'Enter your email address or User ID and we will email you a verification code.'}
      </p>

      {step === 'identify' ? (
        <form onSubmit={submitIdentify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {mode === 'username' ? 'Email Address' : 'Email Address or User ID'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => { setIdentifier(e.target.value); setError(''); }}
              className="input"
              placeholder={mode === 'username' ? 'you@example.com' : 'you@example.com or User ID'}
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>
          {error && <ErrorNote message={error} />}
          <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3">
            {isLoading
              ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending…</span>
              : mode === 'username' ? 'Email My User ID' : 'Send Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitOtp} className="space-y-5">
          {devOtp && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <p className="font-semibold">⚠ Development Mode</p>
              No email service is configured — your code is <span className="font-mono font-bold">{devOtp}</span> (never shown in production).
            </div>
          )}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
            className="input text-center text-2xl tracking-[0.5em] font-mono"
            placeholder="••••••"
            autoComplete="one-time-code"
          />
          {error && <ErrorNote message={error} />}
          <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3">
            {isLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</span> : 'Verify Code'}
          </button>
          <button type="button" onClick={() => switchMode('password')} className="w-full text-sm text-slate-500 hover:text-slate-700">
            Didn't get it? Send a new code
          </button>
        </form>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>
        <button
          type="button"
          onClick={() => switchMode(mode === 'username' ? 'password' : 'username')}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          {mode === 'username' ? 'Forgot password?' : 'Forgot User ID?'}
        </button>
      </div>
    </>
  );
};

export const ForgotPassword: React.FC = () => {
  // OTP recovery is a final-stage feature; the backend flag decides when it shows.
  const [otpEnabled, setOtpEnabled] = useState(false);
  useEffect(() => {
    let cancelled = false;
    authService.recoveryOptions().then(o => { if (!cancelled) setOtpEnabled(o.otpEnabled); });
    return () => { cancelled = true; };
  }, []);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState<{ message: string; emailSent?: boolean; devResetLink?: string } | null>(null);

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
        emailSent: result.emailSent,
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
          {otpEnabled ? <OtpRecovery /> : sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">
                {sent.devResetLink ? 'Reset link ready' : sent.emailSent ? 'Check your inbox' : 'Request received'}
              </h1>
              <p className="text-sm text-slate-500 mb-5">{sent.message}</p>
              {!sent.devResetLink && !sent.emailSent && (
                // The backend reports `emailSent: false` until a mail provider is
                // configured — don't send people to watch an inbox nothing arrives in.
                // This branch disappears on its own once delivery is wired up.
                <p className="text-xs text-slate-400 mb-5">
                  Email delivery isn't switched on yet, so the link won't reach your inbox.
                  Please contact support to get your password reset.
                </p>
              )}
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
                Enter your registered email address to request a password reset link.
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

