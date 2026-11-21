import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export type AdminAuth =
  | { ok: true; userId: string; email: string; admin: SupabaseClient }
  | { ok: false; status: number; error: string };

/** Verifies the bearer JWT locally (getClaims) and checks the admin allow-list or role. */
export async function requireAdmin(req: Request): Promise<AdminAuth> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false, status: 401, error: "Please sign in again" };
  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getClaims(authHeader.slice(7));
  const claims = data?.claims as { sub?: string; email?: string } | undefined;
  if (error) console.warn("admin auth claims error:", error.message);
  if (error || !claims?.sub) return { ok: false, status: 401, error: "Your session expired. Please sign in again" };
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const email = String(claims.email ?? "").toLowerCase();
  const allow = (Deno.env.get("ADMIN_EMAILS") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  let isAdmin = !!email && allow.includes(email);
  if (!isAdmin) {
    const { data: row } = await admin.from("user_roles").select("id").eq("user_id", claims.sub).eq("role", "admin").maybeSingle();
    isAdmin = !!row;
  }
  if (!isAdmin) return { ok: false, status: 403, error: "Admin access required" };
  return { ok: true, userId: claims.sub, email, admin };
}
