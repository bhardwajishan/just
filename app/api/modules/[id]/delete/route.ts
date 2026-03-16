import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moduleId = params.id;

    // Verify the module exists and belongs to this user (RLS enforces ownership)
    const { error: fetchError } = await supabase
      .from('modules')
      .select('id')
      .eq('id', moduleId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Cascade deletes test_cases and chat_messages via FK ON DELETE CASCADE
    const { error: deleteError } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/modules/[id]/delete]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
