import { useMemo, useState } from "react";
import { ChevronDown, Link2, Lock, Play, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useContent, type ContentLink } from "@/hooks/useContent";
import netflixLogo from "@/assets/ott/netflix.jpg";
import skyLogo from "@/assets/sports/sky-sports-football.jpg.asset.json";
import uefaLogo from "@/assets/sports/uefa-champions-league.jpg.asset.json";
import eplLogo from "@/assets/sports/premier-league.jpg.asset.json";
import laligaLogo from "@/assets/sports/laliga.jpg.asset.json";
import { useNavigate } from "react-router-dom";
import { watchPath } from "@/lib/watchPlayback";
import { toAbsoluteAssetUrl } from "@/lib/assetUrl";
import { groupLinks } from "@/lib/linkGroups";
import { openStreamInBrowser } from "@/lib/streamBrowser";
import { useToast } from "@/hooks/use-toast";

const ROTATION_ACK_KEY = "link-rotation-acknowledged";

type FeaturedPlatform = {
  name: string;
  aliases: string[];
  logo: string;
  monogram: string;
};

const FEATURED: FeaturedPlatform[] = [
  { name: "Netflix", aliases: ["netflix", "netmirror"], logo: netflixLogo, monogram: "N" },
  { name: "Prime Video", aliases: ["prime", "amazon"], logo: "", monogram: "prime video" },
  { name: "Sky Sports", aliases: ["sky sports", "sky"], logo: toAbsoluteAssetUrl(skyLogo.url), monogram: "SKY" },
  { name: "UEFA", aliases: ["uefa", "champions league", "ucl"], logo: toAbsoluteAssetUrl(uefaLogo.url), monogram: "UEFA" },
  { name: "EPL", aliases: ["premier league", "epl"], logo: toAbsoluteAssetUrl(eplLogo.url), monogram: "EPL" },
  { name: "LaLiga", aliases: ["laliga", "la liga"], logo: toAbsoluteAssetUrl(laligaLogo.url), monogram: "LALIGA" },
];

const WatchHub = ({ unlocked, onUnlockClick, sportsOnly = false }: { unlocked: boolean; onUnlockClick: () => void; sportsOnly?: boolean }) => {
  const navigate = useNavigate();
  const { categories, links, loading } = useContent();
  const [selected, setSelected] = useState<{ platform: FeaturedPlatform; links: ContentLink[] } | null>(null);
  const [pendingLink, setPendingLink] = useState<ContentLink | null>(null);
  const [pendingBrowser, setPendingBrowser] = useState(false);
  const { toast } = useToast();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeCategoryIds = useMemo(
    () => new Set(categories.filter((category) => (sportsOnly ? ["live-sports"] : ["netmirror", "live-sports"]).includes(category.slug)).map((category) => category.id)),
    [categories, sportsOnly],
  );
  const relevantLinks = useMemo(() => links.filter((link) => activeCategoryIds.has(link.category_id)), [activeCategoryIds, links]);

  const grouped = useMemo(() => groupLinks(relevantLinks), [relevantLinks]);

  // A featured platform collects every group whose title matches, so all admin URLs appear in one picker.
  const featuredGroups = useMemo(() => (sportsOnly ? FEATURED.slice(2) : FEATURED).map((platform) => ({
    platform,
    links: grouped
      .filter((group) => platform.aliases.some((alias) => (group[0]?.title ?? "").toLowerCase().includes(alias)))
      .flat(),
  })), [grouped, sportsOnly]);

  const usedIds = new Set(featuredGroups.flatMap((group) => group.links.map((link) => link.id)));
  const remaining = grouped.filter((group) => !group.some((link) => usedIds.has(link.id)));

  const openBrowser = async (link: ContentLink) => {
    try { await openStreamInBrowser(link.id); }
    catch { toast({ title: "Unable to open browser", description: "Allow popups or try another link.", variant: "destructive" }); }
  };

  const requestOpen = (link: ContentLink, browser = false) => {
    setPendingBrowser(browser);
    try {
      if (sessionStorage.getItem(ROTATION_ACK_KEY) === "1") {
        if (browser) void openBrowser(link);
        else navigate(watchPath(link.id));
        return;
      }
    } catch {
      // Private browsing can disable session storage; the notice remains available.
    }
    setSelected(null);
    setPendingLink(link);
  };

  const confirmOpen = () => {
    const link = pendingLink;
    setPendingLink(null);
    if (!link) return;
    try { sessionStorage.setItem(ROTATION_ACK_KEY, "1"); } catch { /* no-op */ }
    if (pendingBrowser) void openBrowser(link);
    else navigate(watchPath(link.id));
  };

  const choosePlatform = (platform: FeaturedPlatform, platformLinks: ContentLink[]) => {
    if (!unlocked) {
      onUnlockClick();
      return;
    }
    setSelected({ platform, links: platformLinks });
  };

  return (
    <section className="space-y-5" aria-labelledby="watch-heading">
      {!sportsOnly && <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <span className="h-2 w-2 rounded-full bg-primary" /> Your streaming hub
        </div>
        <h1 id="watch-heading" className="dashboard-heading text-3xl leading-tight text-foreground md:text-5xl">What do you want to watch?</h1>
        <p className="max-w-xl text-sm text-muted-foreground md:text-base">Choose a platform. We keep its available links together and refresh them when they change.</p>
      </div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {featuredGroups.map(({ platform, links: platformLinks }) => (
          <article key={platform.name} className="group flex min-h-[180px] flex-col overflow-hidden rounded-lg border border-border/80 bg-card/80 shadow-xl backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5 md:min-h-[210px]">
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-secondary/80 p-4">
              <span className="dashboard-heading grid h-20 w-20 place-items-center rounded-lg bg-background px-2 text-center text-base font-bold uppercase text-primary md:h-24 md:w-24">{platform.monogram}</span>
              {platformLinks[0]?.logo_url || platform.logo ? (
                <img src={platformLinks[0]?.logo_url || platform.logo} alt="" className="absolute h-20 w-20 rounded-lg bg-background object-contain md:h-24 md:w-24" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} />
              ) : null}
              {!unlocked && <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-border bg-background/90 text-muted-foreground"><Lock size={14} /></span>}
            </div>
            <div className="space-y-3 p-3">
              <h2 className="dashboard-heading truncate text-base text-foreground">{platform.name}</h2>
              <Button className="h-9 w-full gap-2" onClick={() => choosePlatform(platform, platformLinks)} disabled={loading}>
                {unlocked ? <Play size={15} className="fill-current" /> : <Lock size={14} />}
                {unlocked ? "Watch now" : "Unlock to watch"}
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="border-t border-border pt-4">
        <Button variant="ghost" className="w-full justify-between text-foreground" onClick={() => setMoreOpen((open) => !open)}>
          <span>More platforms {remaining.length > 0 ? `(${remaining.length})` : ""}</span>
          <ChevronDown size={18} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
        </Button>
        {moreOpen && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {remaining.length === 0 ? (
              <p className="col-span-full py-4 text-center text-sm text-muted-foreground">More verified platforms will appear here when they are published.</p>
            ) : remaining.map((group) => (
              <Button
                key={group[0].id}
                variant="outline"
                className="h-auto min-h-14 justify-start gap-3 px-3 py-2 text-left"
                onClick={() => choosePlatform({ name: group[0].title, aliases: [], logo: group[0].logo_url || "", monogram: group[0].title.slice(0, 8) }, group)}
              >
                {group[0].logo_url ? <img src={group[0].logo_url} alt="" className="h-9 w-9 rounded object-contain" /> : <Link2 size={20} className="text-primary" />}
                <span className="min-w-0 flex-1 truncate">{group[0].title}</span>
                {!unlocked && <Lock size={14} className="text-muted-foreground" />}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md rounded-lg border-border bg-popover">
          <DialogHeader>
            <DialogTitle className="dashboard-heading text-xl">Choose a {selected?.platform.name} link</DialogTitle>
            <DialogDescription>Try another link if the first one is busy or unavailable.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {selected?.links.length ? selected.links.map((link, index) => (
              <div key={link.id} className="flex gap-2">
              <Button variant={index === 0 ? "default" : "secondary"} className="h-11 min-w-0 flex-1 justify-between" onClick={() => requestOpen(link)}>
                <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-background/25 text-xs">{index + 1}</span>{selected.platform.name} · Server {index + 1}</span><Play size={16} className="fill-current" />
              </Button>
              <Button variant="outline" className="h-11 shrink-0" size="icon" aria-label={`Open ${selected.platform.name} server ${index + 1} in browser`} title="Open in browser" onClick={() => requestOpen(link, true)}><ExternalLink size={18} /></Button>
              </div>
            )) : (
              <div className="rounded-lg border border-border bg-secondary p-4 text-sm text-muted-foreground">No active link is published for this platform yet. Please check More platforms or try again later.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingLink} onOpenChange={(open) => !open && setPendingLink(null)}>
        <AlertDialogContent className="border-border bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><RefreshCw size={17} className="text-primary" /> Streaming links are refreshed</AlertDialogTitle>
            <AlertDialogDescription>Links can stop working, especially in phone browsers or iPhone webviews. If that happens, return here for the latest replacement.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOpen}>Continue to stream</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default WatchHub;