import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { closeExpiredPayments } from "../_shared/paymentExpiry.ts";

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

const usdOf = (p: any): number | null => {
  if (p.amount_usd !== null && p.amount_usd !== undefined && Number.isFinite(Number(p.amount_usd))) {
    return Number(p.amount_usd);
  }
  if (Number(p.fx_rate) > 0 && Number.isFinite(Number(p.amount))) return Number(p.amount) / Number(p.fx_rate);
  return null;
};

// Only an original ZMW payment supplies a trustworthy historical ZMW value.
const zmwOf = (p: any): number | null =>
  String(p.currency ?? "").toUpperCase() === "ZMW" && Number.isFinite(Number(p.amount))
    ? Number(p.amount)
    : null;

const sumKnown = (rows: any[], value: (p: any) => number | null) =>
  round2(rows.reduce((total, row) => total + (value(row) ?? 0), 0));
const missingCount = (rows: any[], value: (p: any) => number | null) =>
  rows.filter((row) => value(row) === null).length;
const moneyFields = (p: any) => ({
  id: p.id,
  amount: p.amount,
  currency: p.currency,
  amount_usd: p.amount_usd,
  fx_rate: p.fx_rate,
  promo_code: p.promo_code,
  created_at: p.created_at,
});

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

    // Reconcile abandoned requests when admin data is used, avoiding a cron job.
    await closeExpiredPayments(admin);

    const { data: paymentsRaw, error: payErr } = await admin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (payErr) return json({ error: payErr.message }, 500);

    const payments = (paymentsRaw ?? []).map((p: any) => ({
      ...p,
      amount: Number(p.amount ?? 0),
      usd: usdOf(p) === null ? null : round2(usdOf(p)!),
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
          byEmail.set(key, {
            ...p,
            paymentCount: 1,
            paymentAmounts: [moneyFields(p)],
            totalPaid: zmwOf(p) ?? 0,
            totalPaidUsd: p.usd ?? 0,
            totalPaidMissingUsd: p.usd === null ? 1 : 0,
          });
        } else {
          existing.paymentCount += 1;
          existing.paymentAmounts.push(moneyFields(p));
          existing.totalPaid = round2(existing.totalPaid + (zmwOf(p) ?? 0));
          existing.totalPaidUsd = round2(existing.totalPaidUsd + (p.usd ?? 0));
          existing.totalPaidMissingUsd += p.usd === null ? 1 : 0;
        }
      }
      const customers = Array.from(byEmail.values());
      return json({ customers, total: customers.length });
    }

    // Overview — optional date range narrows revenue, payments and visits.
    const fromMs = body?.from ? Date.parse(String(body.from)) : NaN;
    const toMs = body?.to ? Date.parse(String(body.to)) : NaN;
    const inRange = (iso: string) => {
      const t = Date.parse(iso);
      return (Number.isNaN(fromMs) || t >= fromMs) && (Number.isNaN(toMs) || t <= toMs);
    };
    const rangedPayments = payments.filter((p) => inRange(p.created_at));
    const rangedCompleted = rangedPayments.filter((p) => isSuccess(p.status));
    const organic = rangedCompleted.filter((p) => !p.promo_code);
    const influencer = rangedCompleted.filter((p) => !!p.promo_code);

    // MRR uses currently active subscriptions and their authoritative USD plan prices.
    const { data: subs } = await admin.from("subscriptions")
      .select("user_id, plan_id, status, current_period_end, grace_days, plans(price_usd, interval, interval_count)")
      .in("status", ["active", "trialing", "grace"]);
    const monthlyFactor = (interval: string, count: number) => {
      const n = Math.max(1, Number(count) || 1);
      if (interval === "day") return 30 / n;
      if (interval === "week") return 30 / (7 * n);
      if (interval === "year") return 1 / (12 * n);
      return 1 / n;
    };
    const nowMs = Date.now();
    const activeSubs = (subs ?? []).filter((sub: any) =>
      Date.parse(sub.current_period_end) + (Number(sub.grace_days) || 0) * 86_400_000 > nowMs && sub.plans
    );
    let mrrZmw = 0;
    let mrrMissingZmw = 0;
    const mrr = round2(activeSubs.reduce((acc: number, sub: any) => {
      const monthlyUsd = Number(sub.plans.price_usd || 0) * monthlyFactor(sub.plans.interval, sub.plans.interval_count);
      const historicalPayment = completed.find((p) =>
        p.user_id === sub.user_id && p.plan_id === sub.plan_id &&
        String(p.currency).toUpperCase() === "ZMW" && Number(p.fx_rate) > 0
      );
      if (historicalPayment) mrrZmw += monthlyUsd * Number(historicalPayment.fx_rate);
      else mrrMissingZmw += 1;
      return acc + monthlyUsd;
    }, 0));
    mrrZmw = round2(mrrZmw);

    const today = new Date().toISOString().split("T")[0];
    const [{ data: views }, { count: subscriberCount }, { count: openTickets }] = await Promise.all([
      (() => { let q = admin.from("page_views").select("created_at, session_id"); if (!Number.isNaN(fromMs)) q = q.gte("created_at", new Date(fromMs).toISOString()); if (!Number.isNaN(toMs)) q = q.lte("created_at", new Date(toMs).toISOString()); return q; })(),
      admin.from("subscribers").select("id", { count: "exact", head: true }),
      admin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);

    const viewsArr = views ?? [];
    const uniqueSessions = new Set(viewsArr.map((v: any) => v.session_id)).size;
    const stats = {
      mrrUsd: mrr,
      arrUsd: round2(mrr * 12),
      mrrZmw,
      arrZmw: round2(mrrZmw * 12),
      mrrMissingZmw,
      activeSubscriptions: activeSubs.length,
      totalRevenue: sumKnown(rangedCompleted, zmwOf),
      totalRevenueUsd: sumKnown(rangedCompleted, usdOf),
      totalRevenueMissingUsd: missingCount(rangedCompleted, usdOf),
      organicRevenue: sumKnown(organic, zmwOf),
      organicRevenueUsd: sumKnown(organic, usdOf),
      influencerRevenue: sumKnown(influencer, zmwOf),
      influencerRevenueUsd: sumKnown(influencer, usdOf),
      totalPayments: rangedPayments.length,
      completedPayments: rangedCompleted.length,
      todayPayments: payments.filter((p) => String(p.created_at).startsWith(today)).length,
      totalPageViews: viewsArr.length,
      uniqueSessions,
      conversionRate: uniqueSessions > 0 ? round2((rangedCompleted.length / uniqueSessions) * 100) : 0,
      totalSubscribers: subscriberCount ?? 0,
      openTickets: openTickets ?? 0,
    };

    const endDay = Number.isNaN(toMs) ? new Date() : new Date(toMs);
    const spanDays = Number.isNaN(fromMs) ? 7 : Math.min(62, Math.max(1, Math.ceil((endDay.getTime() - fromMs) / 86_400_000)));
    const days = Array.from({ length: spanDays }, (_, i) => {
      const d = new Date(endDay);
      d.setDate(d.getDate() - (spanDays - 1 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayPayments = completed.filter((p) => String(p.created_at).startsWith(dateStr));
      const dayViews = viewsArr.filter((v: any) => String(v.created_at).startsWith(dateStr));
      return {
        date: spanDays <= 7 ? d.toLocaleDateString("en", { weekday: "short" }) : d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        revenue: sumKnown(dayPayments, zmwOf),
        revenueUsd: sumKnown(dayPayments, usdOf),
        paymentAmounts: dayPayments.map(moneyFields),
        count: dayPayments.length,
        views: dayViews.length,
        sessions: new Set(dayViews.map((v: any) => v.session_id)).size,
      };
    });

    return json({
      stats,
      days,
      recentPayments: rangedPayments.slice(0, 10),
      revenuePayments: rangedCompleted.map(moneyFields),
    });
  } catch (err) {
    console.error("admin-metrics error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
