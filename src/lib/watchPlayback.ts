export type EmbedMode = "iframe" | "webview" | "external";

export const normalizeEmbedMode = (mode: string | null | undefined): EmbedMode =>
  mode === "webview" || mode === "external" ? mode : "iframe";

export const isStreamingCategory = (slug: string): boolean =>
  slug === "netmirror" || slug === "live-sports";

export const watchPath = (id: string): string => `/watch/${encodeURIComponent(id)}`;

export const isSafeStreamUrl = (url: string): boolean => {
  try { return ["https:", "http:"].includes(new URL(url).protocol); }
  catch { return false; }
};

export const FRAME_TIMEOUT_MS = 6_000;