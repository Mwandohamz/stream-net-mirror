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
    const loaded = ((data as any[]) ?? []) as Plan[];
    // Customer-facing views lead with the standard monthly option while the
    // admin list keeps its configured order.
    setPlans(includeInactive ? loaded : [...loaded].sort((a, b) => {
      const aMonthly = a.interval === "month" && a.interval_count === 1;
      const bMonthly = b.interval === "month" && b.interval_count === 1;
      return Number(bMonthly) - Number(aMonthly) || a.sort_order - b.sort_order;
    }));
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  return { plans, loading, reload: load };
}

export function planIntervalLabel(plan: Pick<Plan, "interval" | "interval_count">): string {
  if (plan.interval === "lifetime") return "one-time";
  const normalized = plan.interval.replace(/ly$/, "");
  const unit = normalized === "year" ? "year" : normalized === "week" ? "week" : "month";
  return plan.interval_count > 1 ? `every ${plan.interval_count} ${unit}s` : `per ${unit}`;
}
