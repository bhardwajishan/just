import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface OnboardingPayload {
  full_name: string;
  job_title: string;
  company_name: string;
  company_size: string;
  primary_use_case: string;
  how_did_you_hear: string;
  agreed_to_tos: boolean;
}

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

    const body = (await request.json()) as OnboardingPayload;

    if (!body.agreed_to_tos) {
      return NextResponse.json({ error: 'Must agree to terms of service' }, { status: 400 });
    }

    // Upsert profile
    const { error: profileError } = await (
      supabase.from('user_profiles' as never) as {
        upsert: (row: Record<string, unknown>, opts: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      }
    ).upsert(
      {
        id: user.id,
        full_name: body.full_name?.trim() || null,
        job_title: body.job_title || null,
        company_name: body.company_name?.trim() || null,
        company_size: body.company_size || null,
        primary_use_case: body.primary_use_case || null,
        how_did_you_hear: body.how_did_you_hear || null,
        onboarding_completed: true,
        plan: 'free',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      console.error('[/api/onboarding/complete] profile upsert:', profileError.message);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Seed usage counters (ignore conflict — row may already exist)
    await (
      supabase.from('usage_counters' as never) as {
        upsert: (row: Record<string, unknown>, opts: Record<string, unknown>) => Promise<{ error: unknown }>;
      }
    ).upsert(
      {
        user_id: user.id,
        projects_created: 0,
        modules_created: 0,
        test_cases_generated: 0,
        test_cases_today: 0,
        test_cases_date: new Date().toISOString().split('T')[0],
      },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/onboarding/complete]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
