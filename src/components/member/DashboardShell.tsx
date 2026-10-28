import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clapperboard, Volleyball, LogOut, Settings, Home, Play, ChevronDown, Menu, Receipt } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import NotificationInbox from "@/components/member/NotificationInbox";
import playNeon from "@/assets/brand/play-neon.png.asset.json";
import { LEAGUE_OPTIONS } from "@/lib/fixtures";
import LogoShowcase from "@/components/LogoShowcase";
import CountdownBadge from "@/components/CountdownBadge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import WelcomeGreeting from "@/components/member/WelcomeGreeting";
import { useSubscriber, subscriptionAccessEnd } from "@/hooks/useSubscriber";
import { DEFAULT_PROFILE_AVATAR } from "@/lib/profileAvatars";
import moviesBackdrop from "@/assets/dashboard-movies.jpg";
import footballBackdrop from "@/assets/dashboard-football.jpg";
import logoAsset from "@/assets/brand/streamnetmirror-logo.png.asset.json";
import { toAbsoluteAssetUrl } from "@/lib/assetUrl";
import ApkDownloadButton from "@/components/ApkDownloadButton";

export type DashboardTab = "dashboard" | "movies" | "watch" | "football" | "account";

export const DASHBOARD_TABS: { id: DashboardTab; label: string; short: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Home", short: "Home", icon: Home },
  { id: "movies", label: "Movies & Series", short: "Movies", icon: Clapperboard },
  { id: "watch", label: "Watch", short: "Watch", icon: Play },
  { id: "football", label: "Football", short: "Football", icon: Volleyball },
  { id: "account", label: "Account", short: "Account", icon: Settings },
];


interface Props {
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: React.ReactNode;
}

/** App-style dashboard frame: sidebar on desktop, bottom bar on mobile. */
const DashboardShell = ({ tab, onTabChange, children }: Props) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeLeague = searchParams.get("league") ?? "all";
  const [leaguesOpen, setLeaguesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const changeTab = (next: DashboardTab) => { onTabChange(next); setMenuOpen(false); };
  const openLeague = (code: string) => {
    const next = new URLSearchParams(searchParams);
    if (code === "all") next.delete("league"); else next.set("league", code);
    next.set("tab", "football");
    setSearchParams(next, { replace: true });
    onTabChange("football");
    setMenuOpen(false);
  };
  const { profile } = useProfile();
  const { subscription } = useSubscriber();
  const accessEnd = subscription ? subscriptionAccessEnd(subscription) : null;
  const backdrop = tab === "movies" ? moviesBackdrop : tab === "football" ? footballBackdrop : tab === "watch" ? toAbsoluteAssetUrl(logoAsset.url) : null;

  const initials = (profile?.full_name || profile?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className={`theme-dashboard dashboard-tab-${tab} relative min-h-screen overflow-hidden bg-background font-sans`}>
      <WelcomeGreeting userId={profile?.id} name={profile?.full_name} />
      {backdrop && (
        <div className="pointer-events-none fixed inset-0 z-0 md:left-60" aria-hidden="true">
          <img
            src={backdrop}
            alt=""
            width={1600}
            height={900}
            className={`h-full w-full object-cover ${tab === "watch" ? "scale-75 opacity-20 blur-[1px]" : "opacity-45"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/75 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/50" />
        </div>
      )}
      {/* Top bar */}
      <header className="dashboard-topbar fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-full items-center justify-between px-3 md:px-5">
          <Button variant="ghost" size="icon" aria-label="Open navigation menu" className="mr-1 h-10 w-10 shrink-0 md:hidden" onClick={() => setMenuOpen(true)}><Menu size={21} /></Button>
          <Button variant="ghost" className="h-auto min-w-0 gap-2 px-0 hover:bg-transparent" aria-label="Go to dashboard home" onClick={() => onTabChange("dashboard")}>
            <LogoShowcase size="md" />
            <span className="dashboard-heading min-w-0 truncate text-xs font-bold sm:text-sm md:text-base">STREAMNETMIRROR</span>
          </Button>

          <div className="flex items-center gap-2">
            <NotificationInbox />
            {accessEnd && <CountdownBadge target={accessEnd} prefix="Ends in" className="hidden sm:inline-flex" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 rounded-full border border-border p-1 pr-2" aria-label="Open profile menu">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={toAbsoluteAssetUrl(profile?.avatar_url || DEFAULT_PROFILE_AVATAR)} alt={profile?.full_name || "Profile"} />
                    <AvatarFallback className="bg-secondary text-[11px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block max-w-[120px] truncate text-xs text-foreground">
                    {profile?.full_name?.split(" ")[0] || "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel className="truncate">{profile?.full_name || "My account"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTabChange("account")}>
                  <Settings className="mr-2 h-4 w-4" /> Account settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="theme-dashboard flex w-[min(320px,88vw)] flex-col overflow-y-auto border-border bg-background px-4 pb-6 pt-12 text-foreground safe-top">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SheetDescription className="sr-only">Your account, streaming and football</SheetDescription>
          <div className="mb-5 flex items-center gap-3 border-b border-border pb-5">
            <Avatar className="h-14 w-14 shrink-0 border-2 border-primary"><AvatarImage src={toAbsoluteAssetUrl(profile?.avatar_url || DEFAULT_PROFILE_AVATAR)} /><AvatarFallback>{initials}</AvatarFallback></Avatar>
            <div className="min-w-0"><p className="truncate font-semibold">{profile?.full_name || "Account"}</p><p className="break-all text-xs text-muted-foreground">{profile?.email}</p>{accessEnd && <p className="mt-1 text-xs text-primary">Ends {new Date(accessEnd).toLocaleDateString()}</p>}</div>
          </div>
          <nav className="space-y-1" aria-label="Mobile sidebar">
            {DASHBOARD_TABS.map(t => <div key={t.id}><Button variant="ghost" onClick={() => changeTab(t.id)} className={`h-12 w-full justify-start gap-3 ${tab === t.id ? "bg-secondary text-foreground" : "text-muted-foreground"}`}><t.icon size={20} className={t.id === "watch" ? "fill-current text-primary" : ""} />{t.label}</Button>
              {t.id === "football" && <div className="ml-8 border-l border-border pl-2">{LEAGUE_OPTIONS.map(l => <Button key={l.code} variant="ghost" size="sm" className={`h-10 w-full justify-start text-xs ${activeLeague === l.code && tab === "football" ? "text-primary" : "text-muted-foreground"}`} onClick={() => openLeague(l.code)}>{l.label}</Button>)}</div>}
            </div>)}
            <Button variant="ghost" className="h-12 w-full justify-start gap-3 text-muted-foreground" onClick={() => { changeTab("account"); setTimeout(() => document.getElementById("transaction-history")?.scrollIntoView({ behavior: "smooth" }), 100); }}><Receipt size={20} /> Transaction history</Button>
          </nav>
          <div className="mt-auto space-y-2 border-t border-border pt-4"><ApkDownloadButton label="Download App" variant="outline" className="h-11 w-full gap-2" /><Button variant="ghost" className="h-11 w-full justify-start gap-3 text-muted-foreground" onClick={signOut}><LogOut size={18} /> Sign out</Button></div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-14 bottom-0 z-30 hidden w-60 flex-col justify-between overflow-y-auto border-r border-border bg-card/60 p-4 md:flex">
        <div>
          <p className="px-3 pb-3 pt-2 text-[10px] font-semibold uppercase text-muted-foreground/70">Member app</p>
          <nav className="space-y-1">
            {DASHBOARD_TABS.map((t) => (
              <div key={t.id}>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => onTabChange(t.id)}
                    className={`h-11 min-w-0 flex-1 justify-start gap-3 rounded-lg px-3 text-sm transition-colors ${
                      tab === t.id ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <t.icon size={18} /> {t.label}
                  </Button>
                  {t.id === "football" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Show leagues"
                      aria-expanded={leaguesOpen || tab === "football"}
                      onClick={() => setLeaguesOpen((open) => !open)}
                      className={`h-11 w-8 shrink-0 rounded-lg ${tab === "football" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <ChevronDown size={16} className={`transition-transform ${leaguesOpen || tab === "football" ? "rotate-180" : ""}`} />
                    </Button>
                  )}
                </div>
                {t.id === "football" && (leaguesOpen || tab === "football") && (
                  <div className="ml-9 mt-1 space-y-0.5 border-l border-border pl-3">
                    {LEAGUE_OPTIONS.map((league) => (
                      <Button
                        key={league.code}
                        variant="ghost"
                        size="sm"
                        onClick={() => openLeague(league.code)}
                        className={`h-8 w-full justify-start rounded-md px-2 text-xs ${
                          tab === "football" && activeLeague === league.code ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {league.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
        <div className="space-y-1 border-t border-border pt-3">
          <ApkDownloadButton label="Download App" variant="ghost" className="w-full justify-start gap-2 px-3 text-muted-foreground hover:text-foreground" />
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </aside>


      <main className="dashboard-content relative z-10 px-3 pb-28 pt-20 md:ml-60 md:px-8 md:pb-10 md:pt-24">
        <div className="mx-auto max-w-5xl space-y-6">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="dashboard-bottom-nav fixed bottom-0 left-0 right-0 z-40 grid h-[72px] grid-cols-5 border-t border-border bg-background/95 px-1 backdrop-blur md:hidden" aria-label="Dashboard navigation">
        {DASHBOARD_TABS.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => onTabChange(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={`relative flex h-[72px] min-w-0 flex-col items-center justify-end gap-1 bg-transparent pb-2 text-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tab === t.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {t.id === "watch" ? (
              <span className="streaming-play-surface absolute -top-6 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full ring-4 ring-background">
                <Play size={24} className="ml-0.5 fill-current text-primary-foreground" />
              </span>
            ) : (
              <span className="grid h-7 place-items-center"><t.icon size={20} /></span>
            )}
            <span className={t.id === "watch" ? "font-semibold" : "truncate"}>{t.short}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default DashboardShell;
