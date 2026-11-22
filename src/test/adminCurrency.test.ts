import { describe, expect, it } from "vitest";
import {
  arrFromMrr,
  formatPaymentMoney,
  paymentInCurrency,
  paymentUsd,
  sumPaymentAmounts,
} from "@/lib/adminCurrency";

describe("admin historical payment currency", () => {
  it("uses the recorded USD and original ZMW values for a 50.23 ZMW payment", () => {
    const payment = { amount: 50.23, currency: "ZMW", amount_usd: 2.44, fx_rate: 20.584702 };
    expect(paymentInCurrency(payment, "USD")).toBe(2.44);
    expect(paymentInCurrency(payment, "ZMW")).toBe(50.23);
  });

  it("derives USD from the payment's own locked rate when amount_usd is absent", () => {
    expect(paymentUsd({ amount: 100, currency: "ZMW", fx_rate: 20 })).toBe(5);
  });

  it("keeps legacy ZMW available but marks its USD conversion unavailable", () => {
    const payment = { amount: 140, currency: "ZMW", amount_usd: null, fx_rate: null };
    expect(formatPaymentMoney(payment, "USD")).toBe("Rate unavailable");
    expect(formatPaymentMoney(payment, "ZMW")).toBe("ZMW 140.00");
  });

  it("does not mistake another currency's FX rate for a ZMW rate", () => {
    const payment = { amount: 300, currency: "KES", amount_usd: 2.31, fx_rate: 129.87 };
    expect(paymentInCurrency(payment, "USD")).toBe(2.31);
    expect(paymentInCurrency(payment, "ZMW")).toBeNull();
  });

  it("totals only convertible amounts and reports excluded payments", () => {
    const payments = [
      { amount: 50.23, currency: "ZMW", amount_usd: 2.44, fx_rate: 20.584702 },
      { amount: 140, currency: "ZMW", amount_usd: null, fx_rate: null },
    ];
    expect(sumPaymentAmounts(payments, "USD")).toEqual({ amount: 2.44, missing: 1, available: 1 });
    expect(sumPaymentAmounts(payments, "ZMW")).toEqual({ amount: 190.23, missing: 0, available: 2 });
  });

  it("calculates ARR as exactly twelve times MRR", () => {
    expect(arrFromMrr(4.88)).toBe(58.56);
  });
});
