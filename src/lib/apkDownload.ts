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
 * Anyone (signed in or not) can download the APK. The public apk-download
 * function logs the download (device, time) and returns a short-lived link.
 */
export async function downloadApk(): Promise<boolean> {
  try {
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
