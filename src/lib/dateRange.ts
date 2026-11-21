export type RangePreset = "all" | "today" | "7d" | "30d" | "month" | "lastMonth" | "year" | "custom";
export interface DateRange { preset: RangePreset; from?: Date; to?: Date }

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/** Resolves a preset into concrete start/end dates (local time). */
export function resolveRange(range: DateRange, now = new Date()): { from?: Date; to?: Date } {
  switch (range.preset) {
    case "today": return { from: startOfDay(now), to: endOfDay(now) };
    case "7d": return { from: startOfDay(new Date(now.getTime() - 6 * 86_400_000)), to: endOfDay(now) };
    case "30d": return { from: startOfDay(new Date(now.getTime() - 29 * 86_400_000)), to: endOfDay(now) };
    case "month": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
    case "lastMonth": return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)) };
    case "year": return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(now) };
    case "custom": return { from: range.from ? startOfDay(range.from) : undefined, to: range.to ? endOfDay(range.to) : range.from ? endOfDay(range.from) : undefined };
    default: return {};
  }
}

export function inDateRange(iso: string | null | undefined, range: DateRange) {
  const { from, to } = resolveRange(range);
  if (!from && !to) return true;
  if (!iso) return false;
  const t = Date.parse(iso);
  return (!from || t >= from.getTime()) && (!to || t <= to.getTime());
}

export function rangeParams(range: DateRange) {
  const { from, to } = resolveRange(range);
  return { from: from?.toISOString(), to: to?.toISOString() };
}
