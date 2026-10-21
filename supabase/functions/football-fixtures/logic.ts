export const COMPETITIONS = ["PL", "CL", "PD"] as const;
export const SYNC_TTL_MS = 10 * 60_000;
export function isFresh(value: string | null, now = Date.now()) {
  return Boolean(value && now - Date.parse(value) >= 0 && now - Date.parse(value) < SYNC_TTL_MS);
}
export function mapMatch(match: any, code: string, competition: any, synced: string) {
  if (!Number.isSafeInteger(match?.id) || !match?.homeTeam?.name || !match?.awayTeam?.name || !Number.isFinite(Date.parse(match?.utcDate))) return null;
  return {
    id: match.id, competition_code: code, competition_name: competition?.name || match.competition?.name || code,
    season: match.season?.startDate ? Number(match.season.startDate.slice(0, 4)) : null,
    matchday: match.matchday ?? null, home_team: match.homeTeam.name, away_team: match.awayTeam.name,
    home_crest_url: match.homeTeam.crest ?? null, away_crest_url: match.awayTeam.crest ?? null,
    kickoff_utc: match.utcDate, status: match.status || "SCHEDULED",
    home_score: match.score?.fullTime?.home ?? null, away_score: match.score?.fullTime?.away ?? null,
    last_synced_at: synced,
  };
}
export async function equalSecret(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const encode = new TextEncoder();
  const [a, b] = await Promise.all([received, expected].map(v => crypto.subtle.digest("SHA-256", encode.encode(v))));
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < x.length; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}