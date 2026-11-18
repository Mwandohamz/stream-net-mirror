
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders as sdkCorsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { tmdbRequest } from "../_shared/tmdb.ts";
import { positiveInteger, regionCode } from "../_shared/catalogRules.ts";

const corsHeaders = {
  ...sdkCorsHeaders,
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    `${sdkCorsHeaders["Access-Control-Allow-Headers"]}, apikey, x-client-info, content-type`,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const validMediaType = (value: unknown): "movie" | "tv" | "multi" => {
  if (value !== "movie" && value !== "tv" && value !== "multi") {
    throw new TypeError("Invalid media type");
  }
  return value;
};

async function makeCacheKey(input: Record<string, unknown>) {
  const canonical = JSON.stringify(
    Object.fromEntries(
      Object.entries(input).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );

  return "tmdb:v1:" +
    Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const payload = await req.json().catch(() => null);

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return json({ error: "Invalid request body" }, 400);
    }

    const action = payload.action;
    const mediaType = validMediaType(payload.mediaType);
    const page = positiveInteger(payload.page ?? 1, 500);
    const language = payload.language ?? "en-US";
    const region = regionCode(payload.region);

    if (!Number.isInteger(page) || page < 1 || page > 500) {
      return json({ error: "Invalid page number" }, 400);
    }

    if (
      typeof language !== "string" ||
      !/^[a-z]{2}-[A-Z]{2}$/.test(language)
    ) {
      return json({ error: "Invalid language" }, 400);
    }

    let path = "";
    const params: Record<string, string | number | boolean | undefined> = {
      language,
    };

    let cacheType: "search" | "discover" | "trending" | "details" | "providers";
    let cacheMediaType: "movie" | "tv" | "multi" = mediaType;
    let ttlHours = 6;

    switch (action) {
        case "providers": {
        if (mediaType === "multi") {
          return json({ error: "Providers require movie or tv" }, 400);
        }

        if (!region) {
          return json({
            error: "A country code is required to load streaming providers",
          }, 400);
        }

        path = `/watch/providers/${mediaType}`;
        params.watch_region = region;

        cacheType = "providers";
        ttlHours = 24;
        break;
      }
      case "search": {
        if (mediaType === "multi" && !payload.query) {
          return json({ error: "Search query is required" }, 400);
        }

        if (typeof payload.query !== "string") return json({ error: "Invalid search query" }, 400);
        const query = payload.query.trim();

        if (!query || query.length > 120) {
          return json({ error: "Search query must be 1–120 characters" }, 400);
        }

        path = `/search/${mediaType}`;
        params.query = query;
        params.page = page;
        params.include_adult = false;

        cacheType = "search";
        cacheMediaType = mediaType;
        ttlHours = 3;
        break;
      }

      case "trending": {
        if (mediaType === "multi") {
          path = "/trending/all/week";
        } else {
          path = `/trending/${mediaType}/week`;
        }

        params.page = page;
        cacheType = "trending";
        ttlHours = 12;
        break;
      }

      case "discover": {
        if (mediaType === "multi") {
          return json({ error: "Discover requires movie or tv" }, 400);
        }

        path = `/discover/${mediaType}`;
        params.page = page;
        params.sort_by = "popularity.desc";
        params.include_adult = false;

        const year = payload.year;
        if (year !== undefined) {
          const parsedYear = Number(year);
          if (!Number.isInteger(parsedYear) || parsedYear < 1888 || parsedYear > 2100) {
            return json({ error: "Invalid release year" }, 400);
          }

          params[mediaType === "movie" ? "primary_release_year" : "first_air_date_year"] = parsedYear;
        }

        const providerId = payload.providerId;
        if (payload.genreId !== undefined) params.with_genres = positiveInteger(payload.genreId, 20000);

        if (providerId !== undefined && providerId !== null) {
          const parsedProvider = positiveInteger(providerId);

          if (!Number.isInteger(parsedProvider) || parsedProvider <= 0) {
            return json({ error: "Invalid provider ID" }, 400);
          }

          if (!region) {
            return json({
              error: "A country code is required when filtering by streaming provider",
            }, 400);
          }

          params.with_watch_providers = parsedProvider;
          params.watch_region = region;
        }

        cacheType = "discover";
        ttlHours = 12;
        break;
      }

      case "details": {
        if (mediaType === "multi") {
          return json({ error: "Details requires movie or tv" }, 400);
        }

        const id = Number(payload.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
          return json({ error: "Invalid TMDB title ID" }, 400);
        }

        path = `/${mediaType}/${id}`;
        params.append_to_response = "credits,videos,images";

        cacheType = "details";
        ttlHours = 24;
        break;
      }

      default:
        return json({ error: "Unsupported catalogue action" }, 400);
    }

    const cacheInput = {
      action,
      mediaType: cacheMediaType,
      path,
      params,
      region: params.watch_region ?? null,
    };

    const cacheKey = await makeCacheKey(cacheInput);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Check database cache first.
    const { data: cached } = await supabase
      .from("tmdb_catalog_cache")
      .select("payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (
      cached?.payload &&
      Date.parse(cached.expires_at) > Date.now()
    ) {
      return json({
        success: true,
        cached: true,
        data: cached.payload,
      });
    }

    // Fetch fresh data from TMDB.
    const data = await tmdbRequest(path, params);

    // Save fresh response in Supabase.
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + ttlHours * 60 * 60 * 1000,
    );

    const { error: cacheError } = await supabase
      .from("tmdb_catalog_cache")
      .upsert({
        cache_key: cacheKey,
        media_type: cacheMediaType,
        query_type: cacheType,
        query_text: typeof payload.query === "string"
          ? payload.query.trim()
          : null,
        region: region ?? null,
        provider_id: payload.providerId
          ? Number(payload.providerId)
          : null,
        page,
        payload: data,
        fetched_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: "cache_key" });

    if (cacheError) {
      console.error("TMDB cache write failed:", cacheError.message);
    }

    return json({
      success: true,
      cached: false,
      data,
    });
  } catch (error) {
    if (error instanceof TypeError) return json({ error: error.message }, 400);
    const status = (error as { status?: number }).status;

    console.error("TMDB catalogue error:", error);

    if (status === 429) {
      return json({ error: "TMDB rate limit reached. Try again later." }, 429);
    }

    if (status && status >= 400 && status < 500) {
      return json({ error: "TMDB rejected the request" }, 502);
    }

    return json({
      error: error instanceof Error
        ? error.message
        : "Catalogue service unavailable",
    }, 500);
  }
});
