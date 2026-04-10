import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const status = body.status;

    if (!depositId || !status) {
      console.error("Missing depositId or status in callback body");
      return new Response(JSON.stringify({ error: "Missing depositId or status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
  } catch (err: unknown) {
    console.error("Callback error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Callback error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
