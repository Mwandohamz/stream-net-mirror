export const PAYMENT_WINDOW_MS = 10 * 60 * 1000;

export function isExpiredPendingPayment(
  payment: { status?: string | null; expires_at?: string | null; created_at?: string | null },
  now = Date.now(),
): boolean {
  if (String(payment.status || "").toLowerCase() !== "pending") return false;
  const explicitExpiry = payment.expires_at ? Date.parse(payment.expires_at) : NaN;
  if (Number.isFinite(explicitExpiry)) return explicitExpiry <= now;
  const created = payment.created_at ? Date.parse(payment.created_at) : NaN;
  return Number.isFinite(created) && created + PAYMENT_WINDOW_MS <= now;
}

export function displayPaymentStatus(
  payment: { status?: string | null; expires_at?: string | null; created_at?: string | null },
): string {
  return isExpiredPendingPayment(payment) ? "expired" : String(payment.status || "unknown").toLowerCase();
}
