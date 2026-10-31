import { useEffect, useState, type ReactNode } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/native";
import { clearNativeSessionWindow, nativeSessionWindow, sessionWindowExpired } from "@/lib/nativeSession";
import PlayLoader from "@/components/PlayLoader";

/** Native-only reauthentication window. Token refresh never extends the window. */
export default function NativeSessionGuard({ children }: { children: ReactNode }) {
  const native = isNativeApp();
  const [ready, setReady] = useState(!native);
  useEffect(() => {
    if (!native) return;
    let active = true;
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && sessionWindowExpired(nativeSessionWindow(session.user.id).expiresAt)) {
          // Local signout does not terminate this user's sessions on other devices.
          await supabase.auth.signOut({ scope: "local" });
          clearNativeSessionWindow();
          window.location.replace("/signin");
          return;
        }
      } catch { /* An offline resume must not erase a persisted login. */ }
      finally { checking = false; if (active) setReady(true); }
    };
    const timeout = window.setTimeout(() => { if (active) setReady(true); }, 8000);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") clearNativeSessionWindow();
      // Never await another auth call inside the auth callback.
      window.setTimeout(() => { if (active) void check(); }, 0);
    });
    const resume = CapacitorApp.addListener("appStateChange", ({ isActive }) => { if (isActive) void check(); });
    const interval = window.setInterval(() => void check(), 30_000);
    void check();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      subscription.unsubscribe();
      void resume.then((listener) => listener.remove());
    };
  }, [native]);
  return ready ? <>{children}</> : <div className="min-h-screen flex items-center justify-center bg-background"><PlayLoader /></div>;
}