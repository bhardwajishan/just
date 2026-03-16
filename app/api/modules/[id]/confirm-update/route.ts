import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { ConfirmUpdateRequest, ConfirmUpdateResponse, ApiError } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ConfirmUpdateResponse | ApiError>> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ConfirmUpdateRequest = await request.json();
    const { testCases } = body;

    if (!Array.isArray(testCases)) {
      return NextResponse.json({ error: 'testCases must be an array' }, { status: 400 });
    }

    const moduleId = params.id;

    // Verify ownership (RLS enforces this)
    const { error: moduleError } = await supabase
      .from('modules')
      .select('id')
      .eq('id', moduleId)
      .single();

    if (moduleError) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Delete existing test cases and replace with new set
    const { error: deleteError } = await supabase
      .from('test_cases')
      .delete()
      .eq('module_id', moduleId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (testCases.length > 0) {
      const rows = testCases.map((tc) => ({
        id: tc.id,
        module_id: moduleId,
        title: tc.title,
        preconditions: tc.preconditions ?? [],
        steps: tc.steps ?? [],
        expected_result: tc.expected_result,
        priority: tc.priority,
        type: tc.type,
        version: (tc.version ?? 1) + 1,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from('test_cases') as any).insert(rows);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Update module status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('modules') as any)
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', moduleId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/modules/[id]/confirm-update]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
