export const DEFAULT_PLAN_DAYS = 30;

export function planDurationDays(plan: { interval: string; interval_count: number }): number {
  const count = Number.isInteger(plan.interval_count) && plan.interval_count > 0 ? plan.interval_count : 1;
  if (plan.interval === "day") return count;
  if (plan.interval === "week") return 7 * count;
  if (plan.interval === "year") return 365 * count;
  return DEFAULT_PLAN_DAYS * count;
}

export function planPeriodEnd(from: Date, plan: { interval: string; interval_count: number }): Date {
  const end = new Date(from);
  if (plan.interval === "lifetime") end.setUTCFullYear(end.getUTCFullYear() + 100);
  else end.setTime(end.getTime() + planDurationDays(plan) * 86_400_000);
  return end;
}