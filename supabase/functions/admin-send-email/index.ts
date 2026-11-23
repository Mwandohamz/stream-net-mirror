import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/adminAuth.ts";
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

const MAX_RECIPIENTS = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return json({ error: auth.error }, auth.status);
    const { admin, email: callerEmail } = auth;

    const body = await req.json().catch(() => ({}));
    const emails: string[] = [...new Set<string>( Array.isArray(body?.emails)
      ? body.emails.map((e: unknown) => String(e).trim().toLowerCase()).filter(Boolean)
      : [])];
    const subject = String(body?.subject ?? "").trim();
    const heading = String(body?.heading ?? subject).trim();
    const message = String(body?.body ?? "").trim();
    const ctaLabel = String(body?.ctaLabel ?? "Open my dashboard").trim();
    const ctaUrl = String(body?.ctaUrl ?? "https://streamnetmirror.app/dashboard").trim();
    const emailType = String(body?.emailType ?? "account-notice").trim();

    if (!subject) return json({ error: "A subject is required" }, 400);
    if (subject.length > 150 || heading.length > 150) return json({ error: "Subject and heading must be 150 characters or fewer" }, 400);
    if (message.length > 5000) return json({ error: "Message must be 5000 characters or fewer" }, 400);
    if (ctaLabel.length > 40) return json({ error: "Button label must be 40 characters or fewer" }, 400);
    if (!/^[a-z0-9-]{1,40}$/.test(emailType)) return json({ error: "Invalid email type" }, 400);
    try {
      const u = new URL(ctaUrl);
      const allowed = ["streamnetmirror.app", "www.streamnetmirror.app", "stream-net-mirror.lovable.app"];
      if (u.protocol !== "https:" || !allowed.includes(u.hostname)) {
        return json({ error: "Button link must point to the official StreamNetMirror site" }, 400);
      }
    } catch {
      return json({ error: "Button link is not a valid URL" }, 400);
    }
    if (emails.some((e) => e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
      return json({ error: "One or more recipient addresses are invalid" }, 400);
    }
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

    const valid: any[] = (profiles ?? []).filter((p: any) => p.email);
    // Accounts without a profile row (e.g. admins) are still registered users.
    const missing = new Set(emails.filter((e) => !valid.some((p) => String(p.email).toLowerCase() === e)));
    for (let page = 1; missing.size > 0 && page <= 10; page++) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      const users = list?.users ?? [];
      for (const u of users) {
        const e = (u.email || "").toLowerCase();
        if (missing.has(e)) {
          valid.push({ id: u.id, email: e, full_name: (u.user_metadata as any)?.full_name || null });
          missing.delete(e);
        }
      }
      if (users.length < 1000) break;
    }
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
    return json({ error: "Could not send emails" }, 500);
  }
});
