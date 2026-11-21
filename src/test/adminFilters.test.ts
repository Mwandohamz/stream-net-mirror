import { describe, expect, it } from "vitest";
import { inDateRange, resolveRange } from "@/lib/dateRange";
import { isValidPromo, normalizePromo } from "@/pages/admin/Influencers";

describe("admin date filters", () => {
  it("last month covers the whole previous calendar month", () => {
    const { from, to } = resolveRange({ preset: "lastMonth" }, new Date(2026, 10, 21));
    expect(from?.getMonth()).toBe(9);
    expect(from?.getDate()).toBe(1);
    expect(to?.getDate()).toBe(31);
  });
  it("custom range includes the whole end day", () => {
    const r = { preset: "custom" as const, from: new Date(2026, 10, 1), to: new Date(2026, 10, 5) };
    expect(inDateRange(new Date(2026, 10, 5, 23, 0).toISOString(), r)).toBe(true);
    expect(inDateRange(new Date(2026, 10, 6, 0, 1).toISOString(), r)).toBe(false);
  });
});

describe("influencer promo codes", () => {
  it("are saved in capitals with dashes", () => expect(normalizePromo(" john doe ")).toBe("JOHN-DOE"));
  it("reject codes shorter than 3 characters", () => expect(isValidPromo("AB")).toBe(false));
});
