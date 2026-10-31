import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), native: vi.fn(), open: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock("@/lib/native", () => ({ isNativeApp: mocks.native }));
vi.mock("@capacitor/browser", () => ({ Browser: { open: mocks.open } }));
import { openStreamInBrowser } from "@/lib/streamBrowser";

describe("explicit streaming browser fallback", () => {
  beforeEach(() => { vi.restoreAllMocks(); mocks.native.mockReturnValue(false); });
  it("opens the freshly entitled URL rather than a cached source", async () => {
    const replace = vi.fn();
    const tab = { opener: {}, location: { replace }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    mocks.rpc.mockReturnValue({ abortSignal: () => Promise.resolve({ data: [{ url: "https://example.org/current" }] }) });
    await openStreamInBrowser("server-2");
    expect(mocks.rpc).toHaveBeenCalledWith("resolve_watch_link", { p_link_id: "server-2", p_platform: "web" });
    expect(replace).toHaveBeenCalledWith("https://example.org/current");
    expect(tab.opener).toBeNull();
  });
  it("does not open playback when the access check rejects the link", async () => {
    const tab = { location: { replace: vi.fn() }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    mocks.rpc.mockReturnValue({ abortSignal: () => Promise.resolve({ data: [] }) });
    await expect(openStreamInBrowser("locked")).rejects.toThrow("Stream unavailable");
    expect(tab.location.replace).not.toHaveBeenCalled();
    expect(tab.close).toHaveBeenCalled();
  });
  it("opens native fallback with the browser plugin, not the embedded player", async () => {
    mocks.native.mockReturnValue(true);
    mocks.rpc.mockReturnValue({ abortSignal: () => Promise.resolve({ data: [{ url: "https://example.org/live" }] }) });
    await openStreamInBrowser("native-link");
    expect(mocks.open).toHaveBeenCalledWith({ url: "https://example.org/live", presentationStyle: "fullscreen" });
  });
});