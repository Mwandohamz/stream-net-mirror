import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  interval: string;
  interval_count: number;
  price_usd: number;
  is_active: boolean;
  sort_order: number;
  /** Which content categories this plan unlocks, e.g. ["netmirror","live-sports"]. */
  category_slugs: string[];
}


export function usePlans(includeInactive = false) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("plans" as any).select("*").order("sort_order", { ascending: true });
    if (!includeInactive) query = query.eq("is_active", true);
    const { data } = await query;
    setPlans(((data as any[]) ?? []) as Plan[]);
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  return { plans, loading, reload: load };
}

export function planIntervalLabel(plan: Pick<Plan, "interval" | "interval_count">): string {
  if (plan.interval === "lifetime") return "one-time";
  const unit = plan.interval === "year" ? "year" : plan.interval === "week" ? "week" : "month";
  return plan.interval_count > 1 ? `every ${plan.interval_count} ${unit}s` : `per ${unit}`;
}
