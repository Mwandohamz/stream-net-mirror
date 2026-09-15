/**
 * Tiny in-memory cache for admin sections that load their data directly.
 * Keeps the last result for the browsing session so switching between admin
 * pages shows data instantly while a fresh copy loads in the background.
 */
const store = new Map<string, { value: unknown; at: number }>();

/** How long a cached snapshot is considered good enough to show immediately. */
const MAX_AGE = 5 * 60_000;

export function getAdminCache<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > MAX_AGE) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function setAdminCache<T>(key: string, value: T) {
  store.set(key, { value, at: Date.now() });
}

export function clearAdminCache(prefix?: string) {
  if (!prefix) return store.clear();
  for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k);
}
