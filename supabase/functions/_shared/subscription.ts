// Shared subscription activation used by pawapay-callback and pawapay-proxy.
// Runs with the service role client.

export interface ActivationResult {
  activated: boolean;
  reason?: string;
  subscriptionId?: string;
  userId?: string;
}

/** Escapes LIKE/ILIKE wildcards so user input cannot pattern-match other rows. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function addInterval(from: Date, interval: string, count: number): Date {
  const d = new Date(from);
  const n = count && count > 0 ? count : 1;
  switch (interval) {
    case "lifetime":
      d.setFullYear(d.getFullYear() + 100);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + n);
      break;
    case "week":
      d.setDate(d.getDate() + 7 * n);
      break;
    case "day":
      d.setDate(d.getDate() + n);
      break;
    default:
      d.setMonth(d.getMonth() + n);
  }
  return d;
}

/**
 * Turns a completed payment into an active subscription.
 * Safe to call multiple times for the same deposit (idempotent per payment row).
 */
export async function activateSubscriptionForPayment(
  supabase: any,
  depositId: string,
): Promise<ActivationResult> {
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .select("*")
    .eq("deposit_id", depositId)
    .maybeSingle();

  if (payErr || !payment) {
    console.error("activate: payment not found for deposit", depositId, payErr);
    return { activated: false, reason: "payment_not_found" };
  }

  if (payment.subscription_id) {
    return { activated: true, reason: "already_active", subscriptionId: payment.subscription_id };
  }

  // Resolve the account this payment belongs to.
  let userId: string | null = payment.user_id ?? null;
  if (!userId && payment.email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", escapeLike(payment.email.trim()))
      .maybeSingle();
    userId = profile?.id ?? null;
  }

  if (!userId) {
    console.log("activate: no account yet for", payment.email, "- will activate at sign-up/admin grant");
    return { activated: false, reason: "no_account" };
  }

  // Resolve the plan.
  let plan: any = null;
  if (payment.plan_id) {
    const { data } = await supabase.from("plans").select("*").eq("id", payment.plan_id).maybeSingle();
    plan = data;
  }
  if (!plan) {
    const { data } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    plan = data;
  }

  // Verify the amount actually paid covers the plan's authoritative price.
  if (plan?.price_usd != null) {
    let expectedUsd = Number(plan.price_usd);

    if (payment.promo_code) {
      const { data: promo } = await supabase
        .from("influencers")
        .select("discount_percent")
        .eq("is_active", true)
        .ilike("promo_code", escapeLike(String(payment.promo_code).trim()))
        .maybeSingle();
      const pct = Number(promo?.discount_percent ?? 0);
      if (pct > 0 && pct < 100) expectedUsd = expectedUsd * (1 - pct / 100);
    }

    const paidUsd =
      payment.amount_usd != null
        ? Number(payment.amount_usd)
        : payment.fx_rate
          ? Number(payment.amount) / Number(payment.fx_rate)
          : null;

    // 5% tolerance for rounding / FX drift.
    if (paidUsd == null || !isFinite(paidUsd) || paidUsd < expectedUsd * 0.95) {
      console.error(
        "activate: underpaid or unverifiable amount",
        JSON.stringify({ paymentId: payment.id, paidUsd, expectedUsd }),
      );
      return { activated: false, reason: "amount_mismatch" };
    }
  }

  const interval = plan?.interval ?? "month";
  const intervalCount = plan?.interval_count ?? 1;

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();
  const startFrom =
    existing && new Date(existing.current_period_end) > now ? new Date(existing.current_period_end) : now;
  const periodEnd = addInterval(startFrom, interval, intervalCount);

  let subscriptionId: string | undefined;

  if (existing) {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        plan_id: plan?.id ?? existing.plan_id,
        status: "active",
        current_period_start: existing.current_period_start ?? now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", existing.id)
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("activate: failed to extend subscription", error);
      return { activated: false, reason: "update_failed" };
    }
    subscriptionId = data?.id ?? existing.id;
  } else {
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: plan?.id ?? null,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("activate: failed to create subscription", error);
      return { activated: false, reason: "insert_failed" };
    }
    subscriptionId = data?.id;
  }

  await supabase
    .from("payments")
    .update({ user_id: userId, subscription_id: subscriptionId, plan_id: plan?.id ?? payment.plan_id })
    .eq("id", payment.id);

  console.log("activate: subscription active until", periodEnd.toISOString(), "for user", userId);
  return { activated: true, subscriptionId, userId };
}
