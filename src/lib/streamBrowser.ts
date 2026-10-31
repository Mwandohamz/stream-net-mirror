import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/native";
import { isSafeStreamUrl } from "@/lib/watchPlayback";

/** Resolve entitlement afresh; never use a cached catalog URL for playback. */
export async function openStreamInBrowser(linkId: string): Promise<void> {
  const native = isNativeApp();
  // Reserve the tab during the user's click so async access checks don't block it.
  const tab = native ? null : window.open("about:blank", "_blank");
  if (tab) tab.opener = null;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  try {
    const { data, error } = await supabase.rpc("resolve_watch_link", {
      p_link_id: linkId, p_platform: native ? "android" : "web",
    }).abortSignal(controller.signal);
    const source = data?.[0];
    if (error || !source || !isSafeStreamUrl(source.url)) throw new Error("Stream unavailable");
    if (native) await Browser.open({ url: source.url, presentationStyle: "fullscreen" });
    else if (tab) tab.location.replace(source.url);
    else throw new Error("Allow browser popups and try again");
  } catch (error) {
    tab?.close();
    throw error;
  } finally { window.clearTimeout(timeout); }
}