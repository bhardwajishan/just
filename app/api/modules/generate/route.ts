import { NextRequest, NextResponse } from 'next/server';
import { buildGenerationPrompt, callClaude } from '@/lib/anthropic';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserPlanAndUsage, incrementUsage, getDailyTestCaseCount } from '@/lib/usage';
import { PLAN_LIMITS, getLimitMessage } from '@/lib/plans';
import type { GenerateRequest, GenerateResponse, ApiError } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateResponse | ApiError>> {
  try {
    const body: GenerateRequest = await request.json();
    const { moduleData } = body;

    if (!moduleData) {
      return NextResponse.json({ error: 'moduleData is required' }, { status: 400 });
    }

    if (!moduleData.desired_count || moduleData.desired_count < 1) {
      return NextResponse.json({ error: 'desired_count must be at least 1' }, { status: 400 });
    }

    // ── Daily limit check ────────────────────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let effectiveCount = moduleData.desired_count;

    if (user) {
      const { plan } = await getUserPlanAndUsage(user.id);

      if (plan === 'free') {
        const todayCount = await getDailyTestCaseCount(user.id);

        if (todayCount >= PLAN_LIMITS.free.testCasesPerDay) {
          return NextResponse.json(
            {
              error: 'DAILY_LIMIT_REACHED',
              message: getLimitMessage('testCasesPerDay'),
            },
            { status: 403 }
          );
        }

        // Cap this generation so it doesn't exceed the remaining daily allowance
        const remaining = PLAN_LIMITS.free.testCasesPerDay - todayCount;
        if (effectiveCount > remaining) {
          effectiveCount = remaining;
        }
      }
    }

    // Normalise prd_texts — accept array or legacy single string
    const prdTexts: string[] | undefined =
      Array.isArray(moduleData.prd_texts) && moduleData.prd_texts.length > 0
        ? moduleData.prd_texts
        : moduleData.prd_text
        ? [moduleData.prd_text]
        : undefined;

    const prompt = buildGenerationPrompt({
      prd_texts: prdTexts,
      figma_description: moduleData.figma_description,
      flow_description: moduleData.flow_description,
      desired_count: effectiveCount,
      coverage_areas: moduleData.coverage_areas ?? [],
    });

    const testCases = await callClaude(prompt);

    // ── Track usage ──────────────────────────────────────────────────────────
    if (user) {
      await Promise.all([
        incrementUsage(user.id, 'test_cases_today', testCases.length),
        incrementUsage(user.id, 'test_cases_generated', testCases.length),
      ]);
    }

    return NextResponse.json({ testCases });
  } catch (err) {
    console.error('[/api/modules/generate]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
