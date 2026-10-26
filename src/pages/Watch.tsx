import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Maximize, Minimize, X } from "lucide-react";
import { InAppBrowser, ToolBarType } from "@capgo/inappbrowser";
import type { PluginListenerHandle } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import LogoShowcase from "@/components/LogoShowcase";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriber } from "@/hooks/useSubscriber";
import { useToast } from "@/hooks/use-toast";
import { isNativeApp } from "@/lib/native";
import PlayLoader from "@/components/PlayLoader";
import { FRAME_TIMEOUT_MS, isSafeStreamUrl, normalizeEmbedMode } from "@/lib/watchPlayback";

type Source = { id: string; title: string; url: string; embed_mode: string; allow_fullscreen: boolean };

const Watch = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscriber, loading: accessLoading } = useSubscriber();
  const [source, setSource] = useState<Source | null>(null);
  const [denied, setDenied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [nativeFallback, setNativeFallback] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const native = isNativeApp();
  const mode = normalizeEmbedMode(source?.embed_mode);
  const nativeView = native && mode === "webview" && !nativeFallback;

  const close = useCallback(() => {
    if (typeof window.history.state?.idx === "number" && window.history.state.idx > 0) navigate(-1);
    else navigate("/dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!linkId) return;
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), 8_000);
    let cancelled = false;
    setSource(null); setDenied(false); setFailed(false); setLoaded(false); setNativeFallback(false);
    void (async () => {
      try {
        const { data, error } = await supabase.rpc("resolve_watch_link", {
          p_link_id: linkId, p_platform: native ? "android" : "web",
        }).abortSignal(abort.signal);
        if (cancelled) return;
        if (error) throw error;
        const row = data?.[0];
        if (!row || !isSafeStreamUrl(row.url)) { setDenied(true); return; }
        setSource(row);
      } catch {
        if (!cancelled) {
          toast({ title: "Unable to load this source", description: "Please choose another link or try again.", variant: "destructive" });
          navigate("/dashboard", { replace: true });
        }
      } finally { clearTimeout(timer); }
    })();
    return () => { cancelled = true; clearTimeout(timer); abort.abort(); };
  }, [linkId, native, navigate, toast]);

  useEffect(() => {
    if (!denied || accessLoading) return;
    toast({ title: "Stream unavailable", description: isSubscriber ? "This link is inactive, unavailable, or not included in your plan." : "Choose a plan to unlock streaming.", variant: "destructive" });
    navigate(isSubscriber ? "/dashboard" : "/payment", { replace: true });
  }, [denied, accessLoading, isSubscriber, navigate, toast]);

  // Streams always play inside the app — never hand off to another app.



  useEffect(() => {
    if (!source || mode === "external" || nativeView || loaded) return;
    const timer = window.setTimeout(() => setFailed(true), FRAME_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [source, mode, nativeView, loaded]);

  useEffect(() => {
    if (!source || !nativeView) return;
    let cancelled = false;
    let opened = false;
    const listeners: PluginListenerHandle[] = [];
    const bounds = () => {
      const rect = content.current?.getBoundingClientRect();
      return { x: 0, y: Math.round(rect?.top ?? 88), width: Math.round(window.innerWidth), height: Math.max(1, Math.round(rect?.height ?? window.innerHeight - 88)) };
    };
    const resize = () => { if (opened) void InAppBrowser.updateDimensions(bounds()).catch(() => undefined); };
    void (async () => {
      try {
        listeners.push(await InAppBrowser.addListener("closeEvent", () => { if (!cancelled) close(); }));
        listeners.push(await InAppBrowser.addListener("pageLoadError", () => {
          if (!cancelled) { setNativeFallback(true); setFailed(true); }
        }));
        if (cancelled) return;
        // Sized view leaves the React brand/title/close header visible and touchable.
        // No auth headers, app storage, or executable app messages are shared.
        await InAppBrowser.openWebView({
          url: source.url, toolbarType: ToolBarType.BLANK, ...bounds(),
          enabledSafeTopMargin: false, enabledSafeBottomMargin: false,
          preventDeeplink: true, openBlankTargetInWebView: true,
          activeNativeNavigationForWebview: true,
          allowScreenshotsFromWebPage: false,
        });
        opened = true;
        if (cancelled) await InAppBrowser.close();
        else window.addEventListener("resize", resize);
      } catch { if (!cancelled) { setNativeFallback(true); setFailed(true); } }
      finally { if (cancelled) listeners.forEach((listener) => { void listener.remove(); }); }
    })();
    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      listeners.forEach((listener) => { void listener.remove(); });
      if (opened) void InAppBrowser.close().catch(() => undefined);
    };
  }, [source, nativeView, close]);

  useEffect(() => {
    const changed = () => {
      const active = document.fullscreenElement;
      setFullscreen(Boolean(active));
      // A site's own fullscreen request must not hide our persistent header.
      if (active && active !== container.current) {
        void document.exitFullscreen().then(() => container.current?.requestFullscreen()).catch(() => undefined);
      }
    };
    document.addEventListener("fullscreenchange", changed);
    return () => { document.removeEventListener("fullscreenchange", changed); };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await container.current?.requestFullscreen();
    } catch { toast({ title: "Fullscreen isn't supported on this device" }); }
  };

  if (!source) return <div className="min-h-screen bg-background flex items-center justify-center"><PlayLoader label="Loading stream" /></div>;

  return (
    <div ref={container} className="theme-dashboard fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-background">
      <header className="relative z-50 shrink-0 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
        <div className="flex min-h-16 items-center gap-3 px-3 py-2 md:px-5">
          <LogoShowcase size="sm" />
          <div className="min-w-0 flex-1">
            <p className="dashboard-heading text-xs font-bold text-foreground sm:text-sm">STREAMNETMIRROR</p>
            <h1 className="truncate text-sm text-muted-foreground">{source.title}</h1>
          </div>
          {mode === "iframe" && source.allow_fullscreen && <Button variant="ghost" size="icon" aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} onClick={() => void toggleFullscreen()}>{fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</Button>}
          <Button variant="ghost" size="icon" aria-label="Back to platforms" title="Back to platforms" onClick={close}><ArrowLeft size={22} /></Button>
          <Button variant="ghost" size="icon" aria-label="Close stream" title="Close stream" onClick={close}><X size={22} /></Button>
        </div>
      </header>
      <div ref={content} className="relative flex min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
        {!nativeView && <>
           <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2">
            <p role="status" className="text-xs text-muted-foreground">{failed ? "This source isn't loading" : "Having trouble with this source?"}</p>
            <Button size="sm" variant="outline" className="h-8 gap-2" onClick={close}><ArrowLeft size={14} /> Switch platform</Button>
          </div>
          <iframe
            key={source.id}
            src={source.url}
            title={source.title}
            allow={source.allow_fullscreen ? "autoplay; fullscreen; encrypted-media" : "autoplay; encrypted-media"}
            allowFullScreen={source.allow_fullscreen}
            // No popups or top-level redirects: ad links on embedded sites can't
            // drag the viewer out of StreamNetMirror.
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
            referrerPolicy="no-referrer"
            className="min-h-0 w-full flex-1 border-0 bg-background"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>}
        {nativeView && <div className="flex flex-1 items-center justify-center"><PlayLoader label="Opening stream" /></div>}
      </div>
    </div>
  );
};

export default Watch;