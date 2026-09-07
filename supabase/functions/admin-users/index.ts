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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Admin check: ADMIN_EMAILS allow-list or the admin role in the database.
    const callerEmail = (user.email || "").toLowerCase();
    const allowList = (Deno.env.get("ADMIN_EMAILS") || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    let isAdmin = allowList.includes(callerEmail);
    if (!isAdmin) {
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      isAdmin = !!roleRow;
    }
    if (!isAdmin) return json({ error: "Not authorized" }, 403);

    const body = await req.json();
    const action = body?.action as string;

    if (action === "list") {
      const page = Number(body.page ?? 0);
      const perPage = Number(body.perPage ?? 100);

      const { data: authList, error: listError } = await admin.auth.admin.listUsers({
        page: page + 1,
        perPage,
      });
      if (listError) return json({ error: listError.message }, 500);

      const ids = (authList?.users ?? []).map((u) => u.id);

      const [{ data: profiles }, { data: subs }, { data: pays }, { data: roles }] = await Promise.all([
        admin.from("profiles").select("*").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        admin.from("subscriptions").select("*").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        admin
          .from("payments")
          .select("id, user_id, email, amount, amount_usd, currency, status, created_at")
          .order("created_at", { ascending: false }),
        admin.from("user_roles").select("user_id, role"),
      ]);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const subMap = new Map((subs ?? []).map((s: any) => [s.user_id, s]));
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
      });

      const users = (authList?.users ?? []).map((u) => {
        const email = (u.email || "").toLowerCase();
        const userPayments = (pays ?? []).filter(
          (p: any) => p.user_id === u.id || (p.email || "").toLowerCase() === email
        );
        const completed = userPayments.filter((p: any) => String(p.status).toLowerCase() === "completed");
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          email_confirmed_at: u.email_confirmed_at,
          banned_until: (u as any).banned_until ?? null,
          profile: profileMap.get(u.id) ?? null,
          subscription: subMap.get(u.id) ?? null,
          roles: roleMap.get(u.id) ?? [],
          payment_count: completed.length,
          total_paid_usd: completed.reduce((sum: number, p: any) => sum + Number(p.amount_usd ?? 0), 0),
          last_payment_at: completed[0]?.created_at ?? null,
        };
      });

      return json({ users, total: (authList as any)?.total ?? users.length });
    }

    if (action === "create_user") {
      const { email, password, full_name, phone, country_iso3, country_name, currency } = body;
      if (!email || !password) return json({ error: "Email and password are required" }, 400);

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: String(email).trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { full_name, phone, country_iso3, country_name, currency },
      });
      if (createError || !created?.user) return json({ error: createError?.message || "Failed to create user" }, 400);

      await admin.from("profiles").upsert(
        {
          id: created.user.id,
          full_name: full_name ?? "",
          email: String(email).trim().toLowerCase(),
          phone: phone ?? null,
          country_iso3: country_iso3 ?? null,
          country_name: country_name ?? null,
          currency: currency ?? null,
        },
        { onConflict: "id" }
      );

      return json({ success: true, user_id: created.user.id });
    }

    if (action === "update_user") {
      const { user_id, email, password, full_name, phone, country_iso3, country_name, currency } = body;
      if (!user_id) return json({ error: "user_id is required" }, 400);

      const attrs: Record<string, unknown> = {};
      if (email) attrs.email = String(email).trim().toLowerCase();
      if (password) attrs.password = password;
      if (Object.keys(attrs).length > 0) {
        const { error: updateError } = await admin.auth.admin.updateUserById(user_id, attrs as any);
        if (updateError) return json({ error: updateError.message }, 400);
      }

      const profilePatch: Record<string, unknown> = { id: user_id };
      if (email !== undefined) profilePatch.email = String(email).trim().toLowerCase();
      if (full_name !== undefined) profilePatch.full_name = full_name;
      if (phone !== undefined) profilePatch.phone = phone;
      if (country_iso3 !== undefined) profilePatch.country_iso3 = country_iso3;
      if (country_name !== undefined) profilePatch.country_name = country_name;
      if (currency !== undefined) profilePatch.currency = currency;

      if (Object.keys(profilePatch).length > 1) {
        await admin.from("profiles").upsert(profilePatch as any, { onConflict: "id" });
      }

      return json({ success: true });
    }

    if (action === "set_disabled") {
      const { user_id, disabled } = body;
      if (!user_id) return json({ error: "user_id is required" }, 400);
      const { error } = await admin.auth.admin.updateUserById(user_id, {
        ban_duration: disabled ? "876000h" : "none",
      } as any);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (action === "delete_user") {
      const { user_id } = body;
      if (!user_id) return json({ error: "user_id is required" }, 400);
      if (user_id === user.id) return json({ error: "You cannot delete your own account" }, 400);
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (action === "set_role") {
      const { user_id, role, enabled } = body;
      if (!user_id || !role) return json({ error: "user_id and role are required" }, 400);
      if (enabled) {
        await admin.from("user_roles").upsert({ user_id, role }, { onConflict: "user_id,role" });
      } else {
        await admin.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      }
      return json({ success: true });
    }

    if (action === "set_subscription") {
      const { user_id, plan_id, status, current_period_end, grace_days } = body;
      if (!user_id) return json({ error: "user_id is required" }, 400);

      const { data: existing } = await admin
        .from("subscriptions")
        .select("id")
        .eq("user_id", user_id)
        .maybeSingle();

      const payload: Record<string, unknown> = {
        user_id,
        plan_id: plan_id ?? null,
        status: status ?? "active",
        current_period_end:
          current_period_end ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      if (grace_days !== undefined) payload.grace_days = grace_days;

      if (existing) {
        const { error } = await admin.from("subscriptions").update(payload).eq("id", existing.id);
        if (error) return json({ error: error.message }, 400);
      } else {
        const { error } = await admin.from("subscriptions").insert(payload);
        if (error) return json({ error: error.message }, 400);
      }
      return json({ success: true });
    }

    if (action === "cancel_subscription") {
      const { user_id } = body;
      if (!user_id) return json({ error: "user_id is required" }, 400);
      const { error } = await admin
        .from("subscriptions")
        .update({ status: "cancelled", cancel_at: new Date().toISOString() })
        .eq("user_id", user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("admin-users error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
