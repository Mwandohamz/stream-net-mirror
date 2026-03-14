import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const LOADING_TIMEOUT_MS = 8000;

const validateAdminEmail = async (email: string): Promise<boolean> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  try {
    const { data } = await supabase.functions.invoke("validate-admin-email", {
      body: { email: normalized },
    });

    return data?.valid === true;
  } catch {
    return false;
  }
};

const syncAdminRole = async () => {
  try {
    await supabase.functions.invoke("assign-admin-role");
  } catch {
    // best-effort sync
  }
};

export const useAdmin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const requestIdRef = useRef(0);

  const resolveAdminState = useCallback(async (sessionUser: User | null) => {
    const requestId = ++requestIdRef.current;

    try {
      setAuthError(false);
      setUser(sessionUser);

      if (!sessionUser?.email) {
        setIsAdmin(false);
        return;
      }

      // Primary check: ADMIN_EMAILS whitelist
      const valid = await validateAdminEmail(sessionUser.email);
      if (valid) {
        // Sync role to DB for RLS policies (idempotent)
        await syncAdminRole();
        setIsAdmin(true);
        return;
      }

      // Fallback: check user_roles table directly
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sessionUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
      if (sessionUser) {
        setAuthError(true);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety timeout to prevent endless loading
    const timeout = setTimeout(() => {
      if (!mounted) return;
      setLoading((prev) => {
        if (prev) setAuthError(true);
        return false;
      });
    }, LOADING_TIMEOUT_MS);

    // Set up auth listener FIRST. Keep callback non-blocking to avoid auth deadlocks.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setLoading(true);
      setTimeout(() => {
        if (!mounted) return;
        void resolveAdminState(session?.user ?? null);
      }, 0);
    });

    // Then bootstrap from current session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        void resolveAdminState(session?.user ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
        setAuthError(true);
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [resolveAdminState]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setAuthError(false);
  };

  const refresh = async () => {
    setLoading(true);
    setAuthError(false);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await resolveAdminState(session?.user ?? null);
    } catch {
      setLoading(false);
      setAuthError(true);
    }
  };

  return {
    user,
    isAdmin,
    loading,
    authError,
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    },
    signOut,
    refresh,
  };
};

// Export the helper for reuse
export { validateAdminEmail };
