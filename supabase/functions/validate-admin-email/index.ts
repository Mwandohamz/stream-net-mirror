import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Tells the CALLER whether their own signed-in account is an admin.
 * The email is taken from the verified session token only — never from the
 * request body — so this endpoint cannot be used to enumerate admin addresses.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Not signed in (or an anon-key-only call) is a normal "not an admin"
  // answer — returning 401 makes the browser client throw instead.
  const unauthorized = () =>
    new Response(JSON.stringify({ valid: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return unauthorized();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );

    const { data, error } = await supabase.auth.getUser(token);
    const callerEmail = data?.user?.email;
    if (error || !callerEmail) return unauthorized();

    const adminEmails = (Deno.env.get("ADMIN_EMAILS") || "")
      .split(",")
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean);

    const isValid = adminEmails.includes(callerEmail.trim().toLowerCase());

    return new Response(JSON.stringify({ valid: isValid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ valid: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
