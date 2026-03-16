import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  const origin = request.headers.get('origin') ?? 'http://localhost:3000';
  return NextResponse.redirect(`${origin}/`);
}
