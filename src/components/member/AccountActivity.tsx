import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, CalendarDays } from "lucide-react";
import PlayLoader from "@/components/PlayLoader";

export default function AccountActivity() {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["account-activity", page],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again.");
      const [payments, subscriptions] = await Promise.all([
        // Existing own-user/JWT-email policies cover linked and historical guest payments.
        supabase.from("payments").select("id, amount, currency, status, created_at, transaction_id, plans(name)", { count: "exact" }).order("created_at", { ascending: false }).range(page * 20, page * 20 + 19).abortSignal(AbortSignal.timeout(8000)),
        supabase.from("subscriptions").select("id, status, current_period_start, current_period_end, plans(name)", { count: "exact" }).eq("user_id", session.user.id).order("created_at", { ascending: false }).range(page * 20, page * 20 + 19).abortSignal(AbortSignal.timeout(8000)),
      ]);
      if (payments.error) throw payments.error;
      if (subscriptions.error) throw subscriptions.error;
      return { payments: payments.data, subscriptions: subscriptions.data, count: Math.max(payments.count ?? 0, subscriptions.count ?? 0) };
    },
  });
  return <section className="space-y-4 border-t border-border pt-5" aria-label="Transaction history">
    <h2 className="dashboard-heading flex items-center gap-2 text-lg font-semibold"><Receipt size={19} className="text-primary" /> Transaction history</h2>
    {query.isLoading ? <PlayLoader /> : query.isError ? <div className="space-y-2"><p className="text-sm text-destructive">History couldn’t load.</p><Button variant="outline" size="sm" onClick={() => void query.refetch()}>Retry</Button></div> : <Tabs defaultValue="payments">
      <TabsList className="w-full"><TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger><TabsTrigger value="subscriptions" className="flex-1">Subscriptions</TabsTrigger></TabsList>
      <TabsContent value="payments" className="divide-y divide-border">
        {!query.data?.payments.length && <p className="py-5 text-sm text-muted-foreground">No payments yet.</p>}
        {query.data?.payments.map(p => <div key={p.id} className="space-y-2 py-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium">{p.plans?.name || "Subscription payment"}</p><p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p></div><p className="shrink-0 text-sm font-semibold">{p.currency || "—"} {Number(p.amount).toFixed(2)}</p></div>
          <Badge variant="outline" className="capitalize">{p.status}</Badge>
          {p.transaction_id && <p className="break-all font-mono text-[11px] text-muted-foreground">{p.transaction_id}</p>}
        </div>)}
      </TabsContent>
      <TabsContent value="subscriptions" className="divide-y divide-border">
        {!query.data?.subscriptions.length && <p className="py-5 text-sm text-muted-foreground">No subscriptions yet.</p>}
        {query.data?.subscriptions.map(s => <div key={s.id} className="space-y-2 py-4"><div className="flex items-center justify-between gap-3"><p className="font-medium">{s.plans?.name || "Subscription"}</p><Badge variant="outline" className="capitalize">{s.status}</Badge></div><p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays size={14} />{new Date(s.current_period_start).toLocaleDateString()} – {new Date(s.current_period_end).toLocaleDateString()}</p></div>)}
      </TabsContent>
      {(query.data?.count ?? 0) > 20 && <div className="flex items-center justify-between pt-3"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button><span className="text-xs text-muted-foreground">{page + 1}</span><Button variant="outline" size="sm" disabled={(page + 1) * 20 >= (query.data?.count ?? 0)} onClick={() => setPage(p => p + 1)}>Next</Button></div>}
    </Tabs>}
  </section>;
}