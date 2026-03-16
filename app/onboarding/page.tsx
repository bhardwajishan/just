'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  full_name: string;
  job_title: string;
  company_name: string;
  company_size: string;
  primary_use_case: string;
  how_did_you_hear: string;
  agreed_to_tos: boolean;
}

const INITIAL_FORM: FormData = {
  full_name: '',
  job_title: '',
  company_name: '',
  company_size: '',
  primary_use_case: '',
  how_did_you_hear: '',
  agreed_to_tos: false,
};

const TOTAL_STEPS = 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[#E8E8F0]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[#E8E8F0] outline-none focus:border-[#00D4B4]/60 focus:ring-1 focus:ring-[#00D4B4]/40 transition-colors"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0D1225] text-[#E8E8F0]">
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[#E8E8F0]">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[#E8E8F0] placeholder-white/25 outline-none focus:border-[#00D4B4]/60 focus:ring-1 focus:ring-[#00D4B4]/40 transition-colors"
      />
    </div>
  );
}

function RadioCard({
  value,
  label,
  icon,
  selected,
  onClick,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium transition-all ${
        selected
          ? 'border-[#00D4B4] bg-[#00D4B4]/10 text-[#00D4B4]'
          : 'border-white/10 bg-white/5 text-[#9898B0] hover:border-white/20 hover:text-[#E8E8F0]'
      }`}
    >
      <span className={`text-2xl ${selected ? 'text-[#00D4B4]' : 'text-[#9898B0]'}`}>{icon}</span>
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepVisible, setStepVisible] = useState(true);

  // Pre-fill name from Google user_metadata
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth/login');
        return;
      }
      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        '';
      if (name) setForm((f) => ({ ...f, full_name: name }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  }

  function animateToStep(next: number) {
    setStepVisible(false);
    setTimeout(() => {
      setStep(next);
      setStepVisible(true);
    }, 200);
  }

  function validateStep(): string {
    if (step === 1) {
      if (!form.full_name.trim()) return 'Full name is required.';
      if (!form.job_title) return 'Please select your job title.';
    }
    if (step === 2) {
      if (!form.company_name.trim()) return 'Company name is required.';
      if (!form.company_size) return 'Please select your company size.';
      if (!form.primary_use_case) return 'Please select your primary use case.';
    }
    if (step === 3) {
      if (!form.how_did_you_hear) return 'Please tell us how you heard about Q Pilot.';
      if (!form.agreed_to_tos) return 'You must agree to the Terms of Service to continue.';
    }
    return '';
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    if (step < TOTAL_STEPS) animateToStep(step + 1);
  }

  function handleBack() {
    if (step > 1) animateToStep(step - 1);
  }

  async function handleSubmit() {
    const err = validateStep();
    if (err) { setError(err); return; }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Onboarding failed');

      router.replace('/dashboard/projects');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: '#0A0F1E' }}
    >
      {/* Subtle grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#00D4B4 1px, transparent 1px), linear-gradient(90deg, #00D4B4 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-[520px]">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
            style={{ background: '#00D4B4', color: '#0A0F1E', fontFamily: 'var(--font-sora)' }}
          >
            Q
          </div>
          <span
            className="text-lg font-bold tracking-tight text-white"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            Q Pilot
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/10 p-8 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
        >
          {/* Step pills + progress */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <span
                    key={i}
                    className="rounded-full px-3 py-0.5 text-xs font-semibold transition-colors"
                    style={
                      i + 1 === step
                        ? { background: '#00D4B4', color: '#0A0F1E' }
                        : i + 1 < step
                        ? { background: 'rgba(0,212,180,0.2)', color: '#00D4B4' }
                        : { background: 'rgba(255,255,255,0.06)', color: '#9898B0' }
                    }
                  >
                    {i + 1 < step ? '✓' : `Step ${i + 1}`}
                  </span>
                ))}
              </div>
              <span className="text-xs text-[#9898B0]">
                {step} of {TOTAL_STEPS}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: '#00D4B4' }}
              />
            </div>
          </div>

          {/* Step content — fade + slide */}
          <div
            style={{
              transition: 'opacity 200ms ease, transform 200ms ease',
              opacity: stepVisible ? 1 : 0,
              transform: stepVisible ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            {/* ── Step 1 ───────────────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2
                    className="mb-1 text-xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-sora)' }}
                  >
                    Tell us about yourself
                  </h2>
                  <p className="text-sm text-[#9898B0]">
                    Help us personalise your experience.
                  </p>
                </div>
                <TextField
                  id="full_name"
                  label="Full name"
                  value={form.full_name}
                  onChange={(v) => update('full_name', v)}
                  placeholder="Jane Smith"
                />
                <SelectField
                  id="job_title"
                  label="Job title"
                  value={form.job_title}
                  onChange={(v) => update('job_title', v)}
                  options={['QA Engineer', 'QA Lead', 'Product Manager', 'Developer', 'Other']}
                />
              </div>
            )}

            {/* ── Step 2 ───────────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2
                    className="mb-1 text-xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-sora)' }}
                  >
                    About your company
                  </h2>
                  <p className="text-sm text-[#9898B0]">
                    We&apos;ll tailor recommendations to your team size.
                  </p>
                </div>
                <TextField
                  id="company_name"
                  label="Company name"
                  value={form.company_name}
                  onChange={(v) => update('company_name', v)}
                  placeholder="Acme Corp"
                />
                <SelectField
                  id="company_size"
                  label="Company size"
                  value={form.company_size}
                  onChange={(v) => update('company_size', v)}
                  options={['1-10', '11-50', '51-200', '201-1000', '1000+']}
                />
                {/* Primary use case — radio cards */}
                <div className="space-y-1.5">
                  <span className="block text-sm font-medium text-[#E8E8F0]">
                    Primary use case
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <RadioCard
                      value="Manual Testing"
                      label="Manual Testing"
                      icon="🧪"
                      selected={form.primary_use_case === 'Manual Testing'}
                      onClick={() => update('primary_use_case', 'Manual Testing')}
                    />
                    <RadioCard
                      value="Automation"
                      label="Automation"
                      icon="⚡"
                      selected={form.primary_use_case === 'Automation'}
                      onClick={() => update('primary_use_case', 'Automation')}
                    />
                    <RadioCard
                      value="Both"
                      label="Both"
                      icon="🔄"
                      selected={form.primary_use_case === 'Both'}
                      onClick={() => update('primary_use_case', 'Both')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3 ───────────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2
                    className="mb-1 text-xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-sora)' }}
                  >
                    Almost there!
                  </h2>
                  <p className="text-sm text-[#9898B0]">
                    One last thing and you&apos;re ready to go.
                  </p>
                </div>
                <SelectField
                  id="how_did_you_hear"
                  label="How did you hear about Q Pilot?"
                  value={form.how_did_you_hear}
                  onChange={(v) => update('how_did_you_hear', v)}
                  options={['Google Search', 'LinkedIn', 'Friend/Colleague', 'Twitter/X', 'Other']}
                />
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.agreed_to_tos}
                      onChange={(e) => update('agreed_to_tos', e.target.checked)}
                    />
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        form.agreed_to_tos
                          ? 'border-[#00D4B4] bg-[#00D4B4]'
                          : 'border-white/20 bg-transparent'
                      }`}
                    >
                      {form.agreed_to_tos && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="#0A0F1E"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-[#9898B0]">
                    I agree to the{' '}
                    <a href="#" className="text-[#00D4B4] hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-[#00D4B4] hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-[#9898B0] transition-colors hover:text-[#E8E8F0]"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                style={{ background: '#00D4B4', color: '#0A0F1E' }}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: '#00D4B4', color: '#0A0F1E' }}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Start using Q Pilot →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
