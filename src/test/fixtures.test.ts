import { describe, expect, it } from "vitest";
import { FIXTURE_LIMIT, FIXTURE_LOOKBACK_MS, fixtureStatus, fixturesWatchDestination, formatKickoff, LEAGUE_OPTIONS } from "@/lib/fixtures";
import { COMPETITIONS, isFresh, mapMatch, equalSecret } from "../../supabase/functions/football-fixtures/logic";
describe("fixtures rules", () => {
  it("syncs only PL, CL and PD", () => expect([...COMPETITIONS]).toEqual(["PL", "CL", "PD"]));
  it("skips competitions for less than ten minutes", () => {
    const now = Date.parse("2026-10-21T12:00:00Z");
    expect(isFresh("2026-10-21T11:50:01Z", now)).toBe(true);
    expect(isFresh("2026-10-21T11:50:00Z", now)).toBe(false);
  });
  it("limits to twenty with a two-hour lookback", () => { expect(FIXTURE_LIMIT).toBe(20); expect(FIXTURE_LOOKBACK_MS).toBe(7200000); });
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