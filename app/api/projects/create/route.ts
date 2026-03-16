import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserPlanAndUsage, incrementUsage } from '@/lib/usage';
import { PLAN_LIMITS, getLimitMessage } from '@/lib/plans';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      name: string;
      description?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // ── Plan limit check ─────────────────────────────────────────────────────
    const { plan, usage } = await getUserPlanAndUsage(user.id);

    if (plan === 'free' && usage.projects_created >= PLAN_LIMITS.free.projects) {
      return NextResponse.json(
        {
          error: 'PROJECT_LIMIT_REACHED',
          message: getLimitMessage('projects'),
        },
        { status: 403 }
      );
    }

    // ── Insert ───────────────────────────────────────────────────────────────
    const { data: projectRaw, error: insertError } = await (
      supabase.from('projects' as never) as {
        insert: (row: Record<string, unknown>) => {
          select: (cols: string) => {
            single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
          };
        };
      }
    )
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
      })
      .select('id')
      .single();

    if (insertError || !projectRaw) {
      return NextResponse.json(
        { error: insertError?.message ?? 'Insert failed' },
        { status: 500 }
      );
    }

    // ── Track usage ──────────────────────────────────────────────────────────
    await incrementUsage(user.id, 'projects_created');

    return NextResponse.json({ id: projectRaw.id });
  } catch (err) {
    console.error('[/api/projects/create]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
