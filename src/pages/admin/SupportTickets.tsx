import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, ChevronDown, ChevronRight, UserPlus, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface UserGroup {
  user_id: string;
  userName: string;
  userEmail: string;
  tickets: Ticket[];
}

const SupportTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketMessages, setTicketMessages] = useState<Record<string, TicketMessage[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [userInfo, setUserInfo] = useState<Record<string, { name: string; email: string }>>({});

  // Grant access state
  const [grantingAccess, setGrantingAccess] = useState<string | null>(null);
  const [grantResult, setGrantResult] = useState<Record<string, { password: string; email: string }>>({});

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets" as any)
      .select("*")
      .order("updated_at", { ascending: false });
    const tix = (data || []) as unknown as Ticket[];
    setTickets(tix);

    // Fetch user info from subscribers
    const userIds = [...new Set(tix.map(t => t.user_id))];
    if (userIds.length > 0) {
      const { data: subs } = await supabase
        .from("subscribers")
        .select("user_id, name, email")
        .in("user_id", userIds);
      const info: Record<string, { name: string; email: string }> = {};
      (subs || []).forEach((s: any) => {
        info[s.user_id] = { name: s.name, email: s.email };
      });
      setUserInfo(info);
    }

    // For guest tickets (00000000-...), extract email from message
    for (const t of tix) {
      if (t.user_id === "00000000-0000-0000-0000-000000000000" && !userInfo[t.user_id]) {
        const match = t.message.match(/\[Guest: (.+?) \| (.+?)[\]|]/);
        if (match) {
          setUserInfo(prev => ({
            ...prev,
            [t.user_id + "_" + t.id]: { name: match[1], email: match[2] },
          }));
        }
      }
    }

    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from("ticket_messages" as any)
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setTicketMessages(prev => ({ ...prev, [ticketId]: (data || []) as unknown as TicketMessage[] }));
  };

  const handleExpand = (ticketId: string) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticketId);
      fetchMessages(ticketId);
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setReplySending(true);
    const { error } = await supabase.from("ticket_messages" as any).insert({
      ticket_id: ticketId,
      sender_role: "admin",
      message: replyText.trim(),
    } as any);
    if (error) {
      toast.error(error.message);
    } else {
      setReplyText("");
      await fetchMessages(ticketId);
      toast.success("Reply sent");
    }
    setReplySending(false);
  };

  const toggleStatus = async (ticket: Ticket) => {
    const newStatus = ticket.status === "closed" ? "open" : "closed";
    await supabase
      .from("support_tickets" as any)
      .update({ status: newStatus } as any)
      .eq("id", ticket.id);
    fetchTickets();
    toast.success(`Ticket ${newStatus}`);
  };

  const handleGrantAccess = async (email: string, userId: string) => {
    setGrantingAccess(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-grant-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grant access");

      setGrantResult(prev => ({ ...prev, [userId]: { password: data.tempPassword, email } }));
      toast.success(`Access granted for ${email}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGrantingAccess(null);
    }
  };

  const getGuestInfo = (ticket: Ticket) => {
    const match = ticket.message.match(/\[Guest: (.+?) \| (.+?)(?:\s*\|.*?)?\]\n/);
    if (match) return { name: match[1], email: match[2] };
    return null;
  };

  // Group by user
  const grouped: UserGroup[] = [];
  const userMap = new Map<string, Ticket[]>();
  for (const t of tickets) {
    if (!userMap.has(t.user_id)) userMap.set(t.user_id, []);
    userMap.get(t.user_id)!.push(t);
  }
  userMap.forEach((tix, uid) => {
    const info = userInfo[uid];
    // For guest tickets, try to extract from first ticket
    let userName = info?.name || "Unknown";
    let userEmail = info?.email || uid.slice(0, 8) + "...";
    if (uid === "00000000-0000-0000-0000-000000000000") {
      const guestInfo = getGuestInfo(tix[0]);
      if (guestInfo) {
        userName = guestInfo.name;
        userEmail = guestInfo.email;
      }
      userName = `🔓 ${userName} (Guest)`;
    }
    grouped.push({ user_id: uid, userName, userEmail, tickets: tix });
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="netflix-title text-3xl text-foreground">SUPPORT TICKETS</h1>

        {loading ? (
          <p className="text-muted-foreground">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              No support tickets yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <Card key={group.user_id} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-foreground flex items-center justify-between flex-wrap gap-2">
                    <span>
                      {group.userName} <span className="text-muted-foreground font-normal text-xs">({group.userEmail})</span>
                      <span className="text-muted-foreground font-normal text-xs ml-2">· {group.tickets.length} ticket{group.tickets.length > 1 ? "s" : ""}</span>
                    </span>
                    {/* Grant Access Button */}
                    {group.userEmail && group.userEmail !== "Unknown" && !group.userEmail.endsWith("...") && (
                      <div className="flex items-center gap-2">
                        {grantResult[group.user_id] ? (
                          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <div className="text-xs">
                              <p className="text-foreground font-medium">Access Granted</p>
                              <p className="text-muted-foreground">Temp password: <code className="text-primary">{grantResult[group.user_id].password}</code></p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(grantResult[group.user_id].password);
                                toast.success("Password copied!");
                              }}
                            >
                              <Copy size={12} />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGrantAccess(group.userEmail, group.user_id)}
                            disabled={grantingAccess === group.user_id}
                            className="border-primary/30 text-primary gap-1 text-xs"
                          >
                            <UserPlus size={14} />
                            {grantingAccess === group.user_id ? "Granting..." : "Grant Access"}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {group.tickets.map((ticket) => (
                    <div key={ticket.id} className="bg-secondary rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleExpand(ticket.id)}
                        className="w-full p-3 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {expandedTicket === ticket.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <div className="min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">{ticket.subject}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(ticket.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={ticket.status === "open" ? "default" : "secondary"} className="text-[10px] shrink-0 ml-2">
                          {ticket.status}
                        </Badge>
                      </button>

                      {expandedTicket === ticket.id && (
                        <div className="border-t border-border p-3 space-y-3">
                          <div className="bg-background rounded p-2">
                            <p className="text-[10px] text-muted-foreground mb-1">User (original):</p>
                            <p className="text-xs text-foreground whitespace-pre-wrap">{ticket.message}</p>
                          </div>

                          {(ticketMessages[ticket.id] || []).map((msg) => (
                            <div
                              key={msg.id}
                              className={`rounded p-2 ${msg.sender_role === "admin" ? "bg-primary/10 border border-primary/20" : "bg-background"}`}
                            >
                              <p className="text-[10px] text-muted-foreground mb-1">
                                {msg.sender_role === "admin" ? "Admin" : "User"} — {new Date(msg.created_at).toLocaleString()}
                              </p>
                              <p className="text-xs text-foreground">{msg.message}</p>
                            </div>
                          ))}

                          <div className="flex gap-2">
                            <Input
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type admin reply..."
                              className="bg-background border-border text-foreground text-xs"
                              onKeyDown={(e) => e.key === "Enter" && handleReply(ticket.id)}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleReply(ticket.id)}
                              disabled={replySending || !replyText.trim()}
                              className="bg-primary text-primary-foreground shrink-0"
                            >
                              <Send size={14} />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(ticket)}
                            className="text-xs border-border text-foreground"
                          >
                            {ticket.status === "closed" ? "Reopen Ticket" : "Close Ticket"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SupportTickets;
