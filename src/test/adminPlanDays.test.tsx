import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  toast: vi.fn(),
  reload: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ insert: mocks.insert }) },
}));
vi.mock("@/components/admin/AdminLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/hooks/usePlans", () => ({
  usePlans: () => ({ plans: [], loading: false, reload: mocks.reload }),
  planIntervalLabel: () => "",
}));
vi.mock("@/hooks/useContent", () => ({ useContent: () => ({ categories: [] }) }));
vi.mock("@/hooks/useFxRates", () => ({ useFxRates: () => ({ convertFromUSD: () => null }) }));

import AdminPlans from "@/pages/admin/Plans";

describe("admin plan duration entry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insert.mockResolvedValue({ error: null });
    render(<AdminPlans />);
    fireEvent.click(screen.getByRole("button", { name: "New Plan" }));
    fireEvent.change(screen.getByPlaceholderText("Monthly"), { target: { value: "Test plan" } });
  });
  afterEach(cleanup);

  it("allows clearing 30 and saves the replacement as exactly 45 days, not 145", async () => {
    const days = screen.getByLabelText("Access duration (days)") as HTMLInputElement;
    expect(days.value).toBe("30");
    fireEvent.change(days, { target: { value: "" } });
    expect(days.value).toBe("");
    // Append keystrokes to the displayed value, reproducing backspace then typing.
    fireEvent.change(days, { target: { value: days.value + "4" } });
    fireEvent.change(days, { target: { value: days.value + "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save", exact: true }));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ interval: "day", interval_count: 45 })));
  });

  it.each(["", "0", "-1", "1.5"])("rejects invalid duration %j without saving", (value) => {
    fireEvent.change(screen.getByLabelText("Access duration (days)"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Save", exact: true }));
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
  });
});