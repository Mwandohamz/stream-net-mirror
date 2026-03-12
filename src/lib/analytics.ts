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

export const trackPageView = async (page: string) => {
  try {
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
