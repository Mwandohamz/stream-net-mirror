import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Link2, Lock, Play, RefreshCw } from "lucide-react";
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
  { name: "Sky Sports", aliases: ["sky sports", "sky"], logo: skyLogo.url, monogram: "SKY" },
  { name: "UEFA", aliases: ["uefa", "champions league", "ucl"], logo: uefaLogo.url, monogram: "UEFA" },
  { name: "EPL", aliases: ["premier league", "epl"], logo: eplLogo.url, monogram: "EPL" },
  { name: "LaLiga", aliases: ["laliga", "la liga"], logo: laligaLogo.url, monogram: "LALIGA" },
];

const keyFor = (link: ContentLink) => `${link.title.trim().toLowerCase()}|${link.platform}`;

const WatchHub = ({ unlocked, onUnlockClick }: { unlocked: boolean; onUnlockClick: () => void }) => {
  const { categories, links, loading } = useContent();
  const [selected, setSelected] = useState<{ platform: FeaturedPlatform; links: ContentLink[] } | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const activeCategoryIds = useMemo(
    () => new Set(categories.filter((category) => ["netmirror", "live-sports"].includes(category.slug)).map((category) => category.id)),
    [categories],
  );
  const relevantLinks = useMemo(() => links.filter((link) => activeCategoryIds.has(link.category_id)), [activeCategoryIds, links]);

  const grouped = useMemo(() => {
    const groups = new Map<string, ContentLink[]>();
    relevantLinks.forEach((link) => {
      const key = keyFor(link);
      groups.set(key, [...(groups.get(key) ?? []), link]);
    });
    return [...groups.values()];
  }, [relevantLinks]);

  const featuredGroups = useMemo(() => FEATURED.map((platform) => ({
    platform,
    links: grouped.find((group) => {
      const searchable = `${group[0]?.title ?? ""} ${group[0]?.platform ?? ""}`.toLowerCase();
      return platform.aliases.some((alias) => searchable.includes(alias));
    }) ?? [],
  })), [grouped]);

  const usedIds = new Set(featuredGroups.flatMap((group) => group.links.map((link) => link.id)));
  const remaining = grouped.filter((group) => !group.some((link) => usedIds.has(link.id)));

  const requestOpen = (url: string) => {
    try {
      if (sessionStorage.getItem(ROTATION_ACK_KEY) === "1") {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
    } catch {
      // Private browsing can disable session storage; the notice remains available.
    }
    setSelected(null);
    setPendingUrl(url);
  };

  const confirmOpen = () => {
    const url = pendingUrl;
    setPendingUrl(null);
    if (!url) return;
    try { sessionStorage.setItem(ROTATION_ACK_KEY, "1"); } catch { /* no-op */ }
    window.open(url, "_blank", "noopener,noreferrer");
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
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <span className="h-2 w-2 rounded-full bg-primary" /> Your streaming hub
        </div>
        <h1 id="watch-heading" className="dashboard-heading text-3xl leading-tight text-foreground md:text-5xl">What do you want to watch?</h1>
        <p className="max-w-xl text-sm text-muted-foreground md:text-base">Choose a platform. We keep its available links together and refresh them when they change.</p>
      </div>

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
              <Button key={link.id} className="h-11 w-full justify-between" onClick={() => requestOpen(link.url)}>
                {selected.links.length > 1 ? `Open link ${index + 1}` : "Open platform"}<ExternalLink size={16} />
              </Button>
            )) : (
              <div className="rounded-lg border border-border bg-secondary p-4 text-sm text-muted-foreground">No active link is published for this platform yet. Please check More platforms or try again later.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingUrl} onOpenChange={(open) => !open && setPendingUrl(null)}>
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