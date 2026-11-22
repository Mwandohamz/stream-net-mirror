import { describe, expect, it } from "vitest";
import { currentMatchweek } from "@/lib/fixtures";
const now = Date.parse("2026-11-22T05:00:00Z");
const f = (matchday: number, status: string, kickoff_utc: string, competition_code = "PL") => ({ competition_code, matchday, status, kickoff_utc });
describe("currentMatchweek", () => {
  it("shows only the round of the next game, dropping the previous finished round", () => {
    const rows = [f(10, "FINISHED", "2026-11-08T16:30:00Z"), f(11, "FINISHED", "2026-11-21T15:00:00Z"), f(11, "TIMED", "2026-11-22T14:00:00Z"), f(12, "TIMED", "2026-11-28T15:00:00Z")];
    expect(currentMatchweek(rows, now).map((r) => r.matchday)).toEqual([11, 11]);
  });
  it("ignores a rescheduled game from an older round", () => {
    const rows = [f(8, "CANCELLED", "2026-11-21T19:00:00Z", "PD"), f(13, "TIMED", "2026-11-22T13:00:00Z", "PD"), f(23, "TIMED", "2026-12-02T18:00:00Z", "PD")];
    expect(currentMatchweek(rows, now).map((r) => r.matchday)).toEqual([13]);
  });
});
