import { createServiceRoleClient } from './supabase';

export interface UsageRow {
  projects_created: number;
  modules_created: number;
  test_cases_generated: number; // lifetime total
  test_cases_today: number;     // resets each calendar day
  test_cases_date: string | null; // YYYY-MM-DD of last write to test_cases_today
}

export interface PlanAndUsage {
  plan: 'free' | 'pro';
  usage: UsageRow;
}

const DEFAULT_USAGE: UsageRow = {
  projects_created: 0,
  modules_created: 0,
  test_cases_generated: 0,
  test_cases_today: 0,
  test_cases_date: null,
};

/**
 * Fetches the user's plan and usage counters from the database.
 * Uses the service-role client so it can be called from any server context.
 */
export async function getUserPlanAndUsage(userId: string): Promise<PlanAndUsage> {
  const supabase = createServiceRoleClient();

  const [profileResult, usageResult] = await Promise.all([
    supabase
      .from('user_profiles' as never)
      .select('plan')
      .eq('id', userId)
      .maybeSingle<{ plan: string }>(),
    supabase
      .from('usage_counters' as never)
      .select(
        'projects_created, modules_created, test_cases_generated, test_cases_today, test_cases_date'
      )
      .eq('user_id', userId)
      .maybeSingle<UsageRow>(),
  ]);

  const plan = (profileResult.data?.plan as 'free' | 'pro' | undefined) ?? 'free';
  const usage: UsageRow = usageResult.data ?? { ...DEFAULT_USAGE };

  return { plan, usage };
}

type UsageField = 'projects_created' | 'modules_created' | 'test_cases_generated' | 'test_cases_today';

/**
 * Increments a specific usage counter for the user.
 * Creates the row if it doesn't exist yet.
 */
export async function incrementUsage(
  userId: string,
  field: UsageField,
  amount: number = 1
): Promise<void> {
  const supabase = createServiceRoleClient();

  // Ensure row exists
  await (
    supabase.from('usage_counters' as never) as {
      upsert: (row: Record<string, unknown>, opts: Record<string, unknown>) => Promise<unknown>;
    }
  ).upsert(
    { user_id: userId, ...DEFAULT_USAGE },
    { onConflict: 'user_id', ignoreDuplicates: true }
  );

  const { data: current } = await supabase
    .from('usage_counters' as never)
    .select(field)
    .eq('user_id', userId)
    .maybeSingle<Record<string, number>>();

  const currentVal = current?.[field] ?? 0;

  await supabase
    .from('usage_counters' as never)
    .update({ [field]: currentVal + amount, updated_at: new Date().toISOString() } as never)
    .eq('user_id', userId);
}

/**
 * Returns how many test cases this user has generated today.
 * Automatically resets the daily counter if the stored date is not today.
 */
export async function getDailyTestCaseCount(userId: string): Promise<number> {
  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Ensure row exists
  await (
    supabase.from('usage_counters' as never) as {
      upsert: (row: Record<string, unknown>, opts: Record<string, unknown>) => Promise<unknown>;
    }
  ).upsert(
    { user_id: userId, ...DEFAULT_USAGE },
    { onConflict: 'user_id', ignoreDuplicates: true }
  );

  const { data } = await supabase
    .from('usage_counters' as never)
    .select('test_cases_today, test_cases_date')
    .eq('user_id', userId)
    .maybeSingle<{ test_cases_today: number; test_cases_date: string | null }>();

  // If it's a new day, reset the daily counter
  if (!data || data.test_cases_date !== today) {
    await supabase
      .from('usage_counters' as never)
      .update({
        test_cases_today: 0,
        test_cases_date: today,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('user_id', userId);
    return 0;
  }

  return data.test_cases_today ?? 0;
}
