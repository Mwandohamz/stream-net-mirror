import { describe, expect, it } from "vitest";
import { emailVerificationUrl, verificationDestination } from "@/lib/emailVerification";

describe("email verification destinations", () => {
  it("uses the official domain from preview and bundled native origins", () => {
    for (const origin of ["https://preview.lovable.app", "https://localhost", "capacitor://localhost"]) {
      expect(emailVerificationUrl(origin, null)).toBe("https://streamnetmirror.app/verify");
    }
  });
  it("lands verification emails on the public help route", () => {
    expect(emailVerificationUrl("https://streamnetmirror.app", null)).toBe("https://streamnetmirror.app/verify");
  });

  it("preserves checkout through verification", () => {
    const url = new URL(emailVerificationUrl("https://streamnetmirror.app", "/payment?plan=monthly"));
    expect(url.pathname).toBe("/verify");
    expect(verificationDestination(url.searchParams.get("next"))).toBe("/payment?plan=monthly");
  });

  it("does not forward users to external destinations", () => {
    for (const next of ["https://example.com", "//example.com", "/\\example.com"]) {
      expect(verificationDestination(next)).toBe("/dashboard");
    }
  });
});