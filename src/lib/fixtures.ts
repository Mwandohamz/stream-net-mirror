export const FIXTURE_LIMIT = 20;
export const FIXTURE_LOOKBACK_MS = 2 * 60 * 60_000;
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