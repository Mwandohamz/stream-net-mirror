import { describe, expect, it } from "vitest";
import { FRAME_TIMEOUT_MS, isSafeStreamUrl, isStreamingCategory, normalizeEmbedMode, watchPath } from "@/lib/watchPlayback";
import { toAbsoluteAssetUrl } from "@/lib/assetUrl";

describe("in-app playback rules", () => {
  it("routes only NetMirror and live sports as streaming categories", () => {
    expect(isStreamingCategory("netmirror")).toBe(true);
    expect(isStreamingCategory("live-sports")).toBe(true);
    expect(isStreamingCategory("downloads")).toBe(false);
    expect(isStreamingCategory("software")).toBe(false);
  });
  it("keeps every stream inside the app and defaults to iframe", () => {
    expect(normalizeEmbedMode("webview")).toBe("webview");
    expect(normalizeEmbedMode("external")).toBe("iframe");
    expect(normalizeEmbedMode(undefined)).toBe("iframe");
    expect(normalizeEmbedMode("unknown")).toBe("iframe");
  });
  it("identifies a stream only by its route id", () => { expect(watchPath("abc")).toBe("/watch/abc"); });
  it("offers recovery after six seconds", () => { expect(FRAME_TIMEOUT_MS).toBe(6000); });
  it("rejects executable URLs", () => {
    expect(isSafeStreamUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeStreamUrl("https://example.org/live")).toBe(true);
  });
});

describe("native asset URLs", () => {
  it("uses the real production host for root-relative pointers", () => {
    expect(toAbsoluteAssetUrl("/__l5e/assets-v1/id/logo.png")).toBe("https://streamnetmirror.app/__l5e/assets-v1/id/logo.png");
  });
  it("leaves absolute and bundled imports intact", () => {
    expect(toAbsoluteAssetUrl("https://example.org/image.png")).toBe("https://example.org/image.png");
    expect(toAbsoluteAssetUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
  });
});