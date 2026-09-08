import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { activateSubscriptionForPayment } from "../_shared/subscription.ts";
import { sendPaymentConfirmation } from "../_shared/notify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    console.log("pawaPay callback received:", JSON.stringify(body));

    const depositId = body.depositId;

    if (!depositId) {
      console.error("Missing depositId in callback body");
      return new Response(JSON.stringify({ error: "Missing depositId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NEVER trust the webhook body: confirm the real status server-to-server with pawaPay.
    const PAWAPAY_TOKEN = Deno.env.get("PAWAPAY_API_TOKEN");
    const PAWAPAY_BASE = Deno.env.get("PAWAPAY_BASE_URL") || "https://api.sandbox.pawapay.io";
    if (!PAWAPAY_TOKEN) {
      console.error("pawaPay token not configured - refusing to process callback");
      return new Response(JSON.stringify({ error: "Not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifyRes = await fetch(`${PAWAPAY_BASE}/v1/deposits/${encodeURIComponent(depositId)}`, {
      headers: { Authorization: `Bearer ${PAWAPAY_TOKEN}`, "Content-Type": "application/json" },
    });

    if (!verifyRes.ok) {
      console.error("pawaPay verification failed", verifyRes.status);
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verified = await verifyRes.json();
    const record = Array.isArray(verified) ? verified[0] : verified;
    const status = record?.status;

    if (!status) {
      console.error("Deposit not found at pawaPay:", depositId);
      return new Response(JSON.stringify({ error: "Unknown deposit" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use only provider-confirmed values from here on.
    body.providerTransactionId = record?.providerTransactionId ?? body.providerTransactionId;
    body.failureReason = record?.failureReason ?? body.failureReason;


    if (status === "COMPLETED") {
      const updateData: Record<string, any> = {
        status: "completed",
      };
      if (body.providerTransactionId) {
        updateData.provider_transaction_id = body.providerTransactionId;
      }

      const { error: updateError, data: updateResult } = await supabase
        .from("payments")
        .update(updateData)
        .eq("deposit_id", depositId)
        .select("id, email, name");

      if (updateError) {
        console.error("Failed to update payment to completed:", updateError);
      } else {
        console.log("Payment updated to completed:", JSON.stringify(updateResult));
        const activation = await activateSubscriptionForPayment(supabase, depositId);
        console.log("Activation result:", JSON.stringify(activation));
      }
    } else if (status === "FAILED") {
      const reason = body.failureReason?.failureMessage ?? "Payment failed";
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "failed",
          failure_reason: reason,
        })
        .eq("deposit_id", depositId);

      if (updateError) {
        console.error("Failed to update payment to failed:", updateError);
      } else {
        console.log("Payment updated to failed for deposit:", depositId, "reason:", reason);
      }
    } else {
      console.log("Unhandled callback status:", status, "for deposit:", depositId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Callback error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
