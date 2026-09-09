import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, RefreshCw, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 100;

type EmailRow = {
  id: string;
  user_id: string | null;
  recipient: string;
  email_type: string;
  subject: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  country_name: string | null;
  created_at: string;
};

const Emails = () => {
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [reminderDays, setReminderDays] = useState("3");
  const [sending, setSending] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const { toast } = useToast();

  const sendReminders = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("subscription-emails", {
        body: { days: Number(reminderDays) || 0 },
      });
      if (error) throw error;
      const summary = `${data?.reminders ?? 0} reminder(s), ${data?.expired ?? 0} expiry notice(s), ${data?.skipped ?? 0} skipped`;
      setLastRun(`Last run: ${summary}`);
      toast({ title: "Reminders sent", description: summary });
      void fetchRows();
    } catch (err: any) {
      toast({ title: "Could not send reminders", description: err?.message ?? "Unexpected error", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    void fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      await supabase.functions.invoke("assign-admin-role");
      const [countRes, dataRes, profileRes] = await Promise.all([
        supabase.from("email_log").select("id", { count: "exact", head: true }),
        supabase
          .from("email_log")
          .select("id, user_id, recipient, email_type, subject, status, error, created_at")
          .order("created_at", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
        supabase.from("profiles").select("id, full_name, email, country_name, created_at"),
      ]);
      setTotal(countRes.count || 0);
      setRows((dataRes.data as EmailRow[]) || []);
      setProfiles((profileRes.data as Profile[]) || []);
    } catch (err) {
      console.error("Email log fetch error:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  /** Email address -> registered account, so every log line shows who it belongs to. */
  const accountByEmail = new Map(profiles.map((p) => [(p.email || "").toLowerCase(), p]));
  const accountFor = (r: EmailRow) =>
    profiles.find((p) => p.id === r.user_id) || accountByEmail.get((r.recipient || "").toLowerCase()) || null;

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const acct = accountFor(r);
    return (
      r.recipient?.toLowerCase().includes(q) ||
      r.email_type?.toLowerCase().includes(q) ||
      (r.subject || "").toLowerCase().includes(q) ||
      (acct?.full_name || "").toLowerCase().includes(q)
    );
  });

  // Registered accounts that have never received an email yet — easy to miss otherwise.
  const emailed = new Set(rows.map((r) => (r.recipient || "").toLowerCase()));
  const neverEmailed = profiles.filter((p) => p.email && !emailed.has(p.email.toLowerCase()));

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="netflix-title text-3xl text-foreground">EMAIL ACTIVITY</h1>
          <Button variant="outline" size="sm" className="gap-2 border-border text-foreground" onClick={fetchRows}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base">Every email the app has sent</CardTitle>
            <CardDescription>
              Payment confirmations, renewal reminders and account emails all appear here with their delivery result.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base">Renewal reminders</CardTitle>
            <CardDescription>
              Send reminder emails to everyone whose access ends within the number of days below.
              Members already past their end date get an expiry notice instead. Each person only
              receives one email per billing period, so it is safe to run this more than once.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Days ahead</p>
              <Input
                type="number"
                min={0}
                max={30}
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="w-28 bg-secondary border-border text-foreground"
              />
            </div>
            <Button onClick={sendReminders} disabled={sending} className="gap-2">
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send reminders now"}
            </Button>
            {lastRun && <p className="text-xs text-muted-foreground">{lastRun}</p>}
          </CardContent>
        </Card>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by recipient, type or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border text-foreground"
          />
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No emails sent yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-foreground font-medium">{r.recipient}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{r.email_type.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-muted-foreground">{r.subject || "—"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === "sent" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-xs truncate">{r.error || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {total > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} records
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="border-border text-foreground gap-1">
                <ChevronLeft size={14} /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="border-border text-foreground gap-1">
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Emails;
