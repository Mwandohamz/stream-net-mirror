export const NATIVE_SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
const KEY = "streamnetmirror.native-session-window.v1";
interface SessionWindow { userId: string; expiresAt: number }

export function sessionWindowExpired(expiresAt: number, now = Date.now()): boolean {
  return !Number.isFinite(expiresAt) || now >= expiresAt;
}

export function nativeSessionWindow(userId: string, now = Date.now()): SessionWindow {
  try {
    const stored: SessionWindow = JSON.parse(localStorage.getItem(KEY) || "null");
    if (stored?.userId === userId && Number.isFinite(stored.expiresAt)) return stored;
  } catch { /* Reset malformed metadata, never credentials. */ }
  return startNativeSession(userId, now);
}

export function startNativeSession(userId: string, now = Date.now()): SessionWindow {
  const record = { userId, expiresAt: now + NATIVE_SESSION_DURATION_MS };
  localStorage.setItem(KEY, JSON.stringify(record));
  return record;
}

export function clearNativeSessionWindow() { localStorage.removeItem(KEY); }