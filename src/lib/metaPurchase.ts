import { supabase } from "@/integrations/supabase/client";
import { trackMetaEvent } from "@/lib/analytics";

const sentKey = (depositId: string) => `meta_purchase_sent:${depositId}`;

/**
 * Reports a Meta Purchase event — but only for a payment the server has already
 * verified with pawaPay and turned into an active subscription.
 * Safe to call repeatedly: it fires at most once per deposit.
 */
export async function reportPurchase(depositId: string | null | undefined) {
  if (!depositId) return;

  try {
    if (localStorage.getItem(sentKey(depositId))) return;
  } catch {
    // storage unavailable — the eventID still deduplicates on Meta's side
  }

  try {
    const { data } = await supabase
      .from("payments")
      .select("amount, currency, status, subscription_id")
      .eq("deposit_id", depositId)
      .maybeSingle();

    if (!data) return;
    if (data.status !== "completed") return;
    if (!data.subscription_id) return;

    const value = Number(data.amount);
    const currency = data.currency;
    if (!isFinite(value) || value <= 0 || !currency) return;

    const fired = trackMetaEvent("Purchase", { value, currency }, depositId);
    if (fired) {
      try {
        localStorage.setItem(sentKey(depositId), "1");
      } catch {
        /* ignore */
      }
    }
  } catch {
    // never let tracking interfere with the payment flow
  }
}
