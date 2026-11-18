
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      competition = body?.competition ?? competition;
    }

    if (
      competition &&
      !/^[A-Z0-9]{2,10}$/.test(competition)
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
      highlights: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("get-football-highlights error:", error);
    return json({ error: "Highlights service unavailable" }, 500);
  }
});
