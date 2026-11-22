import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FIXTURE_CACHE_MS, FIXTURE_LIMIT, FIXTURE_LOOKBACK_MS, fixtureStatus } from "@/lib/fixtures";

export interface Fixture {
  id: number; competition_code: string; competition_name: string; home_team: string; away_team: string;
  home_crest_url: string | null; away_crest_url: string | null; kickoff_utc: string; status: string;
  home_score: number | null; away_score: number | null;
}
const cache = new Map<string, { rows: Fixture[]; at: number }>();
export function useFixtures(competitionCode = "all") {
  const initial = cache.get(competitionCode);
  const [fixtures, setFixtures] = useState(initial?.rows ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const hasLive = fixtures.some((f) => fixtureStatus(f.status) === "Live" ||
    (fixtureStatus(f.status) === "Scheduled" && Date.parse(f.kickoff_utc) <= Date.now() + 15 * 60_000));
  // Visible-only cached reads also detect kickoff without requiring the user to reload.
  useEffect(() => {
    if (fixtures.length === 0) return;
    const id = window.setInterval(() => { if (document.visibilityState === "visible") setTick((t) => t + 1); }, hasLive ? 60_000 : FIXTURE_CACHE_MS);
    return () => clearInterval(id);
  }, [hasLive, fixtures.length]);
  useEffect(() => {
    let cancelled = false;
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), 8000);
    const recent = cache.get(competitionCode);
    setFixtures(recent?.rows ?? []); setError(false);
    if (recent && (tick === 0 || Date.now() - recent.at < 55_000) && Date.now() - recent.at < FIXTURE_CACHE_MS) { setLoading(false); clearTimeout(timer); return; }
    setLoading(!recent);
    void (async () => {
      try {
        const now = new Date().toISOString();
        const base = () => {
          const query = supabase.from("fixtures").select("*").in("competition_code", ["PL", "CL", "PD"]);
          return competitionCode === "all" ? query : query.eq("competition_code", competitionCode);
        };
        // Separate bounded reads prevent upcoming games from crowding out league results.
        const [recentResults, upcoming] = await Promise.all([
          base().in("status", ["IN_PLAY", "PAUSED", "LIVE", "EXTRA_TIME", "PENALTY_SHOOTOUT", "FINISHED", "AWARDED"])
            .gte("kickoff_utc", new Date(Date.now() - FIXTURE_LOOKBACK_MS).toISOString())
            .lte("kickoff_utc", now).order("kickoff_utc", { ascending: false }).limit(FIXTURE_LIMIT).abortSignal(abort.signal),
          base().in("status", ["TIMED", "SCHEDULED"]).gt("kickoff_utc", now)
            .order("kickoff_utc").limit(FIXTURE_LIMIT).abortSignal(abort.signal),
        ]);
        if (recentResults.error) throw recentResults.error;
        if (upcoming.error) throw upcoming.error;
        const recent = (recentResults.data ?? []).sort((a, b) =>
          Number(fixtureStatus(b.status) === "Live") - Number(fixtureStatus(a.status) === "Live") || Date.parse(b.kickoff_utc) - Date.parse(a.kickoff_utc));
        const rows = [...recent, ...(upcoming.data ?? [])];
        if (!cancelled) { cache.set(competitionCode, { rows, at: Date.now() }); setFixtures(rows); }
      } catch { if (!cancelled) setError(true); }
      finally { clearTimeout(timer); if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; clearTimeout(timer); abort.abort(); };
  }, [competitionCode, tick]);
  return { fixtures, loading, error };
}