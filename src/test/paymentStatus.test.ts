import { describe, expect, it } from "vitest";
import { displayPaymentStatus, isExpiredPendingPayment, PAYMENT_WINDOW_MS } from "@/lib/paymentStatus";

describe("payment expiry", () => {
  const now = Date.parse("2026-11-22T04:20:00Z");

  it("closes a pending payment after its recorded ten-minute expiry", () => {
    const payment = { status: "pending", expires_at: "2026-11-22T04:19:59Z", created_at: "2026-11-22T04:09:59Z" };
    expect(isExpiredPendingPayment(payment, now)).toBe(true);
    expect(displayPaymentStatus(payment)).toBe("expired");
  });

  it("keeps a pending payment open inside its ten-minute window", () => {
    expect(isExpiredPendingPayment({ status: "pending", expires_at: "2026-11-22T04:20:01Z" }, now)).toBe(false);
  });

  it("expires legacy pending payments ten minutes after creation", () => {
    const createdAt = new Date(now - PAYMENT_WINDOW_MS).toISOString();
    expect(isExpiredPendingPayment({ status: "pending", expires_at: null, created_at: createdAt }, now)).toBe(true);
  });

  it("never changes a completed payment to expired", () => {
    expect(displayPaymentStatus({ status: "completed", expires_at: "2026-11-22T04:19:59Z" })).toBe("completed");
  });
});
