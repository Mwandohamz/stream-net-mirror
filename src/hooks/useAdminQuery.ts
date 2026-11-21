import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared cache settings for every admin section: data stays fresh for a minute
 * and is kept for five, so switching sections or browser tabs is instant.
 */
export const ADMIN_QUERY_OPTIONS = {
  staleTime: 3 * 60_000,
  gcTime: 15 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnMount: false as const,
};

export function useAdminQuery<T>(key: unknown[], fetcher: () => Promise<T>, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: fetcher,
    enabled,
    ...ADMIN_QUERY_OPTIONS,
  });
}

export function useAdminRefresh() {
  const qc = useQueryClient();
  return (key?: unknown[]) =>
    key ? qc.invalidateQueries({ queryKey: key }) : qc.invalidateQueries({ queryKey: ["admin"] });
}

type Scope = "overview" | "payments" | "customers";

export async function fetchAdminMetrics<T = any>(scope: Scope, range?: { from?: string; to?: string }): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-metrics", { body: { scope, ...(range ?? {}) } });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}
