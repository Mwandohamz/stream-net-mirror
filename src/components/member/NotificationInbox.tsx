import { Bell, CheckCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function NotificationInbox() {
  const [readAt, setReadAt] = useState(0);
  const query = useQuery({ queryKey: ["member-notifications"], refetchInterval: 60000, queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { items: [], readAt: 0, userId: "" };
    const [sub, tickets] = await Promise.all([
      supabase.from("subscriptions").select("id,status,current_period_end,updated_at").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1).abortSignal(AbortSignal.timeout(8000)),
      supabase.from("support_tickets").select("id,subject,status,updated_at").eq("user_id", session.user.id).order("updated_at", { ascending: false }).limit(5).abortSignal(AbortSignal.timeout(8000)),
    ]);
    if (sub.error) throw sub.error;
    if (tickets.error) throw tickets.error;
    const items = (tickets.data ?? []).map(t => ({ id: t.id, title: t.subject, text: `Support · ${t.status}`, time: t.updated_at }));
    const s = sub.data?.[0];
    if (s) items.unshift({ id: s.id, title: `Subscription · ${s.status}`, text: `Period ends ${new Date(s.current_period_end).toLocaleDateString()}`, time: s.updated_at });
    let stored = 0;
    try { stored = Number(localStorage.getItem(`notifications-read-${session.user.id}`)) || 0; } catch { /* storage unavailable */ }
    return { items, readAt: stored, userId: session.user.id };
  }});
  const unread = query.data?.items.filter(i => new Date(i.time).getTime() > Math.max(readAt, query.data?.readAt ?? 0)).length ?? 0;
  return <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative h-10 w-10 shrink-0"><Bell size={19} />{unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />}</Button></PopoverTrigger>
    <PopoverContent align="end" className="theme-dashboard max-h-[70dvh] w-80 max-w-[calc(100vw-24px)] overflow-y-auto bg-popover text-foreground">
      <div className="flex items-center justify-between"><h2 className="font-semibold">Notifications</h2><Button size="icon" variant="ghost" aria-label="Mark all as read" onClick={() => { const now = Date.now(); setReadAt(now); try { if (query.data?.userId) localStorage.setItem(`notifications-read-${query.data.userId}`, String(now)); } catch { /* optional persistence */ } }}><CheckCheck size={18} /></Button></div>
      {query.isLoading ? <p className="py-4 text-sm text-muted-foreground">Loading…</p> : query.isError ? <Button variant="outline" onClick={() => void query.refetch()}>Retry notifications</Button> : !query.data?.items.length ? <p className="py-4 text-sm text-muted-foreground">You’re all caught up.</p> : <div className="divide-y divide-border">{query.data.items.map(i => <div className="py-3" key={i.id}><p className="break-words text-sm font-medium">{i.title}</p><p className="text-xs text-muted-foreground">{i.text}</p></div>)}</div>}
    </PopoverContent></Popover>;
}