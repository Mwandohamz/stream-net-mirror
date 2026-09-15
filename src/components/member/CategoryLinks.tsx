import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Link2, Lock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContent, type ContentLink } from "@/hooks/useContent";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ROTATION_ACK_KEY = "link-rotation-acknowledged";

/** The notice is shown once per browser session so it never becomes annoying. */
const rotationAcknowledged = () => {
  try {
    return sessionStorage.getItem(ROTATION_ACK_KEY) === "1";
  } catch {
    return false;
  }
};
const rememberRotationAck = () => {
  try {
    sessionStorage.setItem(ROTATION_ACK_KEY, "1");
  } catch {
    /* private mode — just show it again next time */
  }
};

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
const LinkCard = ({ links, unlocked, onUnlockClick }: { links: ContentLink[]; unlocked: boolean; onUnlockClick?: () => void }) => {
  const { toast } = useToast();
  const link = links[0];
  const [pending, setPending] = useState<{ action: "open" | "copy"; url: string } | null>(null);

  const doOpen = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const doCopy = (url: string) => {
    void navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: link.title });
  };

  const request = (action: "open" | "copy", url: string) => {
    if (rotationAcknowledged()) {
      action === "open" ? doOpen(url) : doCopy(url);
      return;
    }
    setPending({ action, url });
  };

  const confirm = () => {
    rememberRotationAck();
    const p = pending;
    setPending(null);
    if (!p) return;
    if (p.action === "open") doOpen(p.url);
    if (p.action === "copy") doCopy(p.url);
  };


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
            {links.map((l, i) => (
              <Button
                key={l.id}
                size="sm"
                className="h-8 gap-1 bg-primary text-primary-foreground"
                onClick={() => request("open", l.url)}
              >
                <ExternalLink size={13} /> {links.length > 1 ? `Open link ${i + 1}` : "Open"}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 border-border text-foreground"
              onClick={() => request("copy", link.url)}
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

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw size={16} className="text-primary" /> These links change often
            </AlertDialogTitle>
            <AlertDialogDescription>
              Streaming links rotate and can stop working at any time — especially in a phone browser or on
              iPhone. If this one stops loading, come back to your account here and use the refreshed link.
              We keep testing and replacing them for you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>Okay, I understand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
