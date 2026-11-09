import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ browser: vi.fn(), toast: vi.fn() }));
vi.mock("@/lib/streamBrowser", () => ({ openStreamInBrowser: mocks.browser }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
import StreamLaunchDialog from "@/components/member/StreamLaunchDialog";

describe("stream launch choice", () => {
  beforeEach(() => vi.clearAllMocks());
  it("waits for explicit in-app selection before starting playback", () => {
    const launch = vi.fn();
    render(<StreamLaunchDialog link={{ id: "uefa-3", title: "UEFA" }} onClose={vi.fn()} onInApp={launch} />);
    expect(launch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open in app" }));
    expect(launch).toHaveBeenCalledWith("uefa-3");
    expect(mocks.browser).not.toHaveBeenCalled();
  });
  it("resolves the selected server only when external playback is chosen", async () => {
    mocks.browser.mockResolvedValue(undefined);
    const launch = vi.fn();
    render(<StreamLaunchDialog link={{ id: "netflix-2", title: "Netflix" }} onClose={vi.fn()} onInApp={launch} />);
    fireEvent.click(screen.getByRole("button", { name: "External website" }));
    await waitFor(() => expect(mocks.browser).toHaveBeenCalledWith("netflix-2"));
    expect(launch).not.toHaveBeenCalled();
  });
});