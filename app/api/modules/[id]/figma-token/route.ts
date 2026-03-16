import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { encrypt, decrypt } from '@/lib/crypto';

export const runtime = 'nodejs';

interface RouteParams {
  params: { id: string };
}

/** Verify the authenticated user owns the module. Returns the module row or null. */
async function getOwnedModule(moduleId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { user: null, module: null, supabase };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('modules') as any)
    .select('id, figma_access_token, project_id, projects!inner(user_id)')
    .eq('id', moduleId)
    .single();

  if (!data) return { user, module: null, supabase };

  const row = data as {
    id: string;
    figma_access_token: string | null;
    projects: { user_id: string };
  };

  if (row.projects.user_id !== user.id) return { user, module: null, supabase };

  return { user, module: row, supabase };
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { module } = await getOwnedModule(params.id);

  if (!module) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!module.figma_access_token) {
    return NextResponse.json({ hasToken: false });
  }

  const decrypted = decrypt(module.figma_access_token);
  const last4 = decrypted.length >= 4 ? decrypted.slice(-4) : '****';

  return NextResponse.json({
    hasToken: true,
    tokenPreview: `••••••${last4}`,
  });
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { module, supabase } = await getOwnedModule(params.id);

  if (!module) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { token } = body as { token?: string };

  if (!token?.trim()) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const encrypted = encrypt(token.trim());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('modules') as any)
    .update({ figma_access_token: encrypted })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { module, supabase } = await getOwnedModule(params.id);

  if (!module) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('modules') as any)
    .update({ figma_access_token: null })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
