/** Native entertainment routes use the account dashboard, never website pages. */
export function nativeDashboardDestination(pathname: string, search = ""): string | null {
  switch (pathname) {
    case "/":
    case "/access":
      return "/dashboard";
    case "/movies":
    case "/tv-series":
      return "/dashboard?tab=movies";
    case "/live-sports": {
      const league = new URLSearchParams(search).get("league");
      return `/dashboard?tab=football${league && ["PL", "CL", "PD"].includes(league) ? `&league=${league}` : ""}`;
    }
    default:
      return null;
  }
}

export function nativeEntryDestination(pathname: string, search: string, signedIn: boolean): string | null {
  const dashboard = nativeDashboardDestination(pathname, search);
  if (!dashboard) return null;
  return signedIn ? dashboard : "/signin";
}