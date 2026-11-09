import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link2, Lock, Play } from "lucide-react";
import { useContent, type ContentLink } from "@/hooks/useContent";
import { openExternalUrl } from "@/lib/native";
import { useNavigate } from "react-router-dom";
import { isStreamingCategory, watchPath } from "@/lib/watchPlayback";
import StreamLaunchDialog from "@/components/member/StreamLaunchDialog";

const PLATFORM_LABEL: Record<string, string> = {
  web: "Web / Laptop",
  android: "Android",
  ios: "iPhone / iPad",
  tv: "Smart TV",
  software: "Software tool",
};

interface Props {
  /** Category slug: "netmirror", "live-sports", "downloads", … */
  slug: string;
  /** When false, links are blurred behind a lock for unpaid accounts. */
  unlocked?: boolean;
  onUnlockClick?: () => void;
}

/** One card can carry several URLs for the same title — each becomes its own button. */
const LinkCard = ({ links, slug, unlocked, onUnlockClick }: { links: ContentLink[]; slug: string; unlocked: boolean; onUnlockClick?: () => void }) => {
  const navigate = useNavigate();
  const link = links[0];
  const [pending, setPending] = useState<ContentLink | null>(null);
  const request = (item: ContentLink) => {
    if (isStreamingCategory(slug)) setPending(item);
    else void openExternalUrl(item.url);
  };


  return (
    <div className="flex gap-3 rounded-lg border border-border/80 bg-card/75 p-3 shadow-lg backdrop-blur-md">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-background flex items-center justify-center">
        {link.logo_url ? (
          <img src={link.logo_url} alt={link.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <Link2 size={18} className="text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{link.title}</p>
          <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">
            {PLATFORM_LABEL[link.platform] ?? link.platform}
          </Badge>
        </div>
        {link.description && <p className="text-xs text-muted-foreground leading-relaxed">{link.description}</p>}
        {unlocked ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {links.map((l, i) => (
              <div key={l.id} className="flex gap-1">
              <Button
                size="sm"
                className="h-8 gap-1 bg-primary text-primary-foreground"
                onClick={() => request(l)}
              >
                <Play size={13} /> {links.length > 1 ? `Server ${i + 1}` : "Watch now"}
              </Button>
              </div>
            ))}
          </div>
        ) : (
          <Button size="sm" variant="outline" className="mt-1 h-8 gap-1 border-primary/40 text-foreground" onClick={onUnlockClick}>
            <Lock size={13} /> Unlock to open
          </Button>
        )}
      </div>

      <StreamLaunchDialog link={pending} onClose={() => setPending(null)} onInApp={(id) => navigate(watchPath(id))} />
    </div>
  );
};

/** Renders one admin-managed category and all of its links. */
const CategoryLinks = ({ slug, unlocked = true, onUnlockClick }: Props) => {
  const { categoryBySlug, linksFor, loading } = useContent();
  const category = categoryBySlug(slug);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!category) {
    return <p className="text-sm text-muted-foreground">This section is being set up. Check back shortly.</p>;
  }

  const links = linksFor(category.id);

  // Links sharing a title and platform are the same item with backup URLs:
  // show them as one card with several buttons.
  const groups: ContentLink[][] = [];
  const groupIndex = new Map<string, number>();
  for (const l of links) {
    const key = `${l.title.trim().toLowerCase()}|${l.platform}`;
    const at = groupIndex.get(key);
    if (at === undefined) {
      groupIndex.set(key, groups.length);
      groups.push([l]);
    } else {
      groups[at].push(l);
    }
  }


  return (
    <Card className="border-border/80 bg-card/75 shadow-2xl backdrop-blur-xl">
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="netflix-title text-lg md:text-xl text-foreground">{category.name.toUpperCase()}</h2>
          {category.description && (
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{category.description}</p>
          )}
        </div>

        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">No links published here yet — we add and verify new ones regularly.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((g) => (
              <LinkCard key={g[0].id} links={g} slug={slug} unlocked={unlocked} onUnlockClick={onUnlockClick} />
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          We find, test and refresh these links so they keep working. The sites themselves belong to third parties — we
          provide the access and the support, but we are not responsible for what those sites do. Never enter personal
          details or card information on them.
        </p>
      </CardContent>
    </Card>
  );
};

export default CategoryLinks;
