import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAppSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value")
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((row: any) => { map[row.key] = row.value; });
        setSettings(map);
        setLoading(false);
      });
  }, []);

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value } as any, { onConflict: "key" });
    if (!error) {
      setSettings((prev) => ({ ...prev, [key]: value }));
    }
    return { error };
  };

  return { settings, loading, updateSetting };
}
