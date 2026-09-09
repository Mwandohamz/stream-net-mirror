import { supabase } from "@/integrations/supabase/client";

let sessionId: string | null = null;

const getSessionId = () => {
  if (!sessionId) {
    sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem("analytics_session_id", sessionId);
    }
  }
  return sessionId;
};

/** Pages already counted for this session — stops refreshes inflating the numbers. */
const seen = new Set<string>();

const isInternalTraffic = () => {
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return true;
  // Lovable preview iframes are the team testing, not real visitors.
  if (h.includes("lovableproject.com") || h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (window.self !== window.top) return true;
  return false;
};

export const trackPageView = async (page: string) => {
  try {
    // Never record admin screens or our own testing as visitor traffic.
    if (page.startsWith("/admin") || page.startsWith("/influencer")) return;
    if (isInternalTraffic()) return;
    if (seen.has(page)) return;
    seen.add(page);

    await supabase.from("page_views").insert({
      page,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
    });
  } catch (e) {
    // Silent fail for analytics
  }
};
