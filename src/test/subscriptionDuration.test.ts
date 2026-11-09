import { describe, expect, it, vi } from "vitest";
import { activateSubscriptionForPayment } from "../../supabase/functions/_shared/subscription";

describe("subscription activation duration", () => {
  it("renews for exactly the configured days with zero implicit grace", async () => {
    const update = vi.fn();
    const start = "2027-01-01T00:00:00Z";
    const db = { from: (table: string) => {
      const result = table === "payments" ? { id: "p", user_id: "u", plan_id: "plan" }
        : table === "plans" ? { id: "plan", interval: "day", interval_count: 30 }
        : { id: "s", current_period_end: start, grace_days: 3 };
      const builder: any = {
        select: () => builder, eq: () => builder,
        maybeSingle: async () => ({ data: result }),
        update: (payload: unknown) => { if (table === "subscriptions") update(payload); return builder; },
      };
      return builder;
    }};
    await activateSubscriptionForPayment(db, "deposit");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ grace_days: 0, current_period_end: "2027-01-31T00:00:00.000Z" }));
  });
});