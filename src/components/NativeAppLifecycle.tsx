import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativeApp } from "@/lib/native";

const INTERNAL_SCHEME = "app.lovable.p25e647d373ae49318862c1ff709c52c3";

const NativeAppLifecycle = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNativeApp()) return;

    document.documentElement.classList.add("native-app");
    void StatusBar.setOverlaysWebView({ overlay: false });
    void StatusBar.setStyle({ style: Style.Dark });
    void StatusBar.setBackgroundColor({ color: "#07090f" });
    void Keyboard.setResizeMode({ mode: "native" });

    const keyboardShow = Keyboard.addListener("keyboardWillShow", () => {
      document.documentElement.classList.add("native-keyboard-open");
    });
    const keyboardHide = Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.classList.remove("native-keyboard-open");
    });
    const deepLink = CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      try {
        const parsed = new URL(url);
        const path = parsed.protocol === `${INTERNAL_SCHEME}:`
          ? `${parsed.host ? `/${parsed.host}` : ""}${parsed.pathname}${parsed.search}${parsed.hash}`
          : `${parsed.pathname}${parsed.search}${parsed.hash}`;
        if (path.startsWith("/")) navigate(path, { replace: true });
      } catch {
        // Ignore malformed external app links instead of interrupting the session.
      }
    });

    const splashTimer = window.setTimeout(() => {
      void SplashScreen.hide({ fadeOutDuration: 250 });
    }, 350);

    return () => {
      document.documentElement.classList.remove("native-app", "native-keyboard-open");
      window.clearTimeout(splashTimer);
      void keyboardShow.then((listener) => listener.remove());
      void keyboardHide.then((listener) => listener.remove());
      void deepLink.then((listener) => listener.remove());
    };
  }, [navigate]);

  useEffect(() => {
    if (!isNativeApp()) return;
    const backButton = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (location.pathname !== "/" && canGoBack) {
        navigate(-1);
        return;
      }
      void CapacitorApp.minimizeApp();
    });
    return () => { void backButton.then((listener) => listener.remove()); };
  }, [location.pathname, navigate]);

  return null;
};

export default NativeAppLifecycle;