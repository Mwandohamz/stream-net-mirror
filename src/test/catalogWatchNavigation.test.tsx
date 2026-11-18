import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import MemberDashboard from "@/pages/MemberDashboard";

vi.stubGlobal("IntersectionObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});
afterEach(cleanup);

vi.mock("@/hooks/useMembership", () => ({
  useMembership: () => ({ isMember: true, state: "active", loading: false, ctaHref: "/dashboard" }),
}));
vi.mock("@/hooks/useAppSettings", () => ({ useAppSettings: () => ({ settings: {} }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
}));
vi.mock("@/components/member/DashboardShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/member/WatchHub", () => ({ default: () => <div data-testid="platform-picker" /> }));
vi.mock("@/components/member/CategoryLinks", () => ({ default: () => null }));
vi.mock("@/components/member/AccountOverviewCard", () => ({ default: () => null }));
vi.mock("@/components/member/AccountActivity", () => ({ default: () => null }));
vi.mock("@/components/UpcomingFixtures", () => ({ default: () => null }));
vi.mock("@/components/FootballHighlights", () => ({ default: () => null }));
vi.mock("@/components/ApkDownloadButton", () => ({ default: () => null }));
vi.mock("@/context/CurrencyContext", () => ({
  useDisplayCurrency: () => ({ country: { iso2: "ZM" }, countries: [], setCountryIso2: vi.fn() }),
}));
vi.mock("@/hooks/useTMDBProviders", () => ({ useTMDBProviders: () => ({ data: [] }) }));
vi.mock("@/hooks/useCatalog", () => ({
  useCatalog: () => ({ data: { results: [{ id: 1, title: "Test movie", genre_ids: [], vote_average: 8 }], total_pages: 1 } }),
}));

function HistoryControls() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Back</button>;
}

describe("member catalogue Watch navigation", () => {
  it("switches from a movie card to the platform picker and restores Movies on Back", async () => {
    render(<MemoryRouter initialEntries={["/dashboard?tab=movies"]}><HistoryControls /><MemberDashboard /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole("button", { name: "Watch now" })[0]);
    await waitFor(() => expect(screen.getByTestId("platform-picker")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Watch now" }).length).toBeGreaterThan(0));
    expect(screen.queryByTestId("platform-picker")).not.toBeInTheDocument();
  });

  it("switches from the title details dialog to the platform picker", async () => {
    render(<MemoryRouter initialEntries={["/dashboard?tab=movies"]}><MemberDashboard /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole("button", { name: "More information about Test movie" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Watch now" }));
    await waitFor(() => expect(screen.getByTestId("platform-picker")).toBeInTheDocument());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});