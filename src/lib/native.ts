import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

export const isNativeApp = () => Capacitor.isNativePlatform();

export const openExternalUrl = async (url: string) => {
  if (!isNativeApp()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  await Browser.open({ url, presentationStyle: "popover" });
};

export const openDownloadUrl = async (url: string) => {
  if (!isNativeApp()) {
    window.location.href = url;
    return;
  }

  await Browser.open({ url, presentationStyle: "fullscreen" });
};