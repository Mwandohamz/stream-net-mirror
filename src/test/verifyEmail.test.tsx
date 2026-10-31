import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VerifyEmail from "@/pages/VerifyEmail";

const auth = vi.hoisted(() => ({
  getUser: vi.fn(), verifyOtp: vi.fn(), resend: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
vi.mock("@/lib/native", () => ({ isNativeApp: () => false }));
vi.mock("@/components/AuthShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

function mount() {
  render(<MemoryRouter initialEntries={[{ pathname: "/verify", state: { email: "member@example.test" } }]}>
    <Routes><Route path="/verify" element={<VerifyEmail />} /><Route path="/dashboard" element={<div data-testid="dashboard" />} /></Routes>
  </MemoryRouter>);
}

describe("email code verification", () => {
  beforeEach(() => { cleanup(); vi.clearAllMocks(); auth.getUser.mockResolvedValue({ data: { user: null } }); });
  it("verifies the signup code and enters the dashboard only with a confirmed account session", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: { user: { id: "user" } }, user: { id: "user", email_confirmed_at: "2026-10-31T11:00:00Z" } }, error: null });
    mount();
    fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify email", exact: true }));
    await waitFor(() => expect(screen.queryByTestId("dashboard")).not.toBeNull());
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: "member@example.test", token: "123456", type: "signup" });
  });
  it("does not enter the dashboard when verification fails", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: null, user: null }, error: { message: "Expired" } });
    mount();
    fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify email", exact: true }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeNull());
    expect(auth.verifyOtp).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("dashboard")).toBeNull();
  });
});