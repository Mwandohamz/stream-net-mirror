
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function containsTeam(text: string, team: string): boolean {
  const normalizedText = ` ${normalize(text)} `;
  const normalizedTeam = normalize(team);

  if (!normalizedTeam) return false;

  return normalizedText.includes(` ${normalizedTeam} `);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: { user }, error: authError } =
      await userClient.auth.getUser();

    if (authError || !user) {
      return json({ error: "Invalid authentication" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const email = (user.email || "").trim().toLowerCase();

    const adminEmails = (Deno.env.get("ADMIN_EMAILS") || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    let isAdmin = adminEmails.includes(email);

    if (!isAdmin) {
      const { data: role } = await admin
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      isAdmin = !!role;
    }

    if (!isAdmin) {
      return json({ error: "Administrator access required" }, 403);
    }

    // Fetch unmatched, embeddable highlights.
    const { data: highlights, error: highlightError } = await admin
      .from("football_highlights")
      .select(`
        id,
        title,
        description,
        published_at,
        competition_code,
        fixture_id
      `)
      .is("fixture_id", null)
      .eq("is_embeddable", true)
      .eq("availability_status", "available")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(500);

    if (highlightError) throw highlightError;

    let matched = 0;
    let unmatched = 0;
    let ambiguous = 0;

    const results: any[] = [];

    for (const highlight of highlights || []) {
      const publishedAt = new Date(highlight.published_at);

      if (Number.isNaN(publishedAt.getTime())) {
        unmatched++;
        continue;
      }

      // A highlight must be published within seven days
      // after the fixture kickoff.
      const earliestKickoff = new Date(
        publishedAt.getTime() - 7 * 24 * 60 * 60 * 1000,
      );

      const latestKickoff = publishedAt;

      let fixtureQuery = admin
        .from("fixtures")
        .select(`
          id,
          home_team,
          away_team,
          competition_code,
          kickoff_utc
        `)
        .gte("kickoff_utc", earliestKickoff.toISOString())
        .lte("kickoff_utc", latestKickoff.toISOString());

      if (highlight.competition_code) {
        fixtureQuery = fixtureQuery.eq(
          "competition_code",
          highlight.competition_code,
        );
      }

      const { data: fixtures, error: fixtureError } =
        await fixtureQuery.limit(100);

      if (fixtureError) throw fixtureError;

      const searchableText =
        `${highlight.title || ""} ${highlight.description || ""}`;

      const candidates = (fixtures || []).filter((fixture: any) => {
        const homeFound = containsTeam(
          searchableText,
          fixture.home_team,
        );

        const awayFound = containsTeam(
          searchableText,
          fixture.away_team,
        );

        return homeFound && awayFound;
      });

      if (candidates.length === 1) {
        const fixture = candidates[0];

        const matchLabel =
          `${fixture.home_team} vs ${fixture.away_team}`;

        const { error: updateError } = await admin
          .from("football_highlights")
          .update({
            fixture_id: fixture.id,
            match_label: matchLabel,
            updated_at: new Date().toISOString(),
          })
          .eq("id", highlight.id)
          .is("fixture_id", null);

        if (updateError) throw updateError;

        matched++;

        results.push({
          highlightId: highlight.id,
          fixtureId: fixture.id,
          match: matchLabel,
          status: "matched",
        });
      } else if (candidates.length > 1) {
        ambiguous++;

        results.push({
          highlightId: highlight.id,
          status: "ambiguous",
          candidateCount: candidates.length,
        });
      } else {
        unmatched++;
      }
    }

    return json({
      success: true,
      scanned: (highlights || []).length,
      matched,
      unmatched,
      ambiguous,
      results,
    });
  } catch (error) {
    console.error("match-football-highlights error:", error);

    return json({
      error: error instanceof Error
        ? error.message
        : "Fixture matching failed",
    }, 500);
  }
});
