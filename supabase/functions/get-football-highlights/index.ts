
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { checkRateLimit, rateLimitSubject } from "../_shared/rateLimit.ts";


const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=120",
    },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !serviceKey) {
      return json({ error: "Service unavailable" }, 503);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const requestUrl = new URL(req.url);
    let competition = requestUrl.searchParams.get("competition");
    let refresh = false;

    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid request body" }, 400);
      competition = body?.competition ?? competition;
      refresh = body?.refresh === true;
    }

    // Guard rails: manual refreshes allow 7 per 3 hours (warning from the 5th), plus a general per-visitor cap.
    const subject = await rateLimitSubject(req);
    const general = await checkRateLimit(admin, "highlights-read", subject, 120, 3600);
    if (!general.allowed) return json({ error: "Too many requests. Please try again later.", retryAfter: general.retryAfter }, 429);
    let refreshRemaining: number | null = null;
    if (refresh) {
      const r = await checkRateLimit(admin, "highlights-refresh", subject, 7, 3 * 3600, 3 * 3600);
      if (!r.allowed) return json({ error: "Refresh is paused. Highlights still update automatically.", retryAfter: r.retryAfter, blocked: true }, 429);
      refreshRemaining = r.remaining;
    }

    if (
      competition &&
      (typeof competition !== "string" || !/^[A-Z0-9]{2,10}$/.test(competition))
    ) {
      return json({ error: "Invalid competition code" }, 400);
    }

    let query = admin
      .from("football_highlights")
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        channel_title,
        thumbnail_url,
        published_at,
        competition_code,
        match_label,
        fixture_id
      `)
      .eq("is_published", true)
      .eq("is_embeddable", true)
      .eq("availability_status", "available")
      .gt("api_data_expires_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(40);

    if (competition) {
      query = query.eq("competition_code", competition);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Highlights read failed:", error.message);
      return json({ error: "Could not load highlights" }, 500);
    }

    return json({
      success: true,
      refreshRemaining,
      highlights: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("get-football-highlights error:", error);
    return json({ error: "Highlights service unavailable" }, 500);
  }
});
