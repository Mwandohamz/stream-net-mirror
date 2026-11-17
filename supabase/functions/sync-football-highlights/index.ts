
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";
const MAX_VIDEOS_PER_CHANNEL = 20;
const CACHE_HOURS = 24;

async function youtubeRequest(
  endpoint: string,
  params: Record<string, string>,
) {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not configured");

  const url = new URL(`${YOUTUBE_API}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(15000),
  });

  const result = await response.json();

  if (!response.ok) {
    const reason = result?.error?.errors?.[0]?.reason;
    const message = result?.error?.message || "YouTube API request failed";
    const error = new Error(message);
    Object.assign(error, {
      status: response.status,
      reason: reason || "youtube_api_error",
    });
    throw error;
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const startedAt = new Date();

  try {
    // 1. Verify the signed-in caller.
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } =
      await userClient.auth.getUser();

    if (authError || !user) {
      return json({ error: "Invalid authentication" }, 401);
    }

    // 2. Verify admin role.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const callerEmail = (user.email || "").trim().toLowerCase();
    const adminEmails = (Deno.env.get("ADMIN_EMAILS") || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    let isAdmin = adminEmails.includes(callerEmail);

    if (!isAdmin) {
      const { data: role } = await admin
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      isAdmin = !!role;
    }

    if (!isAdmin) {
      return json({ error: "Administrator access required" }, 403);
    }

    // 3. Read enabled sources.
    const { data: sources, error: sourceError } = await admin
      .from("football_video_sources")
      .select("*")
      .eq("is_enabled", true);

    if (sourceError) throw sourceError;

    const configuredSources = (sources || []).filter(
      (source: any) => !!source.youtube_channel_id,
    );

    const now = new Date();

    const dueSources = configuredSources.filter((source: any) => {
      if (!source.last_synced_at) return true;

      const interval = Math.max(
        5,
        Number(source.sync_interval_minutes || 60),
      );

      const lastSync = new Date(source.last_synced_at).getTime();
      return now.getTime() - lastSync >= interval * 60 * 1000;
    });

    if (dueSources.length === 0) {
      return json({
        success: true,
        message: "No configured channels are due for synchronisation.",
        enabledSources: (sources || []).length,
        configuredSources: configuredSources.length,
        skippedSources: (sources || []).length - configuredSources.length,
        syncedSources: 0,
        videosFound: 0,
        requestCount: 0,
      });
    }

    let totalVideosFound = 0;
    let totalRequests = 0;
    let successfulSources = 0;
    let failedSources = 0;

    const sourceResults: any[] = [];

    // 4. Synchronise each configured channel.
    for (const source of dueSources as any[]) {
      const runStartedAt = new Date();

      const { data: run, error: runInsertError } = await admin
        .from("football_highlight_sync_runs")
        .insert({
          source_id: source.id,
          status: "running",
          request_count: 0,
          videos_found: 0,
          started_at: runStartedAt.toISOString(),
        })
        .select("id")
        .single();

      if (runInsertError) {
        console.error("Could not create sync run:", runInsertError);
        failedSources++;
        sourceResults.push({
          source: source.source_name,
          status: "failed",
          error: "Could not create sync log",
        });
        continue;
      }

      let sourceRequestCount = 0;
      let sourceVideosFound = 0;

      try {
        // 4a. Get the channel's uploads playlist.
        const channelData = await youtubeRequest("channels", {
          part: "contentDetails,snippet",
          id: source.youtube_channel_id,
        });
        sourceRequestCount++;
        totalRequests++;

        const channel = channelData.items?.[0];
        const uploadsPlaylist =
          channel?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylist) {
          throw new Error("Channel uploads playlist was not found");
        }

        // 4b. Get the latest 20 uploads.
        const playlistData = await youtubeRequest("playlistItems", {
          part: "snippet,contentDetails",
          playlistId: uploadsPlaylist,
          maxResults: String(MAX_VIDEOS_PER_CHANNEL),
        });
        sourceRequestCount++;
        totalRequests++;

        const videoIds = (playlistData.items || [])
          .map((item: any) =>
            item.contentDetails?.videoId || item.snippet?.resourceId?.videoId
          )
          .filter(Boolean);

        if (videoIds.length === 0) {
          successfulSources++;

          await admin
            .from("football_highlight_sync_runs")
            .update({
              status: "completed",
              request_count: sourceRequestCount,
              videos_found: 0,
              completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);

          await admin
            .from("football_video_sources")
            .update({
              last_synced_at: new Date().toISOString(),
              api_data_expires_at: new Date(
                Date.now() + CACHE_HOURS * 60 * 60 * 1000,
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", source.id);

          sourceResults.push({
            source: source.source_name,
            status: "completed",
            videosFound: 0,
          });
          continue;
        }

        // 4c. Retrieve video metadata and embeddability.
        const videoData = await youtubeRequest("videos", {
          part: "snippet,status,contentDetails",
          id: videoIds.join(","),
          maxResults: String(MAX_VIDEOS_PER_CHANNEL),
        });
        sourceRequestCount++;
        totalRequests++;

        const videos = videoData.items || [];
        sourceVideosFound = videos.length;
        totalVideosFound += videos.length;

        // 4d. Preserve publication approval for existing videos.
        const existingIds = videos.map((video: any) => video.id);

        const { data: existingRows, error: existingError } = await admin
          .from("football_highlights")
          .select("youtube_video_id,is_published")
          .eq("source_id", source.id)
          .in("youtube_video_id", existingIds);

        if (existingError) throw existingError;

        const publishedMap = new Map(
          (existingRows || []).map((row: any) => [
            row.youtube_video_id,
            row.is_published,
          ]),
        );

        const fetchedAt = new Date();
        const expiresAt = new Date(
          fetchedAt.getTime() + CACHE_HOURS * 60 * 60 * 1000,
        );

        const records = videos.map((video: any) => {
          const snippet = video.snippet || {};
          const status = video.status || {};
          const thumbnails = snippet.thumbnails || {};

          const thumbnail =
            thumbnails.maxres?.url ||
            thumbnails.standard?.url ||
            thumbnails.high?.url ||
            thumbnails.medium?.url ||
            thumbnails.default?.url ||
            null;

          return {
            source_id: source.id,
            youtube_video_id: video.id,
            title: snippet.title || "Untitled video",
            description: snippet.description || null,
            channel_title: snippet.channelTitle || channel.snippet?.title || null,
            thumbnail_url: thumbnail,
            published_at: snippet.publishedAt || null,
            competition_code: source.competition_code || null,
            is_embeddable: status.embeddable === true,
            availability_status: status.embeddable === true
              ? "available"
              : "blocked",
            is_published: publishedMap.has(video.id)
              ? publishedMap.get(video.id)
              : false,
            api_data_fetched_at: fetchedAt.toISOString(),
            api_data_expires_at: expiresAt.toISOString(),
            updated_at: fetchedAt.toISOString(),
          };
        });

        // 4e. Upsert without creating duplicate source/video combinations.
        const { error: upsertError } = await admin
          .from("football_highlights")
          .upsert(records, {
            onConflict: "source_id,youtube_video_id",
          });

        if (upsertError) throw upsertError;

        // 4f. Update source sync timestamps.
        const syncedAt = new Date();

        const { error: updateSourceError } = await admin
          .from("football_video_sources")
          .update({
            last_synced_at: syncedAt.toISOString(),
            api_data_expires_at: new Date(
              syncedAt.getTime() + CACHE_HOURS * 60 * 60 * 1000,
            ).toISOString(),
            updated_at: syncedAt.toISOString(),
          })
          .eq("id", source.id);

        if (updateSourceError) throw updateSourceError;

        // 4g. Mark sync run completed.
        await admin
          .from("football_highlight_sync_runs")
          .update({
            status: "completed",
            request_count: sourceRequestCount,
            videos_found: sourceVideosFound,
            completed_at: new Date().toISOString(),
            error_code: null,
          })
          .eq("id", run.id);

        successfulSources++;

        sourceResults.push({
          source: source.source_name,
          status: "completed",
          videosFound: sourceVideosFound,
          requests: sourceRequestCount,
        });
      } catch (error) {
        failedSources++;

        const message = error instanceof Error
          ? error.message
          : "Unknown synchronisation error";

        console.error(
          `Football highlight sync failed for ${source.source_name}:`,
          error,
        );

        await admin
          .from("football_highlight_sync_runs")
          .update({
            status: "failed",
            request_count: sourceRequestCount,
            videos_found: sourceVideosFound,
            error_code: message.slice(0, 500),
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id);

        sourceResults.push({
          source: source.source_name,
          status: "failed",
          error: message,
          requests: sourceRequestCount,
        });
      }
    }

    return json({
      success: failedSources === 0,
      message: "Football highlight synchronisation finished.",
      enabledSources: (sources || []).length,
      configuredSources: configuredSources.length,
      syncedSources: successfulSources,
      failedSources,
      videosFound: totalVideosFound,
      requestCount: totalRequests,
      results: sourceResults,
    });
  } catch (error) {
    console.error("sync-football-highlights error:", error);

    return json({
      error: error instanceof Error
        ? error.message
        : "Internal synchronisation error",
    }, 500);
  }
});
