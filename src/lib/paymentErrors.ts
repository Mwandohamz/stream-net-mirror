/**
 * Turns pawaPay failure codes into wording a customer understands.
 * Used by the payment screen and mirrored into the admin payment record.
 */
const MAP: Record<string, string> = {
  PAYER_LIMIT_REACHED: "Your mobile money limit was reached. Try a smaller amount or contact your provider.",
  PAYER_NOT_FOUND: "That mobile money number was not found. Check the number and try again.",
  PAYMENT_NOT_APPROVED: "The payment prompt was not approved on the phone in time.",
  INSUFFICIENT_BALANCE: "There was not enough balance in the mobile money wallet.",
  UNSPECIFIED_FAILURE: "The payment could not be completed. Please try again.",
  UNKNOWN_ERROR: "Something went wrong with the payment. Please try again.",
  TRANSACTION_ALREADY_IN_PROCESS: "Another payment is already being processed on this number. Wait a moment and retry.",
  OTHER_ONGOING_TRANSACTION: "Another payment is already being processed on this number. Wait a moment and retry.",
  INVALID_PIN: "The PIN entered was incorrect. Please try the payment again.",
  WRONG_PIN: "The PIN entered was incorrect. Please try the payment again.",
  PAYER_CANCELLED: "The payment was cancelled on the phone.",
  CANCELLED_BY_CUSTOMER: "The payment was cancelled on the phone.",
  REJECTED_BY_PROVIDER: "Your mobile money provider rejected the payment.",
  PROVIDER_TEMPORARILY_UNAVAILABLE: "Your mobile money provider is temporarily unavailable. Please try again shortly.",
  TIMEOUT: "The payment request timed out before it was approved.",
  UNDEFINED_ERROR: "The payment could not be completed. Please try again.",
};

export function describePaymentFailure(code?: string | null, fallbackMessage?: string | null): string {
  const key = String(code ?? "").toUpperCase().replace(/[\s-]/g, "_");
  if (key && MAP[key]) return MAP[key];
  if (fallbackMessage) return fallbackMessage;
  return "The payment did not go through. No money was taken — please try again.";
}

/** Short label stored with the payment so admins see the same reason. */
export function shortFailureReason(code?: string | null, fallbackMessage?: string | null): string {
  const key = String(code ?? "").trim();
  return key || fallbackMessage || "unknown";
}
