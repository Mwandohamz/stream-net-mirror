import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

let settingsCache: { value: Record<string, string>; at: number } | null = null;
const SETTINGS_CACHE_MS = 5 * 60_000;

export function useAppSettings() {
  const [settings, setSettings] = useState<Record<string, string>>(settingsCache?.value ?? {});
  const [loading, setLoading] = useState(!settingsCache);

  useEffect(() => {
    if (settingsCache && Date.now() - settingsCache.at < SETTINGS_CACHE_MS) {
      setLoading(false);
      return;
    }
    supabase
      .from("app_settings")
      .select("key, value")
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((row: any) => { map[row.key] = row.value; });
        settingsCache = { value: map, at: Date.now() };
        setSettings(map);
        setLoading(false);
      });
  }, []);

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value } as any, { onConflict: "key" });
    if (!error) {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        settingsCache = { value: next, at: Date.now() };
        return next;
      });
    }
    return { error };
  };

  return { settings, loading, updateSetting };
}
