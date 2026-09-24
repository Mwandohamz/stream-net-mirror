// Payment → Telegram notifications with DB-backed idempotency.
// Claim strategy: insert a 'pending' log row per (deposit, type, chat). The
// partial unique index (status IN ('pending','sent')) rejects a second claim,
// so concurrent callbacks/polls cannot double-send. After sending, the row is
// marked 'sent' or 'failed'. Failed rows leave the index, so a later retry can
// claim again while history is preserved. Never throws.
import { sendTelegramMessage } from "./telegram.ts";

// deno-lint-ignore no-explicit-any
type Client = any;
export type PaymentNotificationType = "payment_completed" | "payment_failed";

const STALE_PENDING_MS = 5 * 60 * 1000;

export const escapeHtml = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const maskEmail = (email?: string | null) => {
  if (!email || !email.includes("@")) return "—";
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}***@${d}`;
};

// deno-lint-ignore no-explicit-any
function formatMessage(type: PaymentNotificationType, p: any, planName: string | null, extra: { subscriptionResult?: string }) {
  const amount = `${Number(p.amount ?? 0).toFixed(2)} ${p.currency ?? ""}`.trim();
  const lines = type === "payment_completed"
    ? [`✅ <b>Payment completed</b>`]
    : [`❌ <b>Payment failed</b>`];
  lines.push(
    `<b>Customer:</b> ${escapeHtml(p.name || "—")} (${escapeHtml(maskEmail(p.email))})`,
    `<b>Amount:</b> ${escapeHtml(amount)}${p.amount_usd ? ` (≈ ${escapeHtml(Number(p.amount_usd).toFixed(2))} USD)` : ""}`,
  );
  if (planName) lines.push(`<b>Plan:</b> ${escapeHtml(planName)}`);
  if (p.provider) lines.push(`<b>Provider:</b> ${escapeHtml(p.provider)}${p.country ? ` · ${escapeHtml(p.country)}` : ""}`);
  if (p.promo_code) lines.push(`<b>Promo:</b> ${escapeHtml(p.promo_code)}`);
  lines.push(`<b>Deposit ID:</b> <code>${escapeHtml(p.deposit_id)}</code>`);
  if (p.provider_transaction_id) lines.push(`<b>Provider Txn:</b> <code>${escapeHtml(p.provider_transaction_id)}</code>`);
  if (type === "payment_completed") {
    lines.push(`<b>Subscription:</b> ${escapeHtml(extra.subscriptionResult ?? (p.subscription_id ? "active" : "not activated"))}`);
  } else {
    lines.push(`<b>Reason:</b> ${escapeHtml(p.failure_reason || "Unknown")}`);
  }
  lines.push(`<b>Time:</b> ${escapeHtml(new Date().toISOString().replace("T", " ").slice(0, 19))} UTC`);
  return lines.join("\n");
}

export async function notifyPaymentTelegram(
  supabase: Client,
  depositId: string,
  type: PaymentNotificationType,
  extra: { subscriptionResult?: string } = {},
): Promise<{ sent: number; failed: number; skipped: number }> {
  const summary = { sent: 0, failed: 0, skipped: 0 };
  try {
    if (!depositId) return summary;
    const { data: payment, error: pErr } = await supabase
      .from("payments").select("*").eq("deposit_id", depositId).maybeSingle();
    if (pErr || !payment) {
      console.error("[telegram] payment lookup failed", pErr?.message ?? "not found");
      return summary;
    }
    const expected = type === "payment_completed" ? "completed" : "failed";
    if (payment.status !== expected) {
      console.log(`[telegram] skip ${type}: payment status is ${payment.status}`);
      return summary;
    }

    const { data: recipients, error: rErr } = await supabase
      .from("telegram_notification_recipients").select("id, chat_id").eq("is_active", true);
    if (rErr) { console.error("[telegram] recipients lookup failed", rErr.message); return summary; }
    if (!recipients?.length) return summary;

    let planName: string | null = null;
    if (payment.plan_id) {
      const { data: plan } = await supabase.from("plans").select("name").eq("id", payment.plan_id).maybeSingle();
      planName = plan?.name ?? null;
    }
    const message = formatMessage(type, payment, planName, extra);

    for (const r of recipients) {
      try {
        // Release stale claims from crashed attempts so they can retry.
        await supabase.from("telegram_payment_notifications")
          .update({ status: "failed", error_message: "Stale claim released" })
          .eq("deposit_id", depositId).eq("notification_type", type).eq("chat_id", r.chat_id)
          .eq("status", "pending").lt("created_at", new Date(Date.now() - STALE_PENDING_MS).toISOString());

        const { data: claim, error: cErr } = await supabase.from("telegram_payment_notifications").insert({
          payment_id: payment.id, deposit_id: depositId, recipient_id: r.id, chat_id: r.chat_id,
          notification_type: type, status: "pending", message,
        }).select("id").single();
        if (cErr || !claim) {
          if (cErr?.code !== "23505") console.error("[telegram] claim failed", cErr?.message);
          summary.skipped++;
          continue;
        }

        const result = await sendTelegramMessage(r.chat_id, message);
        const errText = result.success ? null
          : [result.error.type, result.error.telegramDescription ?? result.error.message].filter(Boolean).join(": ");
        await supabase.from("telegram_payment_notifications")
          .update({ status: result.success ? "sent" : "failed", error_message: errText })
          .eq("id", claim.id);
        result.success ? summary.sent++ : summary.failed++;
      } catch (e) {
        console.error("[telegram] recipient error", e instanceof Error ? e.message : e);
        summary.failed++;
      }
    }
  } catch (e) {
    console.error("[telegram] notify error", e instanceof Error ? e.message : e);
  }
  console.log(`[telegram] ${type} ${depositId}:`, JSON.stringify(summary));
  return summary;
}

// deno-lint-ignore no-explicit-any
export const activationLabel = (a: any): string => {
  if (!a) return "unknown";
  if (a.activated) return a.reason === "already_active" ? "active (already activated)" : "activated";
  return `not activated (${a.reason ?? "unknown"})`;
};
