import { requireAdmin } from "../_shared/adminAuth.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runSubscriptionEmails } from "../_shared/notify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return json({ error: auth.error }, auth.status);
    const { admin } = auth;

    const body = await req.json().catch(() => ({}));
    const days = Math.min(30, Math.max(0, Number(body?.days ?? 3)));
    const userId = typeof body?.userId === "string" ? body.userId : null;

    const result = await runSubscriptionEmails(admin, days, userId);
    console.log("subscription-emails run", JSON.stringify({ days, userId, result }));

    return json({ success: true, ...result });
  } catch (err) {
    console.error("subscription-emails error", err);
    return json({ error: (err as Error)?.message ?? "Unexpected error" }, 500);
  }
});
