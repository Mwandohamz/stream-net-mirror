import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useSubscriber = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from("subscribers" as any)
          .select("id, status")
          .eq("user_id", currentUser.id)
          .eq("status", "active")
          .maybeSingle();
        setIsSubscriber(!!data);
      }
      setLoading(false);
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from("subscribers" as any)
          .select("id, status")
          .eq("user_id", currentUser.id)
          .eq("status", "active")
          .maybeSingle();
        setIsSubscriber(!!data);
      } else {
        setIsSubscriber(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isSubscriber, loading };
};
