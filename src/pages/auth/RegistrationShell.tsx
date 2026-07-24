import React from 'react';
import { Link } from 'react-router-dom';
import { AskIndiaLogo } from '../../components/AskIndiaLogo';
import clsx from 'clsx';

export interface RegBenefit { icon: React.ReactNode; title: string; desc: string; }
export interface RegStep { num: number; label: string; }

type Accent = 'violet' | 'brand';

const THEME: Record<Accent, {
  gradient: string;
  subtitle: string;
  muted: string;
  benefitBg: string;
  stepActive: string;
  stepDone: string;
  stepIdle: string;
  stepActiveText: string;
  stepDoneText: string;
  stepIdleText: string;
  signIn: string;
  mobileActive: string;
  mobileActiveText: string;
}> = {
  violet: {
    gradient: 'linear-gradient(150deg, #7c3aed 0%, #6d28d9 45%, #4c1d95 100%)',
    subtitle: 'text-violet-200',
    muted: 'text-violet-300',
    benefitBg: 'bg-white/10',
    stepActive: 'bg-white text-violet-700',
    stepDone: 'bg-emerald-400 text-white',
    stepIdle: 'bg-white/20 text-violet-200',
    stepActiveText: 'text-white font-semibold',
    stepDoneText: 'text-emerald-300',
    stepIdleText: 'text-violet-300',
    signIn: 'text-violet-600 hover:text-violet-700',
    mobileActive: 'bg-violet-600 border-violet-600 text-white',
    mobileActiveText: 'text-violet-600',
  },
  brand: {
    gradient: 'linear-gradient(150deg, #1a38b8 0%, #0f2490 45%, #0d1f6e 100%)',
    subtitle: 'text-brand-100',
    muted: 'text-brand-200',
    benefitBg: 'bg-white/10',
    stepActive: 'bg-white text-brand-800',
    stepDone: 'bg-emerald-400 text-white',
    stepIdle: 'bg-white/20 text-brand-100',
    stepActiveText: 'text-white font-semibold',
    stepDoneText: 'text-emerald-300',
    stepIdleText: 'text-brand-200',
    signIn: 'text-brand-600 hover:text-brand-700',
    mobileActive: 'bg-brand-600 border-brand-600 text-white',
    mobileActiveText: 'text-brand-600',
  },
};

interface Props {
  accent: Accent;
  roleLabel: string;
  panelIcon: React.ReactNode;
  heading: string;
  subtitle: string;
  benefits: RegBenefit[];
  steps: RegStep[];
  currentStep: number;
  children: React.ReactNode;
}

/**
 * Full-bleed two-column registration layout shared by every seller/provider
 * signup flow. Left = branded gradient panel (benefits + vertical progress),
 * right = scrollable form column. Uses the entire viewport edge-to-edge.
 */
export const RegistrationShell: React.FC<Props> = ({
  accent, roleLabel, panelIcon, heading, subtitle, benefits, steps, currentStep, children,
}) => {
  const t = THEME[accent];
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-slate-50">

      {/* ── Brand panel (left) ─────────────────────────────────────────── */}
      <aside
        className="relative hidden lg:flex lg:w-[38%] xl:w-[32%] flex-shrink-0 flex-col text-white p-10 xl:p-12 overflow-y-auto"
        style={{ background: t.gradient }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(35%,-35%)' }} />

        <div className="mb-10">
          <AskIndiaLogo size={34} showText textClass="text-xl" tone="light" />
        </div>

        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
          {panelIcon}
        </div>
        <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight mb-3">{heading}</h2>
        <p className={clsx('text-base leading-relaxed mb-8 max-w-sm', t.subtitle)}>{subtitle}</p>

        <div className="space-y-5">
          {benefits.map(b => (
            <div key={b.title} className="flex gap-4">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', t.benefitBg)}>
                {b.icon}
              </div>
              <div>
                <p className="text-base font-bold">{b.title}</p>
                <p className={clsx('text-sm', t.muted)}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Vertical progress */}
        <div className="mt-auto pt-10">
          <p className={clsx('text-xs uppercase tracking-widest font-bold mb-4', t.muted)}>Registration Progress</p>
          <div className="space-y-2.5">
            {steps.map(s => (
              <div key={s.num} className="flex items-center gap-3">
                <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  currentStep > s.num ? t.stepDone : currentStep === s.num ? t.stepActive : t.stepIdle)}>
                  {currentStep > s.num ? '✓' : s.num}
                </div>
                <span className={clsx('text-sm',
                  currentStep === s.num ? t.stepActiveText : currentStep > s.num ? t.stepDoneText : t.stepIdleText)}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Form column (right) ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:h-screen lg:overflow-y-auto">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="lg:hidden"><AskIndiaLogo size={28} showText textClass="text-base" /></span>
            <span className="hidden lg:inline text-sm font-semibold text-slate-500">{roleLabel}</span>
          </div>
          <Link to="/login" className={clsx('text-sm font-semibold', t.signIn)}>
            Already registered? Sign in
          </Link>
        </header>

        <div className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-8 py-8 lg:py-10">
          {/* Mobile horizontal progress */}
          <div className="flex items-center mb-8 lg:hidden">
            {steps.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                    currentStep > s.num ? 'bg-emerald-600 border-emerald-600 text-white'
                      : currentStep === s.num ? t.mobileActive
                      : 'bg-white border-slate-300 text-slate-400')}>
                    {currentStep > s.num ? '✓' : s.num}
                  </div>
                  <span className={clsx('text-[11px] mt-1 font-medium hidden sm:block',
                    currentStep === s.num ? t.mobileActiveText : currentStep > s.num ? 'text-emerald-600' : 'text-slate-400')}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={clsx('flex-1 h-0.5 mx-1 mb-4', currentStep > s.num ? 'bg-emerald-500' : 'bg-slate-200')} />
                )}
              </React.Fragment>
            ))}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};
