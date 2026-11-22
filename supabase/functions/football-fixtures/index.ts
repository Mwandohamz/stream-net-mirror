import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders as sdkCorsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { COMPETITIONS, IDLE_TTL_MS, MATCH_WINDOW_TTL_MS, RESULTS_LOOKBACK_MS, equalSecret, isFresh, mapMatch, matchesUrl, needsScoreRefresh } from "./logic.ts";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";

const corsHeaders = { ...sdkCorsHeaders, "Access-Control-Allow-Headers": `${sdkCorsHeaders["Access-Control-Allow-Headers"]}, x-sync-secret`, "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) return json({ error: "Server configuration unavailable" }, 503);
    let authorized = authenticateCronRequest(req) === null || await equalSecret(req.headers.get("x-sync-secret"), Deno.env.get("FIXTURES_SYNC_SECRET"));
    if (!authorized) {
      const authorization = req.headers.get("Authorization");
      if (!authorization?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
      const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
      const { data, error } = await userClient.auth.getClaims(authorization.slice(7));
      if (error || !data?.claims?.sub) return json({ error: "Unauthorized" }, 401);
      const role = await userClient.rpc("has_role", { _user_id: data.claims.sub, _role: "admin" });
      authorized = !role.error && role.data === true;
    }
    if (!authorized) return json({ error: "Unauthorized" }, 401);
    const apiKey = Deno.env.get("FOOTBALL_DATA_API_KEY")?.trim();
    if (!apiKey) {
      console.info("football-fixtures: FOOTBALL_DATA_API_KEY not configured; sync skipped");
      return json({ skipped: true, reason: "no_api_key" });
    }
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const results: Record<string, unknown> = {};
    let requested = false;
    // Sync often only around kick-off/live games; otherwise a few times a day.
    const nowMs = Date.now();
    const active = await admin.from("fixtures").select("competition_code,kickoff_utc,status")
      .gte("kickoff_utc", new Date(nowMs - RESULTS_LOOKBACK_MS).toISOString())
      .lt("kickoff_utc", new Date(nowMs + 15 * 60_000).toISOString())
      .not("status", "in", "(FINISHED,AWARDED,POSTPONED,CANCELLED)");
    if (active.error) throw new Error("fixtures activity read failed");
    const liveCodes = new Set((active.data ?? []).filter(r => needsScoreRefresh(r, nowMs)).map(r => r.competition_code));
    for (const code of COMPETITIONS) {
      try {
        const latest = await admin.from("fixtures").select("last_synced_at").eq("competition_code", code).order("last_synced_at", { ascending: false }).limit(1);
        if (latest.error) throw new Error("fixtures freshness read failed");
        if (isFresh(latest.data?.[0]?.last_synced_at ?? null, nowMs, liveCodes.has(code) ? MATCH_WINDOW_TTL_MS : IDLE_TTL_MS)) { results[code] = { skipped: true, reason: "fresh" }; continue; }
        if (requested) await new Promise(resolve => setTimeout(resolve, 1000));
        requested = true;
        const response = await fetch(matchesUrl(code, nowMs), {
          headers: { "X-Auth-Token": apiKey }, signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
          console.warn(`football-fixtures: ${code} API returned ${response.status}; no retry`);
          results[code] = { error: response.status === 429 ? "rate_limited" : "api_error", status: response.status }; continue;
        }
        const payload = await response.json();
        if (!Array.isArray(payload.matches)) throw new Error("invalid matches response");
        const now = new Date().toISOString();
        const rows = payload.matches.map((match: unknown) => mapMatch(match, code, payload.competition, now)).filter(Boolean);
        if (rows.length) {
          const saved = await admin.from("fixtures").upsert(rows, { onConflict: "id" });
          if (saved.error) throw new Error("fixtures upsert failed");
        }
        results[code] = { synced: rows.length };
      } catch (error) {
        console.warn(`football-fixtures: ${code} sync failed`, error instanceof Error ? error.message : "unknown error");
        results[code] = { error: "sync_failed" };
      }
    }
    return json({ results });
  } catch { return json({ error: "Sync unavailable" }, 500); }
}
if (import.meta.main) Deno.serve(handler);