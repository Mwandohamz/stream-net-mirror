import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { activateSubscriptionForPayment } from "../_shared/subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const PAWAPAY_TOKEN = Deno.env.get("PAWAPAY_API_TOKEN");
  const PAWAPAY_BASE = Deno.env.get("PAWAPAY_BASE_URL") || "https://api.sandbox.pawapay.io";

  if (!PAWAPAY_TOKEN) {
    return new Response(JSON.stringify({ error: "pawaPay API token not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action, ...params } = body;

    const pawapayHeaders = {
      Authorization: `Bearer ${PAWAPAY_TOKEN}`,
      "Content-Type": "application/json",
    };

    // ACTIVE CONFIGURATION
    if (action === "active-conf") {
      const { country } = params;
      const res = await fetch(
        `${PAWAPAY_BASE}/v2/active-conf?country=${country}&operationType=DEPOSIT`,
        { headers: pawapayHeaders }
      );
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PREDICT PROVIDER
    if (action === "predict") {
      const { phoneNumber } = params;
      const res = await fetch(`${PAWAPAY_BASE}/v2/predict-provider`, {
        method: "POST",
        headers: pawapayHeaders,
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // EXPIRE A PENDING DEPOSIT (10 minute payment window)
    if (action === "expire") {
      const { depositId, reason } = params;
      if (depositId) {
        await supabase
          .from("payments")
          .update({
            status: "expired",
            failure_reason: reason || "Payment window expired after 10 minutes",
          })
          .eq("deposit_id", depositId)
          .eq("status", "pending");
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // INITIATE DEPOSIT
    if (action === "deposit") {
      const { depositId, amount, currency, phoneNumber, provider, name, email, country, promoCode, discountApplied, planId, userId, amountUsd, fxRate, termsAccepted } = params;

      // Insert payment record
      await supabase.from("payments").insert({
        name,
        email,
        phone: phoneNumber,
        provider,
        amount: parseFloat(amount),
        currency,
        country,
        status: "pending",
        deposit_id: depositId,
        transaction_id: `TXN-${Date.now()}`,
        promo_code: promoCode || null,
        discount_applied: discountApplied || 0,
        plan_id: planId || null,
        user_id: userId || null,
        amount_usd: amountUsd ?? null,
        fx_rate: fxRate ?? null,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        terms_accepted_at: termsAccepted ? new Date().toISOString() : null,
      });


      const depositBody = {
        depositId,
        amount,
        currency,
        payer: {
          type: "MMO",
          accountDetails: {
            phoneNumber,
            provider,
          },
        },
      };

      const res = await fetch(`${PAWAPAY_BASE}/v2/deposits`, {
        method: "POST",
        headers: pawapayHeaders,
        body: JSON.stringify(depositBody),
      });
      const data = await res.json();

      // Update status based on response
      const depositStatus = data?.status;
      if (depositStatus === "REJECTED") {
        await supabase
          .from("payments")
          .update({
            status: "failed",
            failure_reason: data?.failureReason?.failureMessage ?? "Rejected",
          })
          .eq("deposit_id", depositId);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CHECK DEPOSIT STATUS
    if (action === "status") {
      const { depositId } = params;
      const res = await fetch(`${PAWAPAY_BASE}/v1/deposits/${depositId}`, {
        headers: pawapayHeaders,
      });
      const data = await res.json();

      // Update payment record on final status
      const status = Array.isArray(data) ? data[0]?.status : data?.status;
      if (status === "COMPLETED") {
        const providerTxnId = Array.isArray(data)
          ? data[0]?.providerTransactionId
          : data?.providerTransactionId;
        const completedUpdate: Record<string, unknown> = { status: "completed" };
        if (providerTxnId) completedUpdate.provider_transaction_id = providerTxnId;
        await supabase.from("payments").update(completedUpdate).eq("deposit_id", depositId);

        const activation = await activateSubscriptionForPayment(supabase, depositId);
        console.log("Activation (status poll):", JSON.stringify(activation));
      } else if (status === "FAILED") {
        const reason = Array.isArray(data)
          ? data[0]?.failureReason?.failureMessage
          : data?.failureReason?.failureMessage;
        await supabase
          .from("payments")
          .update({
            status: "failed",
            failure_reason: reason ?? "Failed",
          })
          .eq("deposit_id", depositId);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
