export const PLAN_LIMITS = {
  free: {
    projects: 1,
    modulesPerProject: 5,
    testCasesPerDay: 500,
  },
  pro: {
    projects: Infinity,
    modulesPerProject: Infinity,
    testCasesPerDay: Infinity,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export function isWithinLimit(
  plan: Plan,
  resource: keyof typeof PLAN_LIMITS.free,
  currentCount: number
): boolean {
  const limit = PLAN_LIMITS[plan][resource];
  return limit === Infinity || currentCount < limit;
}

export function getLimitMessage(resource: keyof typeof PLAN_LIMITS.free): string {
  const messages: Record<string, string> = {
    projects: `Free plan includes up to ${PLAN_LIMITS.free.projects} project.`,
    modulesPerProject: `Free plan includes up to ${PLAN_LIMITS.free.modulesPerProject} modules per project.`,
    testCasesPerDay: `Free plan allows up to ${PLAN_LIMITS.free.testCasesPerDay} test cases generated per day.`,
  };
  return messages[resource] ?? 'Upgrade to Pro for unlimited access.';
}
