import { describe, expect, it } from "vitest";
import { nativeEntryDestination } from "@/lib/nativeEntry";

describe("native APK entry", () => {
  it("takes new or signed-out users to login instead of the website home", () => {
    expect(nativeEntryDestination("/", "", false)).toBe("/signin");
  });
  it("takes returning signed-in users directly to dashboard home", () => {
    expect(nativeEntryDestination("/", "", true)).toBe("/dashboard");
  });
  it("replaces public entertainment pages with dashboard sections", () => {
    expect(nativeEntryDestination("/movies", "", true)).toBe("/dashboard?tab=movies");
    expect(nativeEntryDestination("/tv-series", "", true)).toBe("/dashboard?tab=movies");
    expect(nativeEntryDestination("/live-sports", "?league=CL", true)).toBe("/dashboard?tab=football&league=CL");
    expect(nativeEntryDestination("/access", "", false)).toBe("/signin");
  });
  it("preserves account creation, verification, checkout and protected routes", () => {
    for (const path of ["/signup", "/signin", "/verify", "/reset-password", "/payment", "/watch/123", "/admin", "/terms", "/support"]) {
      expect(nativeEntryDestination(path, "?next=%2Fpayment", true)).toBeNull();
    }
  });
});