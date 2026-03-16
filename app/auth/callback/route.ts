import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[/auth/callback] code exchange error:', exchangeError.message);
    return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`);
  }

  // Determine where to send the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  // Check if onboarding has been completed
  const { data: profile } = await supabase
    .from('user_profiles' as never)
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle();

  const onboardingDone = (profile as { onboarding_completed?: boolean } | null)
    ?.onboarding_completed === true;

  return NextResponse.redirect(
    onboardingDone ? `${origin}/dashboard/projects` : `${origin}/onboarding`
  );
}
