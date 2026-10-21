import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FIXTURE_CACHE_MS, FIXTURE_LIMIT, FIXTURE_LOOKBACK_MS } from "@/lib/fixtures";

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
  useEffect(() => {
    let cancelled = false;
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), 8000);
    const recent = cache.get(competitionCode);
    setFixtures(recent?.rows ?? []); setError(false);
    if (recent && Date.now() - recent.at < FIXTURE_CACHE_MS) { setLoading(false); clearTimeout(timer); return; }
    setLoading(!recent);
    void (async () => {
      try {
        let query = supabase.from("fixtures").select("*").in("competition_code", ["PL", "CL", "PD"]).gt("kickoff_utc", new Date(Date.now() - FIXTURE_LOOKBACK_MS).toISOString()).order("kickoff_utc").limit(FIXTURE_LIMIT);
        if (competitionCode !== "all") query = query.eq("competition_code", competitionCode);
        const result = await query.abortSignal(abort.signal);
        if (result.error) throw result.error;
        const rows = result.data ?? [];
        if (!cancelled) { cache.set(competitionCode, { rows, at: Date.now() }); setFixtures(rows); }
      } catch { if (!cancelled) setError(true); }
      finally { clearTimeout(timer); if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; clearTimeout(timer); abort.abort(); };
  }, [competitionCode]);
  return { fixtures, loading, error };
}