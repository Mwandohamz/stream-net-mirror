import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FIXTURE_CACHE_MS, currentMatchweek, fixtureStatus } from "@/lib/fixtures";

export interface Fixture {
  id: number; competition_code: string; competition_name: string; home_team: string; away_team: string;
  home_crest_url: string | null; away_crest_url: string | null; kickoff_utc: string; status: string;
  home_score: number | null; away_score: number | null; matchday?: number | null;
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
        let query = supabase.from("fixtures").select("*").in("competition_code", ["PL", "CL", "PD"])
          .not("matchday", "is", null)
          .gte("kickoff_utc", new Date(Date.now() - 21 * 86400_000).toISOString())
          .lte("kickoff_utc", new Date(Date.now() + 21 * 86400_000).toISOString());
        if (competitionCode !== "all") query = query.eq("competition_code", competitionCode);
        const { data, error } = await query.order("kickoff_utc").limit(400).abortSignal(abort.signal);
        if (error) throw error;
        const rows = currentMatchweek((data ?? []) as Fixture[]);
        if (!cancelled) { cache.set(competitionCode, { rows, at: Date.now() }); setFixtures(rows); }
      } catch { if (!cancelled) setError(true); }
      finally { clearTimeout(timer); if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; clearTimeout(timer); abort.abort(); };
  }, [competitionCode, tick]);
  return { fixtures, loading, error };
}