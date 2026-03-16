import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { SaveRequest, SaveResponse, ApiError } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SaveResponse | ApiError>> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SaveRequest = await request.json();
    const { testCases, chatMessage } = body;

    if (!Array.isArray(testCases)) {
      return NextResponse.json({ error: 'testCases must be an array' }, { status: 400 });
    }

    const moduleId = params.id;

    // Verify the module belongs to the authenticated user (RLS enforces this)
    const { error: moduleError } = await supabase
      .from('modules')
      .select('id')
      .eq('id', moduleId)
      .single();

    if (moduleError) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Upsert all test cases
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
        version: tc.version ?? 1,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upsertError } = await (supabase.from('test_cases') as any).upsert(rows, {
        onConflict: 'id,module_id',
      });

      if (upsertError) {
        console.error('[save] upsert error', upsertError);
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
    }

    // Save chat message if provided
    if (chatMessage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: chatError } = await (supabase.from('chat_messages') as any).insert({
        module_id: moduleId,
        role: chatMessage.role,
        content: chatMessage.content,
      });

      if (chatError) {
        console.error('[save] chat insert error', chatError);
      }
    }

    // Update module status and updated_at
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('modules') as any)
      .update({ status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', moduleId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/modules/[id]/save]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
