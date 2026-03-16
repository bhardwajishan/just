import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserPlanAndUsage } from '@/lib/usage';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, usage } = await getUserPlanAndUsage(user.id);
    return NextResponse.json({ plan, usage });
  } catch (err) {
    console.error('[/api/user/usage]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
