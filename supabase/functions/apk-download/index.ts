import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "Download service unavailable" }, 503);
  const supabase = createClient(url, key);

  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "streamnetmirror_apk_file_name")
    .maybeSingle();

  const fileName = setting?.value;
  if (!fileName || !/^downloads\/streamnetmirror-own-[a-zA-Z0-9-]+\.apk$/.test(fileName)) return json({ error: "Stream NetMirror APK has not been uploaded yet" }, 404);

  let platform: string | null = null;
  let userId: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.platform === "string") platform = body.platform.slice(0, 40);
  } catch { /* no body is fine */ }

  // Attach the caller's user id when a valid session token is present.
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    try {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id ?? null;
    } catch { /* anonymous download */ }
  }

  // Track the download; a logging failure must never block the file.
  try {
    await supabase.from("apk_downloads").insert({
      file_name: fileName,
      user_id: userId,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 300),
      platform,
    });
  } catch { /* non-fatal */ }

  const { data, error } = await supabase.storage
    .from("app-files")
    .createSignedUrl(fileName, 300, { download: true });

  if (error || !data?.signedUrl) return json({ error: "Could not prepare download" }, 500);
  return json({ url: data.signedUrl });
});
