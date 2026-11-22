import { supabase } from "@/integrations/supabase/client";
import { openDownloadUrl } from "@/lib/native";

export const detectPlatform = (): string => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/windows/i.test(ua)) return "windows";
  if (/mac os/i.test(ua)) return "mac";
  if (/linux/i.test(ua)) return "linux";
  return "other";
};

/**
 * Signed-in accounts can download the APK. The apk-download function
 * checks the session, logs the download and returns a short-lived link.
 */
export async function downloadApk(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
    const { data, error } = await supabase.functions.invoke("apk-download", {
      body: { platform: detectPlatform() },
    });
    if (error || !data?.url) return false;
    await openDownloadUrl(data.url);
    return true;
  } catch {
    return false;
  }
}
