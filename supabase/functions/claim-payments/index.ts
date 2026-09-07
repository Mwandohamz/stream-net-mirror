import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { activateSubscriptionForPayment, escapeLike } from "../_shared/subscription.ts";

// Links any completed payments made with the signed-in user's email to their
// account and activates/extends their subscription.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await anonClient.auth.getUser(token);
    if (userErr || !user?.email) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: payments } = await admin
      .from("payments")
      .select("id, deposit_id, user_id, subscription_id")
      .ilike("email", user.email)
      .eq("status", "completed");

    const claimable = (payments ?? []).filter((p: any) => !p.subscription_id);

    // Attach every matching payment to this account first.
    for (const p of claimable) {
      if (!p.user_id) {
        await admin.from("payments").update({ user_id: user.id }).eq("id", p.id);
      }
    }

    let activated = 0;
    for (const p of claimable) {
      if (!p.deposit_id) continue;
      const result = await activateSubscriptionForPayment(admin, p.deposit_id);
      if (result.activated) activated++;
    }

    return new Response(JSON.stringify({ claimed: claimable.length, activated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("claim-payments error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
