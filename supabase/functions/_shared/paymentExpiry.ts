export const PAYMENT_EXPIRED_REASON = "Payment window expired after 10 minutes";

/**
 * Lazily closes abandoned payment requests; no polling job is required.
 * The optional email scope restricts member reconciliation to their own records.
 */
export async function closeExpiredPayments(
  supabase: any,
  options: { email?: string; escapeLike?: (value: string) => string } = {},
) {
  const now = new Date();
  const legacyCutoff = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const expiryFilter = `expires_at.lt.${now.toISOString()},and(expires_at.is.null,created_at.lt.${legacyCutoff})`;

  let query = supabase
    .from("payments")
    .update({ status: "expired", failure_reason: PAYMENT_EXPIRED_REASON })
    .eq("status", "pending")
    .or(expiryFilter);

  if (options.email) {
    const email = options.escapeLike ? options.escapeLike(options.email.trim()) : options.email.trim();
    query = query.ilike("email", email);
  }

  const { error } = await query;
  if (error) console.error("Could not close expired payments:", error.message);
  return !error;
}
