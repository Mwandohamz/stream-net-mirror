import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Play } from "lucide-react";
import { useFixtures } from "@/hooks/useFixtures";
import { useMembership } from "@/hooks/useMembership";
import { fixtureStatus, fixturesWatchDestination, formatKickoff, LEAGUE_OPTIONS } from "@/lib/fixtures";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WatchHub from "@/components/member/WatchHub";

export default function UpcomingFixtures({ onUnlock }: { onUnlock?: () => void }) {
  const [competition, setCompetition] = useState("all");
  const [picker, setPicker] = useState(false);
  const { fixtures, loading, error } = useFixtures(competition);
  const membership = useMembership();
  const navigate = useNavigate();
  const watch = () => {
    const destination = fixturesWatchDestination(membership.isMember, membership.state);
    if (destination) { if (onUnlock) onUnlock(); else navigate(destination); }
    else setPicker(true);
  };
  return <section className="space-y-4" aria-label="Upcoming Fixtures">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="dashboard-heading text-xl font-semibold text-foreground">Upcoming Fixtures</h2>
      <Select value={competition} onValueChange={setCompetition}>
        <SelectTrigger className="w-48" aria-label="Filter fixtures by competition"><SelectValue /></SelectTrigger>
        <SelectContent>{LEAGUE_OPTIONS.map(option => <SelectItem key={option.code} value={option.code}>{option.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
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
        <Button size="sm" className="shrink-0 gap-1.5" disabled={membership.loading} onClick={watch}><Play size={14} /> Watch</Button>
      </article>)}
    </div>}
    <Dialog open={picker} onOpenChange={setPicker}><DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Choose a live sports platform</DialogTitle></DialogHeader><WatchHub sportsOnly unlocked={membership.isMember} onUnlockClick={() => navigate("/payment")} /></DialogContent></Dialog>
  </section>;
}