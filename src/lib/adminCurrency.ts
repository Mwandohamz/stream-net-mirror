import { formatCurrencyAmount } from "@/lib/currency";

export type AdminDisplayCurrency = "USD" | "ZMW";

export interface PaymentMoney {
  amount: number | string | null;
  currency: string | null;
  amount_usd?: number | string | null;
  fx_rate?: number | string | null;
}

const finiteAmount = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const positiveRate = (value: unknown): number | null => {
  const rate = finiteAmount(value);
  return rate !== null && rate > 0 ? rate : null;
};

export function paymentUsd(payment: PaymentMoney): number | null {
  const recordedUsd = finiteAmount(payment.amount_usd);
  if (recordedUsd !== null) return recordedUsd;

  const amount = finiteAmount(payment.amount);
  const rate = positiveRate(payment.fx_rate);
  return amount !== null && rate !== null ? amount / rate : null;
}

/**
 * Converts only when the payment itself contains the required historical rate.
 * A local-currency FX rate is never reused as though it were a ZMW rate.
 */
export function paymentInCurrency(
  payment: PaymentMoney,
  target: AdminDisplayCurrency,
): number | null {
  const amount = finiteAmount(payment.amount);
  const originalCurrency = String(payment.currency || "ZMW").toUpperCase();
  if (amount !== null && originalCurrency === target) return amount;
  if (target === "USD") return paymentUsd(payment);

  // Cross-currency ZMW conversion needs a recorded ZMW-per-USD rate. Other
  // countries' historical rates cannot accurately supply that conversion.
  return null;
}

export function sumPaymentAmounts(
  payments: PaymentMoney[],
  currency: AdminDisplayCurrency,
) {
  let amount = 0;
  let missing = 0;
  let available = 0;

  for (const payment of payments) {
    const converted = paymentInCurrency(payment, currency);
    if (converted === null) missing += 1;
    else {
      amount += converted;
      available += 1;
    }
  }

  return { amount: Math.round(amount * 100) / 100, missing, available };
}

export function formatPaymentMoney(
  payment: PaymentMoney,
  currency: AdminDisplayCurrency,
): string {
  const amount = paymentInCurrency(payment, currency);
  return amount === null ? "Rate unavailable" : formatCurrencyAmount(amount, currency);
}

export function formatPaymentTotal(
  payments: PaymentMoney[],
  currency: AdminDisplayCurrency,
): string {
  return formatCurrencyAmount(sumPaymentAmounts(payments, currency).amount, currency);
}

export function missingRateLabel(missing: number, singular = "payment"): string {
  if (!missing) return "";
  return `${missing} ${singular}${missing === 1 ? "" : "s"} without a historical rate`;
}

export function arrFromMrr(mrr: number): number {
  return Math.round(mrr * 12 * 100) / 100;
}
