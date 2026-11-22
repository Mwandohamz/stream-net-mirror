import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { requireAdmin } from "../_shared/adminAuth.ts";
import { canPublishHighlight } from "./logic.ts";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list"), page: z.number().int().min(1).max(10000).default(1), status: z.enum(["pending", "published", "all"]).default("pending") }),
  z.object({ action: z.literal("publish"), id: z.string().uuid(), published: z.boolean() }),
]);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return json({ error: auth.error }, auth.status);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Invalid highlights request" }, 400);
    const body = parsed.data;
    if (body.action === "list") {
      let query = auth.admin.from("football_highlights")
        .select("id,youtube_video_id,title,channel_title,thumbnail_url,published_at,competition_code,is_published,is_embeddable,availability_status,api_data_expires_at,source:football_video_sources(source_name,is_enabled)", { count: "exact" })
        .order("published_at", { ascending: false }).order("id");
      if (body.status !== "all") query = query.eq("is_published", body.status === "published");
      const result = await query.range((body.page - 1) * 100, body.page * 100 - 1);
      if (result.error) throw result.error;
      return json({ highlights: result.data, total: result.count ?? 0 });
    }
    if (body.published) {
      const { data: video, error } = await auth.admin.from("football_highlights")
        .select("is_embeddable,availability_status,api_data_expires_at,source_id").eq("id", body.id).maybeSingle();
      if (error) throw error;
      if (!video) return json({ error: "Video not found" }, 404);
      const source = await auth.admin.from("football_video_sources").select("is_enabled").eq("id", video.source_id).maybeSingle();
      if (source.error) throw source.error;
      if (!canPublishHighlight(video, source.data?.is_enabled === true)) return json({ error: "This video is unavailable, expired, or its channel is disabled. Wait for the next scheduled refresh before approving." }, 409);
    }
    const { data, error } = await auth.admin.from("football_highlights")
      .update({ is_published: body.published, updated_at: new Date().toISOString() }).eq("id", body.id).select("id,is_published").maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "Video not found" }, 404);
    return json({ success: true, highlight: data });
  } catch (error) {
    console.error("admin-highlights:", error instanceof Error ? error.message : "unknown error");
    return json({ error: "Could not update highlights. Please try again." }, 500);
  }
});