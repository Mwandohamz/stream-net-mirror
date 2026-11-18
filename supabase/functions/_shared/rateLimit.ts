import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface RateLimitResult { allowed: boolean; remaining: number; retryAfter: number }

/** Hashed caller identity: signed-in user ID when available, otherwise the client IP (never stored raw). */
export async function rateLimitSubject(req: Request, userId?: string | null): Promise<string> {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const raw = userId ? `user:${userId}` : `ip:${ip}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Records an attempt; fails open on infrastructure errors so real users are never locked out by an outage. */
export async function checkRateLimit(
  admin: SupabaseClient, bucket: string, subject: string,
  max: number, windowSeconds: number, blockSeconds = windowSeconds,
): Promise<RateLimitResult> {
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_bucket: bucket, p_subject: subject, p_max: max, p_window_seconds: windowSeconds, p_block_seconds: blockSeconds,
  });
  if (error || !data) { console.warn("rate limit check failed", error?.message); return { allowed: true, remaining: max, retryAfter: 0 }; }
  const d = data as { allowed: boolean; remaining: number; retry_after: number };
  return { allowed: d.allowed, remaining: d.remaining, retryAfter: d.retry_after };
}
