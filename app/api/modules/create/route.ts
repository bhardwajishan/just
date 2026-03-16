import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserPlanAndUsage, incrementUsage } from '@/lib/usage';
import { PLAN_LIMITS, getLimitMessage } from '@/lib/plans';
import type { ApiError } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ id: string } | ApiError>> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      project_id,
      name,
      prd_text,
      figma_url,
      figma_description,
      flow_description,
      desired_count,
      coverage_areas,
    } = body;

    if (!project_id || !name?.trim()) {
      return NextResponse.json({ error: 'project_id and name are required' }, { status: 400 });
    }

    // Verify project ownership (RLS enforces this, but explicit check gives better error)
    const { error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // ── Plan limit check: modules per project ────────────────────────────────
    const { plan } = await getUserPlanAndUsage(user.id);

    if (plan === 'free') {
      const { count } = await supabase
        .from('modules' as never)
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project_id)
        .then((r: { count: number | null }) => r);

      if ((count ?? 0) >= PLAN_LIMITS.free.modulesPerProject) {
        return NextResponse.json(
          {
            error: 'MODULE_LIMIT_REACHED',
            message: getLimitMessage('modulesPerProject'),
          },
          { status: 403 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: moduleRaw, error: insertError } = await (supabase.from('modules') as any)
      .insert({
        project_id,
        name: name.trim(),
        prd_text: prd_text || null,
        figma_url: figma_url || null,
        figma_description: figma_description || null,
        flow_description: flow_description || null,
        desired_count: desired_count ?? 10,
        coverage_areas: coverage_areas ?? [],
        status: 'draft',
      })
      .select('id')
      .single();

    if (insertError || !moduleRaw) {
      return NextResponse.json(
        { error: insertError?.message ?? 'Insert failed' },
        { status: 500 }
      );
    }

    // ── Track usage ──────────────────────────────────────────────────────────
    await incrementUsage(user.id, 'modules_created');

    return NextResponse.json({ id: (moduleRaw as { id: string }).id });
  } catch (err) {
    console.error('[/api/modules/create]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
