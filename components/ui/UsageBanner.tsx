'use client';

import { useEffect, useState } from 'react';
import { PLAN_LIMITS } from '@/lib/plans';
import type { UsageRow } from '@/lib/usage';

interface UsageBannerProps {
  userId: string;
}

interface ApiResponse {
  plan: 'free' | 'pro';
  usage: UsageRow;
}

interface BarItem {
  label: string;
  sublabel?: string;
  value: number;
  max: number | typeof Infinity;
}

function UsageBar({ label, sublabel, value, max }: BarItem) {
  const isInfinite = max === Infinity;
  const pct = isInfinite ? 0 : Math.min((value / (max as number)) * 100, 100);
  const isAmber = !isInfinite && pct >= 80 && pct < 100;
  const isRed = !isInfinite && pct >= 100;

  const trackColor = isRed ? 'bg-red-500' : isAmber ? 'bg-amber-400' : 'bg-[#00D4B4]';
  const fractionColor = isRed ? 'text-red-400' : isAmber ? 'text-amber-300' : 'text-[#9898B0]';
  const maxLabel = isInfinite ? '∞' : String(max);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#C8C8D8]">
          {label}
          {sublabel && (
            <span className="ml-1 text-[10px] text-[#9898B0]">({sublabel})</span>
          )}
        </span>
        <span className={fractionColor}>
          {value}
          <span className="text-[#9898B0]">/{maxLabel}</span>
          {isRed && (
            <a href="/pricing" className="ml-1.5 font-semibold text-red-400 hover:underline">
              Upgrade
            </a>
          )}
        </span>
      </div>
      {!isInfinite && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${trackColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function UsageBanner({ userId: _userId }: UsageBannerProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/usage')
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((d) => setData(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 h-3 w-20 rounded bg-white/10" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-2 rounded bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { plan, usage } = data;
  const isFree = plan === 'free';

  const bars: BarItem[] = [
    {
      label: 'Projects',
      value: usage.projects_created,
      max: isFree ? PLAN_LIMITS.free.projects : Infinity,
    },
    {
      label: 'Modules',
      value: usage.modules_created,
      max: isFree
        ? PLAN_LIMITS.free.projects * PLAN_LIMITS.free.modulesPerProject
        : Infinity,
    },
    {
      label: 'Test cases today',
      sublabel: 'resets daily',
      value: usage.test_cases_today,
      max: isFree ? PLAN_LIMITS.free.testCasesPerDay : Infinity,
    },
  ];

  return (
    <div
      className="rounded-xl border border-white/10 p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#9898B0]">
          Usage
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={
            isFree
              ? { background: 'rgba(255,255,255,0.08)', color: '#C8C8D8' }
              : { background: 'rgba(0,212,180,0.15)', color: '#00D4B4' }
          }
        >
          {isFree ? 'Free Plan' : 'Pro Plan'}
        </span>
      </div>

      {/* Bars */}
      <div className="space-y-2.5">
        {bars.map((bar) => (
          <UsageBar key={bar.label} {...bar} />
        ))}
      </div>

      {/* Upgrade link */}
      {isFree && (
        <a
          href="/pricing"
          className="block text-center text-xs font-medium transition-colors"
          style={{ color: '#00D4B4' }}
        >
          Upgrade to Pro →
        </a>
      )}
    </div>
  );
}
