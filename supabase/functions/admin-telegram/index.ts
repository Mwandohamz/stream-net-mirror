import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTelegramMessage } from "../_shared/telegram.ts";
import { escapeHtml } from "../_shared/telegramPaymentNotifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const CHAT_ID_RE = /^(-?\d{1,20}|@[A-Za-z0-9_]{5,32})$/;
const UUID_RE = /^[0-9a-f-]{36}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid token" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const allow = (Deno.env.get("ADMIN_EMAILS") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    let isAdmin = allow.includes((user.email || "").toLowerCase());
    if (!isAdmin) {
      const { data } = await admin.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      isAdmin = !!data;
    }
    if (!isAdmin) return json({ error: "Not authorized" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "list") {
      const [rec, hist] = await Promise.all([
        admin.from("telegram_notification_recipients").select("*").order("created_at"),
        admin.from("telegram_payment_notifications")
          .select("id, deposit_id, recipient_id, chat_id, notification_type, status, error_message, created_at")
          .order("created_at", { ascending: false }).limit(50),
      ]);
      if (rec.error || hist.error) return json({ error: rec.error?.message ?? hist.error?.message }, 500);
      return json({
        recipients: rec.data,
        history: hist.data,
        tokenConfigured: !!Deno.env.get("TELEGRAM_BOT_TOKEN")?.trim(),
      });
    }

    const name = String(body?.name ?? "").trim();
    const chatId = String(body?.chat_id ?? "").trim();
    const id = String(body?.id ?? "");

    if (action === "create" || action === "update") {
      if (!name || name.length > 80) return json({ error: "Name is required (max 80 characters)" }, 400);
      if (!CHAT_ID_RE.test(chatId)) return json({ error: "Chat ID must be a number (e.g. 123456789 or -100…) or @channel" }, 400);
      const q = action === "create"
        ? admin.from("telegram_notification_recipients").insert({ name, chat_id: chatId, is_active: true })
        : (UUID_RE.test(id) ? admin.from("telegram_notification_recipients").update({ name, chat_id: chatId }).eq("id", id) : null);
      if (!q) return json({ error: "Invalid id" }, 400);
      const { error } = await q;
      if (error) return json({ error: error.code === "23505" ? "This chat ID is already added" : error.message }, 400);
      return json({ ok: true });
    }

    if (!UUID_RE.test(id)) return json({ error: "Invalid id" }, 400);

    if (action === "toggle") {
      const { error } = await admin.from("telegram_notification_recipients").update({ is_active: !!body?.is_active }).eq("id", id);
      return error ? json({ error: error.message }, 400) : json({ ok: true });
    }
    if (action === "delete") {
      const { error } = await admin.from("telegram_notification_recipients").delete().eq("id", id);
      return error ? json({ error: error.message }, 400) : json({ ok: true });
    }
    if (action === "test") {
      const { data: r } = await admin.from("telegram_notification_recipients").select("id, name, chat_id").eq("id", id).maybeSingle();
      if (!r) return json({ error: "Recipient not found" }, 404);
      const message = `🔔 <b>Stream NetMirror test notification</b>\nRecipient: ${escapeHtml(r.name)}\nSent by admin at ${escapeHtml(new Date().toISOString().slice(0, 19).replace("T", " "))} UTC`;
      const result = await sendTelegramMessage(r.chat_id, message);
      const errText = result.success ? null
        : [result.error.type, result.error.telegramDescription ?? result.error.message].filter(Boolean).join(": ");
      await admin.from("telegram_payment_notifications").insert({
        recipient_id: r.id, chat_id: r.chat_id, notification_type: "test",
        status: result.success ? "sent" : "failed", message, error_message: errText,
      });
      return json({ ok: result.success, error: errText });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-telegram error", e instanceof Error ? e.message : e);
    return json({ error: "Server error" }, 500);
  }
});
