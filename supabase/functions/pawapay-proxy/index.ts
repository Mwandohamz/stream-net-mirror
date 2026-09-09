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

    // INITIATE DEPOSIT — authenticated; price is computed server-side.
    if (action === "deposit") {
      const { depositId, currency, phoneNumber, provider, country, promoCode, planId, termsAccepted } = params;

      // 1) Require a verified session; the payer is the signed-in account.
      const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
      const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData } = token ? await authClient.auth.getUser(token) : { data: { user: null } };
      const authUser = userData?.user;
      if (!authUser?.email) {
        return new Response(JSON.stringify({ error: "Sign in required before paying" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!depositId || !currency || !phoneNumber || !provider) {
        return new Response(JSON.stringify({ error: "Missing payment details" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", authUser.id)
        .maybeSingle();

      // 2) Resolve the plan and its authoritative USD price.
      let plan: any = null;
      if (planId) {
        const { data } = await supabase
          .from("plans")
          .select("id, price_usd, is_active")
          .eq("id", planId)
          .eq("is_active", true)
          .maybeSingle();
        plan = data;
      }
      if (!plan) {
        const { data } = await supabase
          .from("plans")
          .select("id, price_usd, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();
        plan = data;
      }
      if (!plan?.price_usd) {
        return new Response(JSON.stringify({ error: "No active plan available" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 3) Validate the promo code server-side and apply its real discount.
      let discountPercent = 0;
      let validPromo: string | null = null;
      if (promoCode) {
        const { data: influencer } = await supabase
          .from("influencers")
          .select("promo_code, discount_percent")
          .eq("is_active", true)
          .ilike("promo_code", String(promoCode).trim().replace(/[\\%_]/g, (c: string) => `\\${c}`))
          .maybeSingle();
        const pct = Number(influencer?.discount_percent ?? 0);
        if (influencer && pct > 0 && pct < 100) {
          discountPercent = pct;
          validPromo = influencer.promo_code;
        }
      }

      const amountUsd = Number((Number(plan.price_usd) * (1 - discountPercent / 100)).toFixed(2));

      // 4) Convert with a server-trusted FX rate (never the client's).
      let fxRate = 1;
      if (String(currency).toUpperCase() !== "USD") {
        const { data: cached } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "fx_rates_cache")
          .maybeSingle();
        let rate: number | undefined;
        try {
          rate = JSON.parse(cached?.value ?? "{}")?.rates?.[String(currency).toUpperCase()];
        } catch (_) {
          rate = undefined;
        }
        if (!rate) {
          const res = await fetch("https://open.er-api.com/v6/latest/USD");
          const json = await res.json();
          rate = json?.rates?.[String(currency).toUpperCase()];
        }
        if (!rate || !isFinite(Number(rate))) {
          return new Response(JSON.stringify({ error: "Exchange rate unavailable, please try again" }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        fxRate = Number(rate);
      }

      const localAmount = (amountUsd * fxRate).toFixed(2);
      const discountApplied = Number(
        ((Number(plan.price_usd) - amountUsd) * fxRate).toFixed(2),
      );

      // Insert payment record from verified/server-derived values only.
      await supabase.from("payments").insert({
        name: profile?.full_name || authUser.email,
        email: authUser.email,
        phone: phoneNumber,
        provider,
        amount: parseFloat(localAmount),
        currency,
        country,
        status: "pending",
        deposit_id: depositId,
        transaction_id: `TXN-${Date.now()}`,
        promo_code: validPromo,
        discount_applied: discountApplied,
        plan_id: plan.id,
        user_id: authUser.id,
        amount_usd: amountUsd,
        fx_rate: fxRate,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        terms_accepted_at: termsAccepted ? new Date().toISOString() : null,
      });

      const amount = localAmount;



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
        try {
          await sendPaymentConfirmation(supabase, depositId);
        } catch (mailErr) {
          console.error("Confirmation email failed:", mailErr);
        }
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
