'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { AnimatedBar } from './AnimatedBar';
import { WaitlistForm } from './WaitlistForm';

const T = '#00D4B4';

/* ── Inline SVG icons ─────────────────────────────────────────────────── */
const LogoMark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M7 2l5 5-5 5" stroke="#0A0F1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WebAutomationIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={T} strokeWidth="1.5">
    <rect x="2" y="5" width="24" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="2" y1="10" x2="26" y2="10" strokeLinecap="round" />
    <circle cx="5.5" cy="7.5" r="1" fill={T} stroke="none" />
    <circle cx="8.5" cy="7.5" r="1" fill={T} stroke="none" />
    <circle cx="11.5" cy="7.5" r="1" fill={T} stroke="none" />
    <path d="M11.5 16.5l5-3-5-3v6z" strokeLinejoin="round" />
  </svg>
);

const MobileAutomationIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={T} strokeWidth="1.5">
    <rect x="7" y="2" width="14" height="24" rx="3" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="7" y1="6" x2="21" y2="6" strokeLinecap="round" />
    <line x1="7" y1="22" x2="21" y2="22" strokeLinecap="round" />
    <circle cx="14" cy="24.5" r="0.8" fill={T} stroke="none" />
    <path d="M10.5 14l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TestManagementIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={T} strokeWidth="1.5">
    <line x1="4" y1="24" x2="24" y2="24" strokeLinecap="round" />
    <line x1="4" y1="4" x2="4" y2="24" strokeLinecap="round" />
    <rect x="7" y="16" width="4" height="8" rx="1" />
    <rect x="12" y="11" width="4" height="13" rx="1" />
    <rect x="17" y="7" width="4" height="17" rx="1" />
    <path d="M8 12l5-4 5-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Status badges ────────────────────────────────────────────────────── */
const InDevelopmentBadge = () => (
  <span className="text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap border bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
    In Development
  </span>
);

const ComingSoonBadge = () => (
  <span className="text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap border bg-slate-100 text-slate-500 border-slate-200 dark:bg-neutral-700/50 dark:text-neutral-400 dark:border-neutral-600">
    Coming Soon
  </span>
);

/* ── Roadmap card ─────────────────────────────────────────────────────── */
interface RoadmapCardProps {
  icon: React.ReactNode;
  title: string;
  status: 'in-development' | 'coming-soon';
  pct: number;
  description: string;
  bullets: string[];
  c: ReturnType<typeof buildColors>;
}

function RoadmapCard({ icon, title, status, pct, description, bullets, c }: RoadmapCardProps) {
  return (
    <div
      className="border-l-4 border-teal-500 rounded-xl p-8 lg:p-10"
      style={{ background: c.card, border: `1px solid ${c.cardBorder}`, borderLeft: `4px solid ${T}` }}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${T}18` }}
        >
          {icon}
        </div>
        <span
          className="font-bold text-2xl flex-1"
          style={{ fontFamily: 'var(--font-sora)', color: c.text }}
        >
          {title}
        </span>
        {status === 'in-development' ? <InDevelopmentBadge /> : <ComingSoonBadge />}
      </div>

      <p
        className="text-base mt-4 max-w-2xl"
        style={{ fontFamily: 'var(--font-dm-sans)', color: c.muted }}
      >
        {description}
      </p>

      <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
            <span className="text-sm" style={{ color: c.bullet }}>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center gap-4">
        <span className="text-xs" style={{ color: c.subtle }}>{`Development progress`}</span>
        <div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ background: c.progressTrack }}
        >
          <AnimatedBar pct={pct} />
        </div>
        <span className="text-xs" style={{ color: c.subtle }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ── Theme-aware teal check icon ─────────────────────────────────────── */
const TealCheck = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M3 8.5l3.5 3.5 6.5-6.5" stroke={T} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Color palette builder ────────────────────────────────────────────── */
function buildColors(isDark: boolean) {
  return {
    bg:            isDark ? '#0A0F1E'                      : '#F8FAFB',
    text:          isDark ? '#F0F0F0'                      : '#0A0F1E',
    textMuted:     isDark ? 'rgba(240,240,240,0.58)'       : 'rgba(10,15,30,0.55)',
    muted:         isDark ? '#8892A4'                      : '#64748B',
    subtle:        isDark ? '#4B5563'                      : '#94A3B8',
    card:          isDark ? 'rgba(13,20,36,0.7)'           : 'rgba(255,255,255,0.9)',
    cardBorder:    isDark ? 'rgba(255,255,255,0.08)'       : 'rgba(0,0,0,0.08)',
    bullet:        isDark ? '#CBD5E1'                      : '#334155',
    navBg:         isDark ? 'rgba(10,15,30,0.88)'          : 'rgba(248,250,251,0.94)',
    navBorder:     isDark ? 'rgba(255,255,255,0.06)'       : 'rgba(0,0,0,0.08)',
    ghostBtn:      isDark ? 'rgba(255,255,255,0.12)'       : 'rgba(0,0,0,0.10)',
    ghostBtnHov:   isDark ? 'rgba(255,255,255,0.28)'       : 'rgba(0,0,0,0.20)',
    progressTrack: isDark ? '#1E293B'                      : '#E2E8F0',
    footerBg:      isDark ? '#080D18'                      : '#0F172A',
    footerLink:    'rgba(148,163,184,0.85)',
    footerMeta:    'rgba(148,163,184,0.7)',
    footerDivider: isDark ? 'rgba(255,255,255,0.05)'       : 'rgba(255,255,255,0.08)',
    sectionBg:     isDark ? 'rgba(255,255,255,0.018)'      : 'rgba(0,0,0,0.022)',
    sectionBorder: isDark ? 'rgba(255,255,255,0.06)'       : 'rgba(0,0,0,0.06)',
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   COMING SOON CONTENT (client component — theme-aware)
══════════════════════════════════════════════════════════════════════════ */
export function ComingSoonContent() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isDark = !mounted ? true : resolvedTheme !== 'light';
  const c = buildColors(isDark);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: c.bg, color: c.text, fontFamily: 'var(--font-dm-sans)' }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up   { animation: fadeUp 0.8s ease both; }
        .fade-up-1 { animation: fadeUp 0.8s ease 0.1s  both; }
        .fade-up-2 { animation: fadeUp 0.8s ease 0.2s  both; }
        .fade-up-3 { animation: fadeUp 0.8s ease 0.35s both; }
        ::selection { background: rgba(0,212,180,0.3); }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: c.navBg,
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${c.navBorder}`,
        }}
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-[5px] flex items-center justify-center shrink-0"
              style={{ background: T }}
            >
              <LogoMark />
            </div>
            <span
              className="text-[17px] font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-sora)', color: c.text }}
            >
              Suite Compile
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150"
              style={{ border: `1px solid ${c.ghostBtn}`, color: c.textMuted }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${T}60`;
                (e.currentTarget as HTMLElement).style.color = T;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = c.ghostBtn;
                (e.currentTarget as HTMLElement).style.color = c.textMuted;
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link
              href="/"
              className="text-sm px-4 py-2 rounded-lg transition-all duration-150"
              style={{ border: `1px solid ${c.ghostBtn}`, color: c.textMuted }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = c.ghostBtnHov;
                (e.currentTarget as HTMLElement).style.color = c.text;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = c.ghostBtn;
                (e.currentTarget as HTMLElement).style.color = c.textMuted;
              }}
            >
              Back to home
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="pt-32 pb-20 px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="fade-up text-xs font-medium tracking-widest uppercase text-teal-400 mb-4">
              WHAT&rsquo;S NEXT
            </p>
            <h1
              className="fade-up-1 text-5xl lg:text-6xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-sora)', color: c.text }}
            >
              The complete testing platform is being built
            </h1>
            <p
              className="fade-up-2 text-lg max-w-2xl mx-auto mt-6"
              style={{ fontFamily: 'var(--font-dm-sans)', color: c.muted }}
            >
              Suite Compile starts with AI-powered manual test case generation.
              Everything else your QA team needs is on its way.
            </p>
            <div className="fade-up-3 mt-10">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
                style={{ background: T, color: '#0A0F1E' }}
              >
                Try test case generation free →
              </Link>
            </div>
          </div>
        </section>

        {/* ── ROADMAP CARDS ─────────────────────────────────────────────── */}
        <section className="mt-24 px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <RoadmapCard
              icon={<WebAutomationIcon />}
              title="Web Automation"
              status="in-development"
              pct={60}
              description="Turn your manual test cases into automated checks that run against your live product — no engineering effort required."
              bullets={[
                'Run your entire test suite automatically without writing a single line of code',
                'Catch regressions the moment they appear, before they reach your users',
                'Tests run in parallel so your full suite completes in minutes, not hours',
                'Every run produces a screenshot and recording so failures are immediately clear',
                'Your design files are used as context so automation understands your UI natively',
                'Works against any web product regardless of how it was built',
              ]}
              c={c}
            />

            <RoadmapCard
              icon={<MobileAutomationIcon />}
              title="Mobile Automation"
              status="coming-soon"
              pct={20}
              description="Extend your test coverage to the apps your users actually carry with them — iOS and Android, covered from the same place you manage everything else."
              bullets={[
                'Test your mobile product with the same test cases you already wrote for web',
                'Catch mobile-specific issues — gestures, orientations, and network conditions',
                'Cover both iOS and Android without maintaining two separate test suites',
                'Run against multiple screen sizes and configurations simultaneously',
                'Get the same screenshot and replay evidence you get from web runs',
                'No separate tooling, no context switching — everything lives in Suite Compile',
              ]}
              c={c}
            />

            <RoadmapCard
              icon={<TestManagementIcon />}
              title="Test Management"
              status="coming-soon"
              pct={10}
              description="Go beyond writing test cases. Understand your coverage, track quality over time, and give your whole team visibility into the health of your product."
              bullets={[
                'See exactly which parts of your product are covered and which are not',
                'Track pass rates and failure trends across every release',
                'Give developers, product managers, and QA a shared view of quality',
                'Link test cases directly to the features and tickets they validate',
                'Get notified the moment a test fails so nothing slips through undetected',
                'Schedule runs so your suite checks your product around the clock automatically',
              ]}
              c={c}
            />
          </div>
        </section>

        {/* ── WHAT'S LIVE NOW ───────────────────────────────────────────── */}
        <section
          className="mt-32 py-20 px-6"
          style={{ background: c.sectionBg, borderTop: `1px solid ${c.sectionBorder}`, borderBottom: `1px solid ${c.sectionBorder}` }}
        >
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-medium tracking-widest uppercase text-teal-400 mb-4">
              AVAILABLE TODAY
            </p>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-sora)', color: c.text }}
            >
              Start with AI test case generation — free
            </h2>

            <div className="mt-10 grid lg:grid-cols-2 gap-12">
              <p
                className="text-base leading-relaxed"
                style={{ fontFamily: 'var(--font-dm-sans)', color: c.muted }}
              >
                Suite Compile&rsquo;s test case generator is live and free to use. Upload your PRD,
                describe your flows, and get structured manual test cases in seconds. No templates,
                no manual writing, no engineering dependency.
              </p>

              <ul className="space-y-3">
                {[
                  'AI-generated test cases from PRD, Figma, or plain text',
                  'RAG-powered chat refinement — ask for more edge cases anytime',
                  'Organised by projects and modules',
                  'Export to XML or copy directly to Google Sheets',
                  'Free plan available — no credit card required',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <TealCheck />
                    <span className="text-sm" style={{ color: c.bullet }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
                style={{ background: T, color: '#0A0F1E' }}
              >
                Get started free →
              </Link>
            </div>
          </div>
        </section>

        {/* ── EMAIL CAPTURE ─────────────────────────────────────────────── */}
        <section className="mt-24 mb-8 px-6">
          <div className="max-w-lg mx-auto text-center">
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-sora)', color: c.text }}
            >
              Get notified when automation launches
            </h2>
            <p className="mt-3" style={{ color: c.muted }}>
              One email when it goes live. No spam, no newsletter.
            </p>
            <WaitlistForm isDark={isDark} />
            <p className="text-xs mt-4" style={{ color: c.subtle }}>
              Join 200+ QA engineers on the waitlist
            </p>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer
        className="mt-24"
        style={{ background: c.footerBg, borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-6 h-6 rounded-[5px] flex items-center justify-center shrink-0"
                  style={{ background: T }}
                >
                  <LogoMark />
                </div>
                <span className="text-[17px] font-bold text-white" style={{ fontFamily: 'var(--font-sora)' }}>
                  Suite Compile
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: c.footerLink }}>
                The complete testing platform for modern teams.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-5 text-white" style={{ fontFamily: 'var(--font-sora)' }}>Product</p>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Changelog'].map((link) => (
                  <li key={link}>
                    <a href="/#features" className="text-sm transition-colors hover:text-white/90" style={{ color: c.footerLink }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold mb-5 text-white" style={{ fontFamily: 'var(--font-sora)' }}>Resources</p>
              <ul className="space-y-3">
                {['Docs', 'Blog', 'API'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm transition-colors hover:text-white/90" style={{ color: c.footerLink }}>
                      {link}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="/coming-soon" className="text-sm transition-colors hover:text-white/90" style={{ color: c.footerLink }}>
                    Coming Soon
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold mb-5 text-white" style={{ fontFamily: 'var(--font-sora)' }}>Company</p>
              <ul className="space-y-3">
                {['About', 'Contact', 'Privacy Policy'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm transition-colors hover:text-white/90" style={{ color: c.footerLink }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8"
            style={{ borderTop: c.footerDivider }}
          >
            <p className="text-xs" style={{ color: c.footerMeta }}>
            © 2026 Suite Compile. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              {['Twitter', 'GitHub', 'LinkedIn'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="text-xs transition-colors hover:text-white/80"
                  style={{ color: c.footerMeta }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
