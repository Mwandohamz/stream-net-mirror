import { beforeEach, describe, expect, it } from "vitest";
import { nativeSessionWindow, startNativeSession, sessionWindowExpired, NATIVE_SESSION_DURATION_MS, clearNativeSessionWindow } from "@/lib/nativeSession";

describe("native session window", () => {
  beforeEach(() => localStorage.clear());
  it("expires exactly 14 days after login", () => {
    const record = startNativeSession("user", 1000);
    expect(NATIVE_SESSION_DURATION_MS).toBe(1_209_600_000);
    expect(sessionWindowExpired(record.expiresAt, 1000 + 1_209_600_000 - 1)).toBe(false);
    expect(sessionWindowExpired(record.expiresAt, 1000 + 1_209_600_000)).toBe(true);
  });
  it("refresh and resume do not extend login", () => {
    const first = startNativeSession("user", 1000);
    expect(nativeSessionWindow("user", 9000)).toEqual(first);
  });
  it("a fresh login starts a new window and signout clears it", () => {
    startNativeSession("user", 1000);
    expect(startNativeSession("user", 5000).expiresAt).toBe(5000 + 1_209_600_000);
    clearNativeSessionWindow();
    expect(nativeSessionWindow("user", 6000).expiresAt).toBe(6000 + 1_209_600_000);
  });
});