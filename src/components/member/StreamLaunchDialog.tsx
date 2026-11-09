import { useState } from "react";
import { ExternalLink, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { openStreamInBrowser } from "@/lib/streamBrowser";
import { useToast } from "@/hooks/use-toast";

/** All launch paths share the warning; source URLs are never rendered here. */
export default function StreamLaunchDialog({ link, onClose, onInApp }: {
  link: { id: string; title: string } | null;
  onClose: () => void;
  onInApp: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const openBrowser = async () => {
    if (!link || busy) return;
    setBusy(true);
    try { await openStreamInBrowser(link.id); onClose(); }
    catch { toast({ title: "Unable to open website", description: "Allow browser popups or choose another server.", variant: "destructive" }); }
    finally { setBusy(false); }
  };
  return <Dialog open={!!link} onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="theme-dashboard z-[70] w-[calc(100%-2rem)] max-w-md rounded-lg border-border bg-popover">
      <DialogHeader>
        <span className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Play size={24} /></span>
        <DialogTitle className="break-words">Watch {link?.title}</DialogTitle>
        <DialogDescription>Always return to Stream NetMirror for refreshed links. Saved links may stop working or change destination.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2 text-sm text-muted-foreground">
        <p className="flex gap-3"><RefreshCw size={18} className="shrink-0 text-primary" />If a stream won’t load here, try the external website or another server.</p>
        <p className="flex gap-3"><ShieldCheck size={18} className="shrink-0 text-primary" />External sites control their own ads and security. Avoid redirects, downloads, and requests for passwords or payment details.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button className="min-h-12 gap-2" disabled={busy} onClick={() => { if (!link) return; const id = link.id; onClose(); onInApp(id); }}><Play size={18} /> Open in app</Button>
        <Button variant="outline" className="min-h-12 gap-2" disabled={busy} onClick={() => void openBrowser()}><ExternalLink size={18} />{busy ? "Opening…" : "External website"}</Button>
      </div>
      <Button variant="ghost" disabled={busy} onClick={onClose}>Not now</Button>
    </DialogContent>
  </Dialog>;
}