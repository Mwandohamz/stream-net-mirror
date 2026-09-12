import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MAX_RECIPIENTS = 200;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid token" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    const callerEmail = (user.email || "").toLowerCase();
    const allowList = (Deno.env.get("ADMIN_EMAILS") || "")
      .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

    let isAdmin = allowList.includes(callerEmail);
    if (!isAdmin) {
      const { data: roleRow } = await admin
        .from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      isAdmin = !!roleRow;
    }
    if (!isAdmin) return json({ error: "Not authorized" }, 403);

    const body = await req.json().catch(() => ({}));
    const emails: string[] = Array.isArray(body?.emails)
      ? body.emails.map((e: unknown) => String(e).trim().toLowerCase()).filter(Boolean)
      : [];
    const subject = String(body?.subject ?? "").trim();
    const heading = String(body?.heading ?? subject).trim();
    const message = String(body?.body ?? "").trim();
    const ctaLabel = String(body?.ctaLabel ?? "Open my dashboard").trim();
    const ctaUrl = String(body?.ctaUrl ?? "https://streamnetmirror.app/dashboard").trim();
    const emailType = String(body?.emailType ?? "account-notice").trim();

    if (!subject) return json({ error: "A subject is required" }, 400);
    if (!message) return json({ error: "A message body is required" }, 400);
    if (emails.length === 0) return json({ error: "Select at least one recipient" }, 400);
    if (emails.length > MAX_RECIPIENTS) {
      return json({ error: `Select at most ${MAX_RECIPIENTS} recipients` }, 400);
    }

    // Re-validate recipients server-side: only registered accounts can be mailed.
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .in("email", emails);

    const valid = (profiles ?? []).filter((p: any) => p.email);
    if (valid.length === 0) return json({ error: "No matching accounts found" }, 400);

    let sent = 0;
    let failed = 0;
    let suppressed = 0;

    for (const p of valid) {
      const recipient = String(p.email);
      let status = "sent";
      let errorText: string | null = null;
      try {
        const result = await sendTemplateEmail("account-notice", recipient, {
          templateData: {
            subject,
            heading: heading || subject,
            body: message,
            name: p.full_name || "there",
            ctaLabel,
            ctaUrl,
          },
        });
        if (result.sent) sent += 1;
        else {
          suppressed += 1;
          status = "skipped";
          errorText = "recipient_suppressed";
        }
      } catch (err) {
        failed += 1;
        status = "failed";
        errorText = (err as Error)?.message ?? "Send failed";
      }

      await admin.from("email_log").insert({
        user_id: p.id,
        recipient,
        email_type: emailType,
        subject,
        status,
        error: errorText,
        metadata: { sent_by: callerEmail },
      });
    }

    return json({ success: true, sent, failed, suppressed, total: valid.length });
  } catch (err) {
    console.error("admin-send-email error", err);
    return json({ error: (err as Error)?.message ?? "Unexpected error" }, 500);
  }
});
