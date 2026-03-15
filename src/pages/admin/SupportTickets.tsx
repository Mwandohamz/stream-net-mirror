import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, ChevronDown, ChevronRight } from "lucide-react";
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

// Group tickets by user_id
interface UserGroup {
  user_id: string;
  tickets: Ticket[];
}

const SupportTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketMessages, setTicketMessages] = useState<Record<string, TicketMessage[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets" as any)
      .select("*")
      .order("updated_at", { ascending: false });
    setTickets((data || []) as unknown as Ticket[]);
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

  // Group by user
  const grouped: UserGroup[] = [];
  const userMap = new Map<string, Ticket[]>();
  for (const t of tickets) {
    if (!userMap.has(t.user_id)) userMap.set(t.user_id, []);
    userMap.get(t.user_id)!.push(t);
  }
  userMap.forEach((tix, uid) => grouped.push({ user_id: uid, tickets: tix }));

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
                  <CardTitle className="text-sm text-muted-foreground font-mono">
                    User: {group.user_id.slice(0, 8)}... ({group.tickets.length} ticket{group.tickets.length > 1 ? "s" : ""})
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
                          {/* Original message */}
                          <div className="bg-background rounded p-2">
                            <p className="text-[10px] text-muted-foreground mb-1">User (original):</p>
                            <p className="text-xs text-foreground">{ticket.message}</p>
                          </div>

                          {/* Chat thread */}
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

                          {/* Reply + close/reopen */}
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
