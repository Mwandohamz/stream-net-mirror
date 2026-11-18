import { describe, it, expect } from "vitest";
import { parseCachedMembership } from "@/lib/membershipCache";
import { publicWatchDestination } from "@/lib/watchIntent";

const now = Date.parse("2026-11-18T12:00:00Z");
const sub = (end: string) => ({ id: "s", user_id: "u", plan_id: null, status: "active", current_period_start: "2026-10-01T00:00:00Z", current_period_end: end, grace_days: 0, cancel_at: null });
const raw = (end: string, savedAt = now - 1000) => JSON.stringify({ userId: "u", email: null, isSubscriber: true, subscription: sub(end), savedAt });

describe("cached membership", () => {
  it("shows a still-valid membership as active instantly", () => {
    expect(parseCachedMembership(raw("2026-12-01T00:00:00Z"), now)?.isSubscriber).toBe(true);
  });
  it("never shows an expired membership as active", () => {
    expect(parseCachedMembership(raw("2026-11-17T00:00:00Z"), now)?.isSubscriber).toBe(false);
  });
  it("ignores snapshots older than 7 days", () => {
    expect(parseCachedMembership(raw("2026-12-30T00:00:00Z", now - 8 * 86_400_000), now)).toBeNull();
  });
});

describe("public watch flow", () => {
  it("sends visitors to create an account, then payment", () => expect(publicWatchDestination("guest")).toBe("/signup?next=%2Fpayment"));
  it("sends unpaid accounts to payment", () => expect(publicWatchDestination("unpaid")).toBe("/payment"));
  it("sends members to Watch", () => expect(publicWatchDestination("active")).toBe("/dashboard?tab=watch"));
});
