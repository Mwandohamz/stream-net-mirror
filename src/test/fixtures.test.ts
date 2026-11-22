import { describe, expect, it } from "vitest";
import { FIXTURE_LIMIT, FIXTURE_LOOKBACK_MS, fixtureStatus, fixturesWatchDestination, formatKickoff, LEAGUE_OPTIONS } from "@/lib/fixtures";
import { COMPETITIONS, isFresh, mapMatch, equalSecret, needsScoreRefresh, matchesUrl } from "../../supabase/functions/football-fixtures/logic";
describe("fixtures rules", () => {
  it("syncs only PL, CL and PD", () => expect([...COMPETITIONS]).toEqual(["PL", "CL", "PD"]));
  it("skips competitions for less than ten minutes", () => {
    const now = Date.parse("2026-10-21T12:00:00Z");
    expect(isFresh("2026-10-21T11:50:01Z", now)).toBe(true);
    expect(isFresh("2026-10-21T11:50:00Z", now)).toBe(false);
  });
  it("bounds each query to twenty with thirty days of results", () => { expect(FIXTURE_LIMIT).toBe(20); expect(FIXTURE_LOOKBACK_MS).toBe(2592000000); });
  for (const code of ["PL", "CL", "PD"]) {
    it(`preserves live and final scores for ${code}`, () => {
      for (const status of ["IN_PLAY", "FINISHED"]) {
        const row = mapMatch({ id: 321, homeTeam: { name: "Home" }, awayTeam: { name: "Away" }, utcDate: "2026-11-21T15:00:00Z", status, score: { fullTime: { home: 2, away: 0 } } }, code, {}, "2026-11-22T04:00:00Z");
        expect(row).toMatchObject({ competition_code: code, status, home_score: 2, away_score: 0 });
      }
    });
  }
  it("keeps refreshing overdue unfinished scores instead of switching to idle", () => {
    const now = Date.parse("2026-11-22T04:00:00Z");
    expect(needsScoreRefresh({ kickoff_utc: "2026-11-21T12:30:00Z", status: "TIMED" }, now)).toBe(true);
    expect(needsScoreRefresh({ kickoff_utc: "2026-11-21T12:30:00Z", status: "FINISHED" }, now)).toBe(false);
    expect(needsScoreRefresh({ kickoff_utc: "2026-11-23T12:30:00Z", status: "TIMED" }, now)).toBe(false);
    expect(matchesUrl("CL", now)).toContain("dateFrom=2026-10-23");
  });
  it("uses each API match id and preserves null unplayed scores", () => {
    const row = mapMatch({ id: 321, homeTeam: { name: "Home" }, awayTeam: { name: "Away" }, utcDate: "2026-10-22T20:00:00Z", season: { startDate: "2026-08-01" } }, "PD", { name: "La Liga" }, "2026-10-21T00:00:00Z");
    expect(row?.id).toBe(321); expect(row?.season).toBe(2026); expect(row?.home_score).toBeNull(); expect(row?.competition_code).toBe("PD");
  });
  it("formats kickoff in the viewer timezone", () => {
    const date = "2026-10-22T20:00:00Z";
    expect(formatKickoff(date, "Africa/Lusaka")).not.toBe(formatKickoff(date, "Europe/London"));
  });
  it("maps API statuses", () => { expect(fixtureStatus("SCHEDULED")).toBe("Scheduled"); expect(fixtureStatus("IN_PLAY")).toBe("Live"); expect(fixtureStatus("FINISHED")).toBe("Finished"); });
  it("filters using football-data competition codes", () => expect(LEAGUE_OPTIONS.map(o => o.code)).toEqual(["all", "CL", "PL", "PD"]));
  it("reuses paid platform picker and guest/unpaid entry destinations", () => {
    expect(fixturesWatchDestination(true, "active")).toBeNull();
    expect(fixturesWatchDestination(false, "guest")).toBe("/signup");
    expect(fixturesWatchDestination(false, "unpaid")).toBe("/payment");
  });
  it("rejects missing or wrong shared secrets", async () => {
    expect(await equalSecret(null, undefined)).toBe(false);
    expect(await equalSecret("wrong", "correct")).toBe(false);
    expect(await equalSecret("correct", "correct")).toBe(true);
  });
});