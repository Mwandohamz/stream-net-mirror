import { describe, expect, it } from "vitest";
import { containsTeam, positiveInteger, regionCode, reliableFixture, videoAvailability } from "../../supabase/functions/_shared/catalogRules";

describe("catalogue request boundaries", () => {
  it("permits pages 1–500 and rejects page 501", () => {
    expect(positiveInteger(1, 500)).toBe(1);
    expect(positiveInteger(500, 500)).toBe(500);
    expect(() => positiveInteger(501, 500)).toThrow();
  });
  it("rejects nonnumeric IDs and zero", () => {
    for (const value of [true, {}, "", 0, 1.5]) expect(() => positiveInteger(value)).toThrow();
  });
  it("normalizes two-letter countries and rejects malformed countries", () => {
    expect(regionCode("zm")).toBe("ZM");
    expect(regionCode(undefined)).toBeUndefined();
    expect(() => regionCode("Zambia")).toThrow();
  });
  it("matches complete team names, not substrings", () => {
    expect(containsTeam("Liverpool vs Manchester City highlights", "Manchester City")).toBe(true);
    expect(containsTeam("Liverpool vs Manchester City highlights", "Manchester United")).toBe(false);
    expect(containsTeam("United highlights", "Leeds United")).toBe(false);
  });
  it("leaves ambiguous fixtures unmatched", () => {
    const fixture = { id: 1, home_team: "Liverpool", away_team: "Manchester City" };
    expect(reliableFixture("Liverpool vs Manchester City", [fixture])?.id).toBe(1);
    expect(reliableFixture("Liverpool vs Manchester City", [fixture, { ...fixture, id: 2 }])).toBeUndefined();
  });
  it("excludes nonembeddable, private and unprocessed videos", () => {
    expect(videoAvailability({ embeddable: true, privacyStatus: "public", uploadStatus: "processed" })).toBe("available");
    expect(videoAvailability({ embeddable: false, privacyStatus: "public", uploadStatus: "processed" })).toBe("blocked");
    expect(videoAvailability({ embeddable: true, privacyStatus: "private", uploadStatus: "processed" })).toBe("blocked");
    expect(videoAvailability({ embeddable: true, privacyStatus: "public", uploadStatus: "uploaded" })).toBe("blocked");
  });
});