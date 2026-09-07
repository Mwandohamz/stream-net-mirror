import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE_KEY = "fx_rates_cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { data: cached } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", CACHE_KEY)
      .maybeSingle();

    if (cached?.value) {
      try {
        const parsed = JSON.parse(cached.value);
        if (parsed?.fetchedAt && Date.now() - parsed.fetchedAt < CACHE_TTL_MS && parsed.rates) {
          return new Response(JSON.stringify({ base: "USD", rates: parsed.rates, cached: true, fetchedAt: parsed.fetchedAt }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (_) {
        // fall through and refetch
      }
    }

    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();

    if (!data?.rates) {
      // Serve stale cache rather than failing pricing entirely.
      if (cached?.value) {
        const parsed = JSON.parse(cached.value);
        return new Response(JSON.stringify({ base: "USD", rates: parsed.rates, stale: true, fetchedAt: parsed.fetchedAt }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Exchange rates unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = { rates: data.rates as Record<string, number>, fetchedAt: Date.now() };

    await supabase
      .from("app_settings")
      .upsert({ key: CACHE_KEY, value: JSON.stringify(payload) }, { onConflict: "key" });

    return new Response(JSON.stringify({ base: "USD", rates: payload.rates, cached: false, fetchedAt: payload.fetchedAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
