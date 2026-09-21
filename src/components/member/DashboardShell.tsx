import { useNavigate } from "react-router-dom";
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
import { LayoutDashboard, Clapperboard, Trophy, LogOut, Settings, Home, CirclePlay } from "lucide-react";
import LogoShowcase from "@/components/LogoShowcase";
import CountdownBadge from "@/components/CountdownBadge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useSubscriber, subscriptionAccessEnd } from "@/hooks/useSubscriber";

export type DashboardTab = "dashboard" | "movies" | "watch" | "football" | "account";

export const DASHBOARD_TABS: { id: DashboardTab; label: string; short: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", short: "Dashboard", icon: LayoutDashboard },
  { id: "movies", label: "Movies & Series", short: "Movies", icon: Clapperboard },
  { id: "watch", label: "Watch", short: "Watch", icon: CirclePlay },
  { id: "football", label: "Football", short: "Football", icon: Trophy },
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
  const { profile } = useProfile();
  const { subscription } = useSubscriber();
  const accessEnd = subscription ? subscriptionAccessEnd(subscription) : null;

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
    <div className="theme-dashboard min-h-screen bg-background font-sans">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-full items-center justify-between px-3 md:px-5">
          <div className="flex items-center gap-2">
            <LogoShowcase size="md" />
            <span className="dashboard-heading text-sm font-bold md:text-base">STREAMNETMIRROR</span>
          </div>

          <div className="flex items-center gap-2">
            {accessEnd && <CountdownBadge target={accessEnd} prefix="Ends in" className="hidden sm:inline-flex" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 rounded-full border border-border p-1 pr-2" aria-label="Open profile menu">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={(profile as any)?.avatar_url || undefined} alt={profile?.full_name || "Profile"} />
                    <AvatarFallback className="bg-secondary text-[11px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block max-w-[120px] truncate text-xs text-foreground">
                    {profile?.full_name || profile?.email || "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel className="truncate">{profile?.email}</DropdownMenuLabel>
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

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-14 bottom-0 z-30 hidden w-60 flex-col justify-between overflow-y-auto border-r border-border bg-card/60 p-4 md:flex">
        <div>
          <p className="px-3 pb-3 pt-2 text-[10px] font-semibold uppercase text-muted-foreground/70">Member app</p>
          <nav className="space-y-1">
            {DASHBOARD_TABS.map((t) => (
              <Button
                variant="ghost"
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`h-11 w-full justify-start gap-3 rounded-lg px-3 text-sm transition-colors ${
                  tab === t.id ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <t.icon size={18} /> {t.label}
              </Button>
            ))}
          </nav>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
          <LogOut size={16} /> Sign out
        </Button>
      </aside>


      <main className="px-3 pb-28 pt-20 md:ml-60 md:px-8 md:pb-10 md:pt-24">
        <div className="mx-auto max-w-5xl space-y-6">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-[72px] grid-cols-5 border-t border-border bg-background/95 px-1 backdrop-blur md:hidden" aria-label="Dashboard navigation">
        {DASHBOARD_TABS.map((t, index) => (
          <Button
            variant="ghost"
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`relative h-[72px] min-w-0 flex-col items-center gap-1 rounded-none px-0 text-[10px] ${
              t.id === "watch" ? "-top-4" : ""} ${
              tab === t.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span className={t.id === "watch" ? "grid h-12 w-12 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg" : "grid h-7 place-items-center"}>
              <t.icon size={t.id === "watch" ? 23 : 20} className={t.id === "watch" ? "fill-current" : ""} />
            </span>
            <span className={index === 2 ? "font-semibold text-primary" : "truncate"}>{t.short}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
};

export default DashboardShell;
