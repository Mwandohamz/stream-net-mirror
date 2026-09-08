import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Link2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContent, type ContentLink } from "@/hooks/useContent";

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

const LinkCard = ({ link, unlocked, onUnlockClick }: { link: ContentLink; unlocked: boolean; onUnlockClick?: () => void }) => {
  const { toast } = useToast();

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-secondary/40 p-3">
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
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="h-8 gap-1 bg-primary text-primary-foreground">
                <ExternalLink size={13} /> Open
              </Button>
            </a>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 border-border text-foreground"
              onClick={() => {
                navigator.clipboard.writeText(link.url);
                toast({ title: "Link copied", description: link.title });
              }}
            >
              <Copy size={13} /> Copy
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="mt-1 h-8 gap-1 border-primary/40 text-foreground" onClick={onUnlockClick}>
            <Lock size={13} /> Unlock to open
          </Button>
        )}
      </div>
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

  return (
    <Card className="bg-card border-border">
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
            {links.map((l) => (
              <LinkCard key={l.id} link={l} unlocked={unlocked} onUnlockClick={onUnlockClick} />
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
