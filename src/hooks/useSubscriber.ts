import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { validateAdminEmail } from "@/hooks/useAdmin";

export const useSubscriber = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsSubscriber(false);
      return;
    }
    try {
      // Check subscriber table first
      const { data } = await supabase
        .from("subscribers")
        .select("id, status")
        .eq("user_id", currentUser.id)
        .eq("status", "active")
        .maybeSingle();
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
    } catch {
      // fall through
    }
    setIsSubscriber(false);
  };

  useEffect(() => {
    // Safety timeout
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await checkAccess(currentUser);
      } catch {
        setUser(null);
        setIsSubscriber(false);
      } finally {
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await checkAccess(currentUser);
      } catch {
        setUser(null);
        setIsSubscriber(false);
      } finally {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return { user, isSubscriber, loading };
};
