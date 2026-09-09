import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "snm_install_dismissed_at";
const DISMISS_DAYS = 7;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

const recentlyDismissed = () => {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < DISMISS_DAYS * 86400000;
};

/**
 * "Add to Home" bar. Uses the native install prompt on Android/Chrome and shows
 * the Share → Add to Home Screen steps on iPhone, where no prompt event exists.
 */
const InstallPrompt = () => {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS never fires the event, so offer the manual steps instead.
    if (isIOS) {
      const t = setTimeout(() => setShow(true), 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [isIOS]);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice?.outcome === "accepted") setShow(false);
      else dismiss();
      return;
    }
    setIosHelp(true);
  };

  return (
    <div className="fixed inset-x-2 bottom-2 z-[60] md:inset-x-auto md:right-4 md:w-96">
      <div className="rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3">
          <img src="/logo-hexagon.png" alt="" className="h-10 w-10 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Add StreamNetMirror to your home screen</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Opens like an app — one tap to your links, no browser bar.
            </p>
            {iosHelp && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-secondary/60 p-2 text-[11px] text-foreground">
                <Share size={13} className="mt-0.5 shrink-0 text-primary" />
                Tap the Share button in Safari, then choose “Add to Home Screen”.
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <Button size="sm" className="h-8 gap-1 rounded-full bg-primary text-primary-foreground" onClick={install}>
                <Download size={13} /> {isIOS && !deferred ? "How to add" : "Install"}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 rounded-full text-muted-foreground" onClick={dismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button onClick={dismiss} aria-label="Dismiss" className="text-muted-foreground">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
