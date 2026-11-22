export const FIXTURE_LIMIT = 20;
export const FIXTURE_LOOKBACK_MS = 30 * 24 * 60 * 60_000;
export const FIXTURE_CACHE_MS = 3 * 60_000;
export const LEAGUE_OPTIONS = [
  { code: "all", label: "All" }, { code: "CL", label: "Champions League" },
  { code: "PL", label: "Premier League" }, { code: "PD", label: "La Liga" },
];
export function fixtureStatus(status: string) {
  if (["IN_PLAY", "PAUSED", "LIVE", "EXTRA_TIME", "PENALTY_SHOOTOUT"].includes(status)) return "Live";
  if (["FINISHED", "AWARDED"].includes(status)) return "Finished";
  if (["POSTPONED", "SUSPENDED", "CANCELLED"].includes(status)) return status.charAt(0) + status.slice(1).toLowerCase();
  return "Scheduled";
}
export function formatKickoff(utc: string, timeZone?: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", ...(timeZone ? { timeZone } : {}) }).format(new Date(utc));
}
export function fixturesWatchDestination(member: boolean, state: string) {
  return member ? null : state === "guest" ? "/signup" : "/payment";
}
type MatchdayRow = { competition_code: string; matchday: number | null; status: string; kickoff_utc: string };
/** Keeps only each league's current matchweek: the round of a live game, else the round of the next game to kick off. */
export function currentMatchweek<T extends MatchdayRow>(rows: T[], now = Date.now()): T[] {
  const out: T[] = [];
  for (const code of [...new Set(rows.map((r) => r.competition_code))]) {
    const league = rows.filter((r) => r.competition_code === code && r.matchday != null && !["CANCELLED", "POSTPONED", "SUSPENDED"].includes(r.status));
    const live = league.find((r) => fixtureStatus(r.status) === "Live");
    const next = league.filter((r) => fixtureStatus(r.status) === "Scheduled" && Date.parse(r.kickoff_utc) > now - 3 * 3600_000)
      .sort((a, b) => Date.parse(a.kickoff_utc) - Date.parse(b.kickoff_utc))[0];
    const latest = [...league].sort((a, b) => Date.parse(b.kickoff_utc) - Date.parse(a.kickoff_utc))[0];
    const round = (live ?? next ?? latest)?.matchday;
    out.push(...league.filter((r) => r.matchday === round));
  }
  // Live first, then upcoming by kickoff, then finished (most recent first).
  const rank = (r: T) => (fixtureStatus(r.status) === "Live" ? 0 : fixtureStatus(r.status) === "Scheduled" ? 1 : 2);
  return out.sort((a, b) => rank(a) - rank(b) || (rank(a) === 2 ? Date.parse(b.kickoff_utc) - Date.parse(a.kickoff_utc) : Date.parse(a.kickoff_utc) - Date.parse(b.kickoff_utc)));
}
