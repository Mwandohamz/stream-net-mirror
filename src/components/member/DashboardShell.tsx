import { Link, useNavigate } from "react-router-dom";
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
import { LayoutDashboard, Clapperboard, Trophy, Download, CreditCard, LifeBuoy, LogOut, Settings, Home } from "lucide-react";
import LogoShowcase from "@/components/LogoShowcase";
import CountdownBadge from "@/components/CountdownBadge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useSubscriber, subscriptionAccessEnd } from "@/hooks/useSubscriber";

export type DashboardTab = "overview" | "streaming" | "sports" | "downloads" | "billing" | "support";

export const DASHBOARD_TABS: { id: DashboardTab; label: string; short: string; icon: typeof Home }[] = [
  { id: "overview", label: "Overview", short: "Home", icon: LayoutDashboard },
  { id: "streaming", label: "Streaming", short: "Stream", icon: Clapperboard },
  { id: "sports", label: "Live Sports", short: "Sports", icon: Trophy },
  { id: "downloads", label: "Downloads", short: "Get", icon: Download },
  { id: "billing", label: "Billing", short: "Billing", icon: CreditCard },
  { id: "support", label: "Support", short: "Help", icon: LifeBuoy },
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
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-full items-center justify-between px-3 md:px-5">
          <Link to="/" className="flex items-center gap-2">
            <LogoShowcase size="sm" />
            <span className="netflix-title text-sm md:text-lg text-primary">STREAMNETMIRROR</span>
          </Link>

          <div className="flex items-center gap-2">
            {accessEnd && <CountdownBadge target={accessEnd} prefix="Ends in" className="hidden sm:inline-flex" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border p-1 pr-2" aria-label="Open profile menu">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={(profile as any)?.avatar_url || undefined} alt={profile?.full_name || "Profile"} />
                    <AvatarFallback className="bg-secondary text-[11px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block max-w-[120px] truncate text-xs text-foreground">
                    {profile?.full_name || profile?.email || "Account"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel className="truncate">{profile?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTabChange("overview")}>
                  <Settings className="mr-2 h-4 w-4" /> Account settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange("billing")}>
                  <CreditCard className="mr-2 h-4 w-4" /> Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <Home className="mr-2 h-4 w-4" /> Main site
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-14 bottom-0 z-30 hidden w-56 border-r border-border bg-card/40 p-3 md:block">
        <nav className="space-y-1">
          {DASHBOARD_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                tab === t.id ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-3 right-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile segmented switcher */}
      <div className="fixed top-14 left-0 right-0 z-30 overflow-x-auto border-b border-border bg-background/95 px-3 py-2 backdrop-blur md:hidden">
        <div className="flex gap-2">
          {DASHBOARD_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${
                tab === t.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-3 pb-28 pt-28 md:ml-56 md:px-6 md:pb-10 md:pt-20">
        <div className="mx-auto max-w-3xl space-y-6">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 border-t border-border bg-background/95 backdrop-blur md:hidden">
        {DASHBOARD_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${
              tab === t.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <t.icon size={18} />
            {t.short}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default DashboardShell;
