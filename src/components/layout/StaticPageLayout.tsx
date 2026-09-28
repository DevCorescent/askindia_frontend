import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { AppLayout } from './AppLayout';
import { AskIndiaLogo } from '../AskIndiaLogo';
import { useAppStore } from '../../store/useAppStore';
import { env } from '../../utils/env';

const PAGES = [
  { to: '/contact', label: 'Contact Us' },
  { to: '/terms',   label: 'Terms & Conditions' },
  { to: '/refunds', label: 'Refunds & Cancellations' },
];

interface Props {
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shell for the public information pages. Signed-in users keep the normal app
 * layout; guests (who usually arrive from the landing-page footer) get a light
 * header instead of the app chrome, which is empty without an account.
 */
export const StaticPageLayout: React.FC<Props> = ({ title, intro, children }) => {
  const { currentUser } = useAppStore();
  const { pathname } = useLocation();

  const content = (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2 leading-relaxed">{intro}</p>
      </div>
      {children}
      <nav aria-label="Information pages" className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-sm">
        {PAGES.filter(p => p.to !== pathname).map(p => (
          <Link key={p.to} to={p.to} className="font-medium text-brand-600 hover:text-brand-700">{p.label}</Link>
        ))}
      </nav>
    </div>
  );

  if (currentUser) return <AppLayout title={title}>{content}</AppLayout>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/" aria-label={`${env.appName} home`}>
            <AskIndiaLogo size={30} showText textClass="text-lg" />
          </Link>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </div>
      </header>
      <main className="flex-1 px-4 sm:px-6 py-8">{content}</main>
      <footer className="bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-xs text-center">© {new Date().getFullYear()} {env.companyName}</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {PAGES.map(p => (
              <Link
                key={p.to}
                to={p.to}
                className={clsx('text-xs transition-colors', p.to === pathname ? 'text-white' : 'text-slate-400 hover:text-white')}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

/** A titled card section on an information page. */
export const PageSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="card p-5 sm:p-6">
    <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{title}</h2>
    <div className="space-y-2 text-sm text-slate-600 leading-relaxed">{children}</div>
  </section>
);
