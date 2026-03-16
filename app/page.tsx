'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { Sora, DM_Sans } from 'next/font/google';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

/* ── Coming Soon badge ───────────────────────────────────────────────────── */
const ComingSoonBadge = () => (
  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
    Coming soon
  </span>
);

/* ── Scroll-triggered fade-in wrapper ───────────────────────────────────── */
function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fallback = setTimeout(() => setVisible(true), delay + 800);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          clearTimeout(fallback);
          io.unobserve(el);
        }
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Inline SVG Icons ────────────────────────────────────────────────────── */
const UploadIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);
const SparkleIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);
const ChatIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);
const FolderIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v8.25m19.5 0A2.25 2.25 0 0119.5 16.5h-15a2.25 2.25 0 01-2.25-2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 18.409a2.25 2.25 0 01-1.07-1.916V14.25" />
  </svg>
);
const XmlIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);
const SheetsIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v1.5m1.5-1.5c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
  </svg>
);
const ClipboardIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7h8m0 0L7 3m4 4L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const LogoMark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M7 2l5 5-5 5" stroke="#0A0F1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckMark = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2.5 7.5l3 3 6-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted ? true : resolvedTheme !== 'light';
  const T = '#00D4B4';

  const c = {
    bg:           isDark ? '#0A0F1E'                      : '#F8FAFB',
    card:         isDark ? '#0D1424'                      : '#FFFFFF',
    cardAlt:      isDark ? '#111827'                      : '#EEF2F7',
    text:         isDark ? '#F0F0F0'                      : '#0A0F1E',
    textMuted:    isDark ? 'rgba(240,240,240,0.58)'       : 'rgba(10,15,30,0.55)',
    muted:        isDark ? '#8892A4'                      : '#64748B',
    secondary:    isDark ? '#CBD5E1'                      : '#334155',
    quote:        isDark ? '#E2E8F0'                      : '#1E293B',
    borderFaint:  isDark ? 'rgba(255,255,255,0.06)'       : 'rgba(0,0,0,0.06)',
    borderMid:    isDark ? 'rgba(255,255,255,0.09)'       : 'rgba(0,0,0,0.09)',
    border:       isDark ? 'rgba(255,255,255,0.14)'       : 'rgba(0,0,0,0.12)',
    logoText:     isDark ? 'rgba(255,255,255,0.22)'       : 'rgba(0,0,0,0.30)',
    navBg:        isDark ? 'rgba(10,15,30,0.88)'          : 'rgba(248,250,251,0.94)',
    hamburger:    isDark ? 'rgba(255,255,255,0.75)'       : 'rgba(10,15,30,0.7)',
    sectionBg:    isDark ? 'rgba(255,255,255,0.018)'      : 'rgba(0,0,0,0.022)',
    toggleActive: isDark
      ? { background: 'rgba(255,255,255,0.1)', color: '#F0F0F0' }
      : { background: 'rgba(0,0,0,0.08)',       color: '#0A0F1E' },
    toggleInact:  isDark ? 'rgba(240,240,240,0.4)'        : 'rgba(10,15,30,0.38)',
    ghostBtn:     isDark ? 'rgba(255,255,255,0.12)'       : 'rgba(0,0,0,0.10)',
    ghostBtnHov:  isDark ? 'rgba(255,255,255,0.28)'       : 'rgba(0,0,0,0.22)',
    metaText:     isDark ? 'rgba(255,255,255,0.45)'       : 'rgba(10,15,30,0.45)',
    // ── CTA banner ──────────────────────────────────────────────────────────
    ctaBg:        isDark
      ? 'linear-gradient(140deg, #071A14 0%, #05101A 100%)'
      : 'linear-gradient(140deg, #ECFDF5 0%, #EFF6FF 100%)',
    ctaSubtext:   isDark ? '#8892A4'                      : '#475569',
    ctaBtnBg:     isDark ? '#FFFFFF'                      : T,
    ctaBtnText:   '#0A0F1E',
    // ── Footer ──────────────────────────────────────────────────────────────
    footerBg:     isDark ? '#080D18'                      : '#F1F5F9',
    footerBorder: isDark ? 'rgba(255,255,255,0.06)'       : 'rgba(0,0,0,0.08)',
    footerHead:   isDark ? 'rgba(255,255,255,0.90)'       : '#0F172A',
    footerLink:   isDark ? 'rgba(148,163,184,0.85)'       : 'rgba(15,23,42,0.62)',
    footerMeta:   isDark ? 'rgba(148,163,184,0.70)'       : 'rgba(15,23,42,0.45)',
    footerDivider:isDark ? 'rgba(255,255,255,0.05)'       : 'rgba(0,0,0,0.08)',
  };
  const BG = c.bg;

  return (
    <div
      className={`${sora.variable} ${dmSans.variable} min-h-screen overflow-x-hidden`}
      style={{ background: c.bg, color: c.text, fontFamily: 'var(--font-dm-sans)' }}
    >
      {/* ─── Global keyframes & utility styles ──────────────────────── */}
      <style>{`
        @keyframes gridScroll {
          from { background-position: 0 0; }
          to   { background-position: 64px 64px; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-14px) rotate(-1deg); }
        }
        @keyframes heroUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-grid {
          background-image:
            linear-gradient(rgba(0,212,180,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,180,0.035) 1px, transparent 1px);
          background-size: 64px 64px;
          animation: gridScroll 24s linear infinite;
        }
        .card-float { animation: float 7s ease-in-out infinite; }
        .h1-anim  { animation: heroUp 0.8s ease both; }
        .sub-anim { animation: heroUp 0.8s ease 0.15s both; }
        .cta-anim { animation: heroUp 0.8s ease 0.3s  both; }
        .prf-anim { animation: heroUp 0.8s ease 0.45s both; }
        .cd-anim  { animation: heroUp 0.9s ease 0.2s  both; }
        .feat-card {
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .feat-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0,212,180,0.28) !important;
          box-shadow: 0 16px 48px rgba(0,212,180,0.06);
        }
        ::selection { background: rgba(0,212,180,0.3); }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          1. NAVBAR
      ══════════════════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'shadow-xl' : ''
        }`}
        style={
          scrolled
            ? { background: c.navBg, backdropFilter: 'blur(14px)', borderBottom: `1px solid ${c.borderFaint}` }
            : { background: 'transparent' }
        }
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-6 h-6 rounded-[5px] flex items-center justify-center shrink-0"
              style={{ background: T }}
            >
              <LogoMark />
            </div>
            <span
              className="text-[17px] font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Suite Compile
            </span>
          </a>

          {/* Center links — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Coming Soon', href: '/coming-soon' },
              { label: 'Pricing', href: '#pricing' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm transition-colors duration-150"
                style={{ color: c.textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = c.textMuted)}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right CTAs — desktop */}
          <div className="hidden md:flex items-center gap-3">
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
              href="/auth/login"
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
              Sign in
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-85"
              style={{ background: T, color: '#0A0F1E' }}
            >
              Get started free
            </Link>
          </div>

          {/* Hamburger — mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ border: `1px solid ${c.ghostBtn}`, color: c.textMuted }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              className="flex flex-col gap-[5px] p-1.5"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-[2px] transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} style={{ background: c.hamburger }} />
              <span className={`block w-5 h-[2px] transition-all duration-200 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} style={{ background: c.hamburger }} />
              <span className={`block w-5 h-[2px] transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} style={{ background: c.hamburger }} />
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        <div
          className="md:hidden transition-all duration-300 overflow-hidden"
          style={{
            maxHeight: menuOpen ? '320px' : '0',
            opacity: menuOpen ? 1 : 0,
            background: c.card,
            borderBottom: menuOpen ? `1px solid ${c.borderFaint}` : 'none',
          }}
        >
          <div className="px-6 py-5 space-y-1">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Coming Soon', href: '/coming-soon' },
              { label: 'Pricing', href: '#pricing' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="block py-2 text-sm"
                style={{ color: c.textMuted }}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <div className="pt-3 space-y-2" style={{ borderTop: `1px solid ${c.borderFaint}`, marginTop: '12px' }}>
              <Link
                href="/auth/login"
                className="block text-center py-2.5 text-sm rounded-lg"
                style={{ border: `1px solid ${c.border}`, color: c.textMuted }}
              >
                Sign in
              </Link>
              <Link
                href="/auth/login"
                className="block text-center py-2.5 text-sm font-semibold rounded-lg"
                style={{ background: T, color: '#0A0F1E' }}
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ══════════════════════════════════════════════════════════════
            2. HERO
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
          {/* Grid texture */}
          <div className="hero-grid absolute inset-0 pointer-events-none" />
          {/* Top radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 90% 55% at 50% -10%, ${T}0D 0%, transparent 65%)` }}
          />
          {/* Bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${c.bg})` }}
          />

          <div className="relative mx-auto max-w-6xl px-6 w-full">
            <div className="grid lg:grid-cols-2 gap-14 items-center">

              {/* ── Left: copy ── */}
              <div>
                {/* Eyebrow pill */}
                <div
                  className="h1-anim inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-7 text-xs font-medium"
                  style={{ background: `${T}14`, border: `1px solid ${T}30`, color: T }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T }} />
                  Powered by Claude AI · Free to start
                </div>

                <h1
                  className="h1-anim text-[38px] sm:text-5xl lg:text-[64px] font-extrabold leading-[1.06] tracking-tight mb-6"
                  style={{ fontFamily: 'var(--font-sora)' }}
                >
                  One tool to test{' '}
                  <span style={{ color: T }}>your entire</span>
                  <br className="hidden sm:block" />
                  {' '}product
                </h1>

                <p
                  className="sub-anim text-base sm:text-[19px] leading-relaxed mb-8"
                  style={{ color: c.muted, fontFamily: 'var(--font-dm-sans)' }}
                >
                  Suite Compile brings manual test case generation, web automation,
                  mobile automation, and test management into a single AI-powered platform.
                  Start with test cases — everything else is coming.
                </p>

                {/* CTAs */}
                <div className="cta-anim flex flex-wrap items-center gap-3 mb-8">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
                    style={{ background: T, color: '#0A0F1E' }}
                  >
                    Start for free <ArrowRight />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all"
                    style={{ border: `1px solid ${c.border}`, color: c.textMuted }}
                    onMouseEnter={(e) => { (e.currentTarget.style.borderColor = c.ghostBtnHov); (e.currentTarget.style.color = c.text); }}
                    onMouseLeave={(e) => { (e.currentTarget.style.borderColor = c.border); (e.currentTarget.style.color = c.textMuted); }}
                  >
                    See how it works
                  </a>
                </div>

                {/* Social proof */}
                <div className="prf-anim flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['#4F46E5', '#7C3AED', '#0EA5E9', '#10B981'].map((clr, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: clr, border: `2px solid ${BG}` }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: c.muted }}>
                    Built for QA engineers who move fast
                  </p>
                </div>
              </div>

              {/* ── Right: test case card mockup ── */}
              <div className="cd-anim relative flex justify-center lg:justify-end">
                <div
                  className="card-float w-full max-w-[520px] rounded-2xl overflow-hidden"
                  style={{
                    background: '#0D1424',
                    border: '1px solid rgba(255,255,255,0.09)',
                    boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px ${T}14`,
                    transform: 'rotate(-1deg)',
                  }}
                >
                  {/* Window chrome */}
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {['#ef4444', '#f59e0b', '#22c55e'].map((clr) => (
                          <div key={clr} className="w-3 h-3 rounded-full" style={{ background: clr, opacity: 0.6 }} />
                        ))}
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        Login Flow · 4 test cases
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${T}1E`, color: T }}
                    >
                      ✓ Generated
                    </span>
                  </div>

                  {/* Table header */}
                  <div
                    className="grid grid-cols-[60px_1fr_72px_80px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: '#8892A4', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}
                  >
                    <span>ID</span>
                    <span>Title</span>
                    <span>Priority</span>
                    <span>Type</span>
                  </div>

                  {/* Table rows */}
                  {[
                    { id: 'TC-001', title: 'Valid login with correct credentials', priority: 'High', type: 'Functional', pc: '#f87171', pb: 'rgba(248,113,113,0.12)', tc: '#60a5fa', tb: 'rgba(96,165,250,0.12)' },
                    { id: 'TC-002', title: 'Login with incorrect password shows error', priority: 'High', type: 'Negative', pc: '#f87171', pb: 'rgba(248,113,113,0.12)', tc: '#fb923c', tb: 'rgba(251,146,60,0.12)' },
                    { id: 'TC-003', title: 'Empty email field shows validation', priority: 'Medium', type: 'Edge Case', pc: '#fbbf24', pb: 'rgba(251,191,36,0.12)', tc: '#a78bfa', tb: 'rgba(167,139,250,0.12)' },
                    { id: 'TC-004', title: 'Session persists after tab close', priority: 'Low', type: 'Functional', pc: '#4ade80', pb: 'rgba(74,222,128,0.12)', tc: '#60a5fa', tb: 'rgba(96,165,250,0.12)' },
                  ].map((row, i) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[60px_1fr_72px_80px] items-center px-4 py-2.5 text-xs"
                      style={{
                        borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent',
                      }}
                    >
                      <span className="font-mono text-[11px]" style={{ color: '#8892A4' }}>{row.id}</span>
                      <span className="truncate pr-3" style={{ color: '#CBD5E1' }}>{row.title}</span>
                      <span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ color: row.pc, background: row.pb }}>{row.priority}</span>
                      </span>
                      <span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ color: row.tc, background: row.tb }}>{row.type}</span>
                      </span>
                    </div>
                  ))}

                  {/* Card footer */}
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-[11px]" style={{ color: '#8892A4' }}>Generated by Claude · just now</span>
                    <div className="flex items-center gap-2">
                      <button className="text-[11px] px-2.5 py-1 rounded-md" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}>
                        Export XML
                      </button>
                      <button className="text-[11px] px-2.5 py-1 rounded-md font-semibold" style={{ background: T, color: BG }}>
                        Confirm →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Glow orb */}
                <div
                  className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full blur-3xl pointer-events-none"
                  style={{ background: `${T}14` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            3. TRUST BAR
        ══════════════════════════════════════════════════════════════ */}
        <section style={{ background: c.sectionBg, borderTop: `1px solid ${c.borderFaint}`, borderBottom: `1px solid ${c.borderFaint}` }}>
          <FadeIn className="mx-auto max-w-6xl px-6 py-12">
            <p
              className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] mb-9"
              style={{ color: c.muted }}
            >
              One platform. Every testing need.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['Manual Test Cases', 'Web Automation', 'Mobile Automation', 'Test Management'].map((cap) => (
                <span
                  key={cap}
                  className="border border-teal-500/30 text-teal-400 bg-teal-500/5 px-4 py-1.5 rounded-full text-sm font-medium"
                >
                  {cap}
                </span>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4. HOW IT WORKS
        ══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-28">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T }}>Process</p>
              <h2
                className="text-3xl sm:text-[40px] font-bold"
                style={{ fontFamily: 'var(--font-sora)', letterSpacing: '-0.02em' }}
              >
                The complete testing workflow,
                <br />
                <span style={{ color: c.textMuted }}>in one place</span>
              </h2>
            </FadeIn>

            <div className="relative">
              {/* Dashed connector (desktop) */}
              <div
                className="hidden lg:block absolute top-[2.6rem] left-[calc(16.67%+3rem)] right-[calc(16.67%+3rem)] pointer-events-none"
                style={{ borderTop: `2px dashed ${T}40`, zIndex: 0 }}
              />

              <div className="grid sm:grid-cols-3 gap-5 relative z-10">
                {[
                  {
                    num: '01',
                    icon: <UploadIcon />,
                    title: 'Generate test cases',
                    badge: false,
                    desc: "Describe your feature, upload your PRD or Figma, and get structured manual test cases instantly via AI. No templates, no manual writing.",
                  },
                  {
                    num: '02',
                    icon: <GlobeIcon />,
                    title: 'Automate across platforms',
                    badge: true,
                    desc: "Convert any test case into a running automated check across web and mobile. Catch regressions before your users do — no engineering effort required.",
                  },
                  {
                    num: '03',
                    icon: <ClipboardIcon />,
                    title: 'Manage everything in one place',
                    badge: true,
                    desc: "Track coverage, view history, export reports, and manage your entire QA process from a single dashboard.",
                  },
                ].map((step, i) => (
                  <FadeIn key={step.num} delay={i * 110}>
                    <div
                      className="rounded-2xl p-7 h-full"
                      style={{ background: c.card, border: `1px solid ${c.borderMid}` }}
                    >
                      <div
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold mb-5"
                        style={{ background: `${T}18`, color: T, fontFamily: 'var(--font-sora)' }}
                      >
                        {step.num}
                      </div>
                      <div className="mb-4" style={{ color: T }}>{step.icon}</div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3
                          className="text-[15px] font-semibold"
                          style={{ fontFamily: 'var(--font-sora)', color: c.text }}
                        >
                          {step.title}
                        </h3>
                        {step.badge && <ComingSoonBadge />}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: c.muted }}>
                        {step.desc}
                      </p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            5. FEATURES GRID
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="features"
          className="py-28"
          style={{ background: c.sectionBg, borderTop: `1px solid ${c.borderFaint}`, borderBottom: `1px solid ${c.borderFaint}` }}
        >
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T }}>Features</p>
              <h2
                className="text-3xl sm:text-[40px] font-bold"
                style={{ fontFamily: 'var(--font-sora)', letterSpacing: '-0.02em' }}
              >
                Everything a QA team needs
              </h2>
            </FadeIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: <SparkleIcon />,
                  title: 'AI Test Generation',
                  badge: false,
                  desc: 'Upload a PRD, Figma design, or plain requirements. Get structured, comprehensive manual test cases generated in seconds.',
                },
                {
                  icon: <GlobeIcon />,
                  title: 'Web Automation',
                  badge: true,
                  desc: 'Run your entire test suite automatically against your live product. Catch regressions the moment they appear — no code required.',
                },
                {
                  icon: <PhoneIcon />,
                  title: 'Mobile Automation',
                  badge: true,
                  desc: 'Extend your test coverage to iOS and Android from the same place you manage everything else. One suite, every platform.',
                },
                {
                  icon: <ClipboardIcon />,
                  title: 'Test Management',
                  badge: true,
                  desc: 'Understand your coverage, track quality over time, and give your whole team a shared view of product health.',
                },
                {
                  icon: <XmlIcon />,
                  title: 'Smart Export',
                  badge: false,
                  desc: 'Export test cases as XML or copy directly to Google Sheets in one click. Works with any test management tool you already use.',
                },
                {
                  icon: <ChatIcon />,
                  title: 'RAG Chat Refinement',
                  badge: false,
                  desc: 'Ask for more edge cases, higher coverage, or scenario-specific tests. The AI refines based on your entire existing test suite.',
                },
              ].map((feat, i) => (
                <FadeIn key={feat.title} delay={i * 70}>
                  <div
                    className="feat-card rounded-2xl p-6 h-full"
                    style={{ background: c.card, border: `1px solid ${c.borderMid}` }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: `${T}14`, color: T }}
                    >
                      {feat.icon}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3
                        className="text-[15px] font-semibold"
                        style={{ fontFamily: 'var(--font-sora)', color: c.text }}
                      >
                        {feat.title}
                      </h3>
                      {feat.badge && <ComingSoonBadge />}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: c.muted }}>
                      {feat.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            6. QUOTE
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-28 overflow-hidden">
          <FadeIn className="mx-auto max-w-3xl px-6 text-center">
            <div className="relative">
              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-[160px] leading-none font-black select-none pointer-events-none"
                style={{ color: `${T}14`, fontFamily: 'var(--font-sora)', lineHeight: 0.8 }}
                aria-hidden="true"
              >
                &ldquo;
              </div>
              <blockquote className="relative">
                <p
                  className="text-xl sm:text-2xl lg:text-[28px] font-medium leading-relaxed mb-8"
                  style={{ fontFamily: 'var(--font-sora)', color: c.quote, letterSpacing: '-0.01em' }}
                >
                  &ldquo;Suite Compile is the first tool that actually covers our entire QA workflow.
                  We started with test cases and we can already see where the rest will slot in.&rdquo;
                </p>
                <footer className="flex flex-col items-center gap-3">
                  <div className="w-10 h-px" style={{ background: T }} />
                  <cite className="text-sm not-italic" style={{ color: c.muted }}>
                    — Head of QA, B2B SaaS startup
                  </cite>
                </footer>
              </blockquote>
            </div>
          </FadeIn>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            7. PRICING
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="pricing"
          className="py-28"
          style={{ background: c.sectionBg, borderTop: `1px solid ${c.borderFaint}`, borderBottom: `1px solid ${c.borderFaint}` }}
        >
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T }}>Pricing</p>
              <h2
                className="text-3xl sm:text-[40px] font-bold"
                style={{ fontFamily: 'var(--font-sora)', letterSpacing: '-0.02em' }}
              >
                Start free, scale when you need to
              </h2>
            </FadeIn>

            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Starter */}
              <FadeIn delay={0}>
                <div
                  className="rounded-2xl p-8 h-full flex flex-col"
                  style={{ background: c.card, border: `1px solid ${c.borderMid}` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: c.muted }}>Starter</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold" style={{ fontFamily: 'var(--font-sora)' }}>Free</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {[
                      'AI test case generation',
                      'RAG chat refinement',
                      'Projects & modules',
                      'XML & Sheets export',
                      'Up to 3 projects',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: c.secondary }}>
                        <CheckMark color={T} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/login"
                    className="block text-center py-2.5 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
                    style={{ border: `1px solid ${c.border}`, color: c.text }}
                  >
                    Get started free
                  </Link>
                </div>
              </FadeIn>

              {/* Pro */}
              <FadeIn delay={80}>
                <div
                  className="rounded-2xl p-8 h-full flex flex-col relative overflow-hidden"
                  style={{ background: c.card, border: `1px solid ${T}40`, boxShadow: `0 0 0 1px ${T}20` }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                    style={{ background: T }}
                  />
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: T }}>Pro</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${T}18`, color: T }}>
                      Most popular
                    </span>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold" style={{ fontFamily: 'var(--font-sora)' }}>$29</span>
                    <span className="text-sm ml-1" style={{ color: c.muted }}>/month</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {[
                      'Everything in Starter',
                      'Unlimited projects',
                      'Web automation (coming soon)',
                      'Mobile automation (coming soon)',
                      'Test management (coming soon)',
                      'Priority support',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: c.secondary }}>
                        <CheckMark color={T} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/login"
                    className="block text-center py-2.5 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
                    style={{ background: T, color: '#0A0F1E' }}
                  >
                    Get started free
                  </Link>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={120}>
              <p className="text-center text-sm mt-8" style={{ color: c.muted }}>
                Web automation, mobile automation, and test management are coming soon
                and will be available on the Pro plan.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            8. CTA BANNER
        ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-28 relative overflow-hidden"
          style={{ background: c.ctaBg }}
        >
          {/* Teal radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 70% 100% at 50% 50%, ${T}${isDark ? '10' : '18'} 0%, transparent 65%)` }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${T}${isDark ? '08' : '12'} 1px, transparent 1px), linear-gradient(90deg, ${T}${isDark ? '08' : '12'} 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }}
          />

          <FadeIn className="relative mx-auto max-w-2xl px-6 text-center">
            <h2
              className="text-3xl sm:text-[40px] font-bold mb-4"
              style={{ fontFamily: 'var(--font-sora)', letterSpacing: '-0.02em', color: c.text }}
            >
              Start testing smarter today
            </h2>
            <p className="text-base mb-10" style={{ color: c.ctaSubtext }}>
              Test case generation is live now. Automation and test management coming soon.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: c.ctaBtnBg, color: c.ctaBtnText }}
            >
              Create your free account →
            </Link>
          </FadeIn>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════
          9. FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer style={{ background: c.footerBg, borderTop: `1px solid ${c.footerBorder}` }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-6 h-6 rounded-[5px] flex items-center justify-center shrink-0"
                  style={{ background: T }}
                >
                  <LogoMark />
                </div>
                <span
                  className="text-[17px] font-bold"
                  style={{ fontFamily: 'var(--font-sora)', color: c.footerHead }}
                >
                  Suite Compile
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: c.footerLink }}>
                The complete testing platform for modern teams.
              </p>
            </div>

            {/* Link columns */}
            {[
              {
                title: 'Product',
                items: [
                  { label: 'Features', href: '#features' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Changelog', href: '#' },
                ],
              },
              {
                title: 'Resources',
                items: [
                  { label: 'Docs', href: '#' },
                  { label: 'Blog', href: '#' },
                  { label: 'API', href: '#' },
                  { label: 'Coming Soon', href: '/coming-soon' },
                ],
              },
              {
                title: 'Company',
                items: [
                  { label: 'About', href: '#' },
                  { label: 'Contact', href: '#' },
                  { label: 'Privacy Policy', href: '#' },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <p
                  className="text-sm font-semibold mb-5"
                  style={{ fontFamily: 'var(--font-sora)', color: c.footerHead }}
                >
                  {col.title}
                </p>
                <ul className="space-y-3">
                  {col.items.map(({ label, href }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-sm transition-colors"
                        style={{ color: c.footerLink }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = c.footerHead)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = c.footerLink)}
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8"
            style={{ borderTop: `1px solid ${c.footerDivider}` }}
          >
            <p className="text-xs" style={{ color: c.footerMeta }}>
              © 2026 Suite Compile. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              {['Twitter', 'GitHub', 'LinkedIn'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="text-xs transition-colors"
                  style={{ color: c.footerMeta }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = c.footerHead)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = c.footerMeta)}
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
