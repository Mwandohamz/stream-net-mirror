import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const profileCache = new Map<string, { value: Profile | null; at: number }>();
const PROFILE_CACHE_MS = 5 * 60_000;

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

    const cached = profileCache.get(session.user.id);
    if (cached && Date.now() - cached.at < PROFILE_CACHE_MS) {
      setProfile(cached.value);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    const next = ((data as any) ?? null) as Profile | null;
    profileCache.set(session.user.id, { value: next, at: Date.now() });
    setProfile(next);
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

      if (!error) {
        profileCache.delete(session.user.id);
        await load();
      }
      return { error };
    },
    [load]
  );

  return { profile, loading, reload: load, updateProfile };
}
