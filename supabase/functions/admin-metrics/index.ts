import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const SUCCESS = ["completed", "success", "succeeded"];
const isSuccess = (s: unknown) => SUCCESS.includes(String(s ?? "").toLowerCase());
const round2 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;

const usdOf = (p: any): number => {
  if (p.amount_usd !== null && p.amount_usd !== undefined) return Number(p.amount_usd);
  if (p.fx_rate) return Number(p.amount) / Number(p.fx_rate);
  return 0;
};

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
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

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
    const scope = (body?.scope as string) ?? "overview";

    const { data: paymentsRaw, error: payErr } = await admin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (payErr) return json({ error: payErr.message }, 500);

    const payments = (paymentsRaw ?? []).map((p: any) => ({
      ...p,
      amount: Number(p.amount ?? 0),
      usd: round2(usdOf(p)),
      normalized_status: String(p.status ?? "").toLowerCase(),
    }));
    const completed = payments.filter((p) => isSuccess(p.status));

    if (scope === "payments") {
      return json({ payments, total: payments.length });
    }

    if (scope === "customers") {
      const byEmail = new Map<string, any>();
      for (const p of completed) {
        const key = String(p.email ?? "").toLowerCase();
        const existing = byEmail.get(key);
        if (!existing) {
          byEmail.set(key, { ...p, paymentCount: 1, totalPaid: p.amount, totalPaidUsd: p.usd });
        } else {
          existing.paymentCount += 1;
          existing.totalPaid = round2(existing.totalPaid + p.amount);
          existing.totalPaidUsd = round2(existing.totalPaidUsd + p.usd);
        }
      }
      const customers = Array.from(byEmail.values());
      return json({ customers, total: customers.length });
    }

    // overview
    const today = new Date().toISOString().split("T")[0];
    const [{ data: views }, { count: subscriberCount }, { count: openTickets }] = await Promise.all([
      admin.from("page_views").select("created_at, session_id"),
      admin.from("subscribers").select("id", { count: "exact", head: true }),
      admin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);

    const viewsArr = views ?? [];
    const uniqueSessions = new Set(viewsArr.map((v: any) => v.session_id)).size;

    const sum = (arr: any[], f: (p: any) => number) => round2(arr.reduce((s, p) => s + f(p), 0));

    const stats = {
      totalRevenue: sum(completed, (p) => p.amount),
      totalRevenueUsd: sum(completed, (p) => p.usd),
      organicRevenue: sum(completed.filter((p) => !p.promo_code), (p) => p.amount),
      influencerRevenue: sum(completed.filter((p) => !!p.promo_code), (p) => p.amount),
      totalPayments: payments.length,
      completedPayments: completed.length,
      todayPayments: payments.filter((p) => String(p.created_at).startsWith(today)).length,
      totalPageViews: viewsArr.length,
      uniqueSessions,
      conversionRate: uniqueSessions > 0 ? round2((completed.length / uniqueSessions) * 100) : 0,
      totalSubscribers: subscriberCount ?? 0,
      openTickets: openTickets ?? 0,
    };

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayPayments = completed.filter((p) => String(p.created_at).startsWith(dateStr));
      const dayViews = viewsArr.filter((v: any) => String(v.created_at).startsWith(dateStr));
      return {
        date: d.toLocaleDateString("en", { weekday: "short" }),
        revenue: sum(dayPayments, (p) => p.amount),
        count: dayPayments.length,
        views: dayViews.length,
        sessions: new Set(dayViews.map((v: any) => v.session_id)).size,
      };
    });

    return json({ stats, days, recentPayments: payments.slice(0, 10) });
  } catch (err) {
    console.error("admin-metrics error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
