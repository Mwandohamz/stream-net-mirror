import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const LOADING_TIMEOUT_MS = 8000;

const validateAdminEmail = async (email: string): Promise<boolean> => {
  try {
    const { data } = await supabase.functions.invoke("validate-admin-email", {
      body: { email },
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
  const resolving = useRef(false);

  const resolveAdminState = useCallback(async (sessionUser: User | null) => {
    if (resolving.current) return;
    resolving.current = true;
    try {
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
      } else {
        // Fallback: check user_roles table directly
        try {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", sessionUser.id)
            .eq("role", "admin")
            .maybeSingle();
          setIsAdmin(!!data);
        } catch {
          setIsAdmin(false);
        }
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
      setAuthError(true);
    } finally {
      resolving.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Safety timeout to prevent endless loading
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) setAuthError(true);
        return false;
      });
    }, LOADING_TIMEOUT_MS);

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await resolveAdminState(session?.user ?? null);
      }
    );

    // Then bootstrap from current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await resolveAdminState(session?.user ?? null);
    }).catch(() => {
      setLoading(false);
      setAuthError(true);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [resolveAdminState]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await resolveAdminState(session?.user ?? null);
    } catch {
      setLoading(false);
      setAuthError(true);
    }
  };

  return { user, isAdmin, loading, authError, signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, signOut, refresh };
};

// Export the helper for reuse
export { validateAdminEmail };
