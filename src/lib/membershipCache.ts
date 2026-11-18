import type { SubscriptionRecord } from "@/hooks/useSubscriber";

/** Device-local snapshot of the last confirmed membership. Holds status/expiry only. */
export interface CachedMembership {
  userId: string;
  email: string | null;
  isSubscriber: boolean;
  subscription: SubscriptionRecord | null;
  savedAt: number;
}

export const MEMBERSHIP_CACHE_KEY = "snm:membership:v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function accessEndMs(sub: SubscriptionRecord): number {
  const end = new Date(sub.current_period_end);
  end.setDate(end.getDate() + (sub.grace_days ?? 0));
  return end.getTime();
}

/** Returns the cached snapshot, downgrading any membership whose access has already ended. */
export function parseCachedMembership(raw: string | null, now = Date.now()): CachedMembership | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as CachedMembership;
    if (!data || typeof data.userId !== "string" || typeof data.savedAt !== "number") return null;
    if (now - data.savedAt > MAX_AGE_MS) return null;
    let isSubscriber = !!data.isSubscriber;
    if (isSubscriber && data.subscription) {
      const sub = data.subscription;
      if (sub.status === "cancelled" || sub.status === "disabled" || accessEndMs(sub) <= now) isSubscriber = false;
    }
    return { ...data, isSubscriber };
  } catch {
    return null;
  }
}

export function readCachedMembership(): CachedMembership | null {
  try { return parseCachedMembership(localStorage.getItem(MEMBERSHIP_CACHE_KEY)); } catch { return null; }
}

export function writeCachedMembership(value: Omit<CachedMembership, "savedAt"> | null) {
  try {
    if (!value) localStorage.removeItem(MEMBERSHIP_CACHE_KEY);
    else localStorage.setItem(MEMBERSHIP_CACHE_KEY, JSON.stringify({ ...value, savedAt: Date.now() }));
  } catch { /* storage unavailable */ }
}
