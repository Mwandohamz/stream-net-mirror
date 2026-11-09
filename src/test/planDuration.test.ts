import { describe, expect, it } from "vitest";
import { planDurationDays, planPeriodEnd } from "../../supabase/functions/_shared/planDuration";

describe("exact plan access days", () => {
  it("defaults monthly access to exactly 30 days, not 33", () => {
    const start = new Date("2026-01-31T12:00:00Z");
    expect(planDurationDays({ interval: "month", interval_count: 1 })).toBe(30);
    expect(planPeriodEnd(start, { interval: "month", interval_count: 1 }).toISOString()).toBe("2026-03-02T12:00:00.000Z");
  });
  it("uses the admin's exact custom number of days", () => {
    expect(planPeriodEnd(new Date("2026-11-09T00:00:00Z"), { interval: "day", interval_count: 45 }).toISOString()).toBe("2026-12-24T00:00:00.000Z");
  });
  it("preserves lifetime access", () => {
    expect(planPeriodEnd(new Date("2026-11-09T00:00:00Z"), { interval: "lifetime", interval_count: 1 }).getUTCFullYear()).toBe(2126);
  });
});