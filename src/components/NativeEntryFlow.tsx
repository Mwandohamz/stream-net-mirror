import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/native";
import { nativeDashboardDestination, nativeEntryDestination } from "@/lib/nativeEntry";
import PlayLoader from "@/components/PlayLoader";

/** Resolve the saved session without mounting any website landing content. */
export default function NativeEntryFlow({ children }: { children: ReactNode }) {
  const location = useLocation();
  const native = isNativeApp();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!native) return;
    let active = true;
    let resolved = false;
    const timeout = window.setTimeout(() => {
      if (active && !resolved) setSignedIn(false);
    }, 8000);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolved = true;
      if (active) setSignedIn(Boolean(session?.user));
    });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && !resolved) setSignedIn(Boolean(session?.user));
      resolved = true;
    }).catch(() => {
      if (active && !resolved) setSignedIn(false);
    });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [native]);

  if (!native || !nativeDashboardDestination(location.pathname, location.search)) return <>{children}</>;
  if (signedIn === null) return <div className="theme-dashboard flex min-h-screen items-center justify-center bg-background"><PlayLoader /></div>;
  const destination = nativeEntryDestination(location.pathname, location.search, signedIn);
  return destination ? <Navigate to={destination} replace /> : <>{children}</>;
}