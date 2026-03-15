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

const hasAdminRole = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) return false;
  return !!data;
};

const ensureAdminRole = async (userId: string): Promise<boolean> => {
  try {
    await supabase.functions.invoke("assign-admin-role");
  } catch {
    // continue; we'll verify role directly below
  }

  return hasAdminRole(userId);
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

      const validAdminEmail = await validateAdminEmail(sessionUser.email);

      if (validAdminEmail) {
        const roleReady = await ensureAdminRole(sessionUser.id);
        setIsAdmin(roleReady);
        setAuthError(!roleReady);
        return;
      }

      const roleFallback = await hasAdminRole(sessionUser.id);
      setIsAdmin(roleFallback);
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

    const timeout = setTimeout(() => {
      if (!mounted) return;
      setLoading((prev) => {
        if (prev) setAuthError(true);
        return false;
      });
    }, LOADING_TIMEOUT_MS);

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

export { validateAdminEmail };
