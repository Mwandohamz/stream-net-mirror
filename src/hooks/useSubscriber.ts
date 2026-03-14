import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { validateAdminEmail } from "@/hooks/useAdmin";

const LOADING_TIMEOUT_MS = 8000;

export const useSubscriber = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const resolveAccessState = useCallback(async (currentUser: User | null) => {
    const requestId = ++requestIdRef.current;

    try {
      setUser(currentUser);

      if (!currentUser) {
        setIsSubscriber(false);
        return;
      }

      // Check subscriber table first
      const { data, error } = await supabase
        .from("subscribers")
        .select("id, status")
        .eq("user_id", currentUser.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsSubscriber(true);
        return;
      }

      // Admin bypass using same unified helper
      if (currentUser.email) {
        const admin = await validateAdminEmail(currentUser.email);
        if (admin) {
          setIsSubscriber(true);
          return;
        }
      }

      setIsSubscriber(false);
    } catch {
      setIsSubscriber(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety timeout
    const timeout = setTimeout(() => {
      if (!mounted) return;
      setLoading(false);
    }, LOADING_TIMEOUT_MS);

    // Keep callback non-blocking to avoid auth deadlocks.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setLoading(true);
      setTimeout(() => {
        if (!mounted) return;
        void resolveAccessState(session?.user ?? null);
      }, 0);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        void resolveAccessState(session?.user ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [resolveAccessState]);

  return { user, isSubscriber, loading };
};
