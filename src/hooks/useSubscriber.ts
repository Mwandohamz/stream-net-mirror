import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const checkIsAdmin = async (email: string): Promise<boolean> => {
  try {
    const { data } = await supabase.functions.invoke("validate-admin-email", {
      body: { email },
    });
    return data?.valid === true;
  } catch {
    return false;
  }
};

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
      // Admin bypass
      const email = currentUser.email;
      if (email) {
        const admin = await checkIsAdmin(email);
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
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await checkAccess(currentUser);
      } catch {
        setUser(null);
        setIsSubscriber(false);
      } finally {
        setLoading(false);
      }
    };

    check();

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

    return () => subscription.unsubscribe();
  }, []);

  return { user, isSubscriber, loading };
};
