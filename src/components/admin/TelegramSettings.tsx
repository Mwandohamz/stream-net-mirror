import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Send, Trash2, Pencil, Check, X, RefreshCw, AlertTriangle } from "lucide-react";

type Recipient = { id: string; name: string; chat_id: string; is_active: boolean };
type HistoryRow = {
  id: string; deposit_id: string | null; recipient_id: string | null; chat_id: string;
  notification_type: string; status: string; error_message: string | null; created_at: string;
};

async function call<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-telegram", { body });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try { msg = (await error.context.json())?.error ?? msg; } catch { /* ignore */ }
    }
    throw new Error(msg);
  }
  return data as T;
}

const TelegramSettings = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [tokenConfigured, setTokenConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [chatId, setChatId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editChat, setEditChat] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await call<{ recipients: Recipient[]; history: HistoryRow[]; tokenConfigured: boolean }>({ action: "list" });
      setRecipients(d.recipients ?? []);
      setHistory(d.history ?? []);
      setTokenConfigured(d.tokenConfigured);
    } catch (e) {
      toast.error(`Could not load Telegram settings: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (key: string, body: Record<string, unknown>, ok: string) => {
    setBusy(key);
    try {
      const r = await call<{ ok?: boolean; error?: string }>(body);
      if (body.action === "test" && !r.ok) toast.error(`Test failed: ${r.error ?? "unknown error"}`);
      else toast.success(ok);
      await load();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const nameOf = (h: HistoryRow) => recipients.find((r) => r.id === h.recipient_id)?.name ?? h.chat_id;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-foreground text-lg">Telegram Payment Alerts</CardTitle>
        <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh"><RefreshCw size={16} /></Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {tokenConfigured === false && (
          <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-destructive" />
            <span>The bot token (TELEGRAM_BOT_TOKEN) isn't set yet, so messages can't be sent. Add it in Project Settings → Secrets.</span>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">Add recipient</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Chat ID (e.g. 123456789)" value={chatId} onChange={(e) => setChatId(e.target.value)} className="bg-secondary border-border" />
            <Button
              disabled={busy === "add" || !name.trim() || !chatId.trim()}
              onClick={async () => {
                if (await run("add", { action: "create", name, chat_id: chatId }, "Recipient added")) { setName(""); setChatId(""); }
              }}
            >Add</Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">Recipients</Label>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-4 text-center">No recipients yet. Add one above to receive payment alerts.</p>
          ) : recipients.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2">
              {editId === r.id ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-secondary border-border" />
                  <Input value={editChat} onChange={(e) => setEditChat(e.target.value)} className="bg-secondary border-border" />
                  <div className="flex gap-1">
                    <Button size="icon" aria-label="Save" disabled={busy === r.id} onClick={async () => {
                      if (await run(r.id, { action: "update", id: r.id, name: editName, chat_id: editChat }, "Recipient updated")) setEditId(null);
                    }}><Check size={16} /></Button>
                    <Button size="icon" variant="ghost" aria-label="Cancel" onClick={() => setEditId(null)}><X size={16} /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.chat_id}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Off"}</Badge>
                    <Switch checked={r.is_active} disabled={busy === r.id} aria-label="Enable recipient"
                      onCheckedChange={(v) => run(r.id, { action: "toggle", id: r.id, is_active: v }, v ? "Recipient enabled" : "Recipient disabled")} />
                  </div>
                </div>
              )}
              {editId !== r.id && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1" disabled={busy === `t${r.id}`}
                    onClick={() => run(`t${r.id}`, { action: "test", id: r.id }, "Test message sent")}>
                    <Send size={14} />{busy === `t${r.id}` ? "Sending…" : "Send test"}
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setEditId(r.id); setEditName(r.name); setEditChat(r.chat_id); }}>
                    <Pencil size={14} />Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-1 text-destructive"><Trash2 size={14} />Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {r.name}?</AlertDialogTitle>
                        <AlertDialogDescription>They will stop receiving payment alerts. Past history is kept.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => run(r.id, { action: "delete", id: r.id }, "Recipient deleted")}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">Recent notifications</Label>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-4 text-center">No notifications sent yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="rounded-lg border border-border p-2 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{h.notification_type.replace("_", " ")}</span>
                    <Badge variant={h.status === "sent" ? "default" : h.status === "failed" ? "destructive" : "secondary"}>{h.status}</Badge>
                  </div>
                  <div className="text-muted-foreground flex flex-wrap gap-x-3">
                    <span>{nameOf(h)}</span>
                    <span>{new Date(h.created_at).toLocaleString()}</span>
                    {h.deposit_id && <span className="truncate">#{h.deposit_id.slice(0, 8)}</span>}
                  </div>
                  {h.error_message && <p className="text-destructive break-words">{h.error_message}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramSettings;
