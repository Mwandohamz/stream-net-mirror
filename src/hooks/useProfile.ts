import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country_iso3: string | null;
  country_name: string | null;
  currency: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    setProfile((data as any) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { error: new Error("Not signed in") };

      const { error } = await supabase
        .from("profiles" as any)
        .upsert({ id: session.user.id, email: session.user.email ?? "", ...patch } as any, { onConflict: "id" });

      if (!error) await load();
      return { error };
    },
    [load]
  );

  return { profile, loading, reload: load, updateProfile };
}
