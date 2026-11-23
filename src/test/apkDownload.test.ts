import { describe, expect, it } from "vitest";
import { apkSignInDestination } from "@/lib/apkDownload";

describe("APK download sign-in destination", () => {
  it("uses the existing sign-in route and return parameter", () => {
    expect(apkSignInDestination("/")).toBe("/signin?next=%2F");
  });

  it("preserves the visitor's current path, query and anchor", () => {
    expect(apkSignInDestination("/?source=home#download")).toBe(
      `/signin?next=${encodeURIComponent("/?source=home#download")}`,
    );
  });
});
