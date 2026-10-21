import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Play } from "lucide-react";
import { useFixtures, type Fixture } from "@/hooks/useFixtures";
import { useMembership } from "@/hooks/useMembership";
import { fixtureStatus, fixturesWatchDestination, formatKickoff, LEAGUE_OPTIONS } from "@/lib/fixtures";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WatchHub from "@/components/member/WatchHub";

export default function UpcomingFixtures({ onUnlock }: { onUnlock?: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const competition = LEAGUE_OPTIONS.some(o => o.code === searchParams.get("league")) ? searchParams.get("league")! : "all";
  const [pickerFor, setPickerFor] = useState<Fixture | null>(null);
  const { fixtures, loading, error } = useFixtures(competition);
  const membership = useMembership();
  const navigate = useNavigate();

  const selectLeague = (code: string) => {
    const next = new URLSearchParams(searchParams);
    if (code === "all") next.delete("league"); else next.set("league", code);
    setSearchParams(next, { replace: true });
  };

  const watch = (fixture: Fixture) => {
    const destination = fixturesWatchDestination(membership.isMember, membership.state);
    if (destination) { if (onUnlock) onUnlock(); else navigate(destination); }
    else setPickerFor(fixture);
  };

  return <section className="space-y-4" aria-label="Upcoming Fixtures">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="dashboard-heading text-xl font-semibold text-foreground">Upcoming Fixtures</h2>
    </div>
    <Tabs value={competition} onValueChange={selectLeague}>
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4" aria-label="Choose a league">
        {LEAGUE_OPTIONS.map(option => <TabsTrigger key={option.code} value={option.code} className="text-xs sm:text-sm">{option.label}</TabsTrigger>)}
      </TabsList>
    </Tabs>
    {loading ? <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 size={18} className="animate-spin" /> Loading fixtures…</div> : error ? <p role="status" className="py-6 text-sm text-muted-foreground">Fixtures are temporarily unavailable.</p> : fixtures.length === 0 ? <p role="status" className="py-6 text-sm text-muted-foreground">Fixtures update shortly</p> : <div className="divide-y divide-border border-y border-border">
      {fixtures.map(fixture => <article key={fixture.id} className="flex flex-wrap items-center gap-3 py-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{LEAGUE_OPTIONS.find(o => o.code === fixture.competition_code)?.label ?? fixture.competition_name}</Badge><Badge variant={fixtureStatus(fixture.status) === "Live" ? "default" : "secondary"}>{fixtureStatus(fixture.status)}</Badge></div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-foreground">
            <span className="flex min-w-0 items-center gap-2">{fixture.home_crest_url && <img src={fixture.home_crest_url} alt="" loading="lazy" className="h-6 w-6 shrink-0 object-contain" onError={e => { e.currentTarget.hidden = true; }} />}<span className="break-words">{fixture.home_team}</span></span>
            <span className="text-xs text-muted-foreground">vs</span>
            <span className="flex min-w-0 items-center gap-2">{fixture.away_crest_url && <img src={fixture.away_crest_url} alt="" loading="lazy" className="h-6 w-6 shrink-0 object-contain" onError={e => { e.currentTarget.hidden = true; }} />}<span className="break-words">{fixture.away_team}</span></span>
          </div>
          <time dateTime={fixture.kickoff_utc} className="block text-xs text-muted-foreground">{formatKickoff(fixture.kickoff_utc)}</time>
        </div>
        <Button size="sm" className="shrink-0 gap-1.5" disabled={membership.loading} onClick={() => watch(fixture)}><Play size={14} /> Watch</Button>
      </article>)}
    </div>}
    <Dialog open={!!pickerFor} onOpenChange={open => !open && setPickerFor(null)}>
      <DialogContent className="theme-dashboard max-h-[85dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pickerFor ? `Watch ${pickerFor.home_team} vs ${pickerFor.away_team}` : "Choose a live sports platform"}</DialogTitle>
          <DialogDescription>Pick a platform below to see every link available for streaming this match.</DialogDescription>
        </DialogHeader>
        <WatchHub sportsOnly unlocked={membership.isMember} onUnlockClick={() => navigate("/payment")} />
      </DialogContent>
    </Dialog>
  </section>;
}
