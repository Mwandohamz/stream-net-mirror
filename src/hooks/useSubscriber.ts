import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { validateAdminEmail } from "@/hooks/useAdmin";

const LOADING_TIMEOUT_MS = 8000;

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  current_period_start: string;
  current_period_end: string;
  grace_days: number;
  cancel_at: string | null;
}

export function subscriptionAccessEnd(sub: SubscriptionRecord): Date {
  const end = new Date(sub.current_period_end);
  end.setDate(end.getDate() + (sub.grace_days ?? 0));
  return end;
}

export function isSubscriptionActive(sub: SubscriptionRecord | null): boolean {
  if (!sub) return false;
  if (sub.status === "cancelled" || sub.status === "disabled") return false;
  return subscriptionAccessEnd(sub).getTime() > Date.now();
}

export const useSubscriber = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const resolveAccessState = useCallback(async (currentUser: User | null) => {
    const requestId = ++requestIdRef.current;

    try {
      setUser(currentUser);

      if (!currentUser) {
        setIsSubscriber(false);
        setSubscription(null);
        return;
      }

      // 1. Subscription record (current model)
      const { data: sub } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      const subscriptionRecord = (sub as any as SubscriptionRecord) ?? null;
      setSubscription(subscriptionRecord);

      if (isSubscriptionActive(subscriptionRecord)) {
        setIsSubscriber(true);
        return;
      }

      // 2. Legacy lifetime subscriber rows
      const { data: legacy } = await supabase
        .from("subscribers")
        .select("id, status")
        .eq("user_id", currentUser.id)
        .eq("status", "active")
        .maybeSingle();

      if (legacy) {
        setIsSubscriber(true);
        return;
      }

      // 3. Admin bypass
      if (currentUser.email) {
        const admin = await validateAdminEmail(currentUser.email);
        if (admin) {
          setIsSubscriber(true);
          return;
        }
      }

      setIsSubscriber(false);
    } catch {
      setIsSubscriber(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const timeout = setTimeout(() => {
      if (!mounted) return;
      setLoading(false);
    }, LOADING_TIMEOUT_MS);

    // Keep callback non-blocking to avoid auth deadlocks.
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setLoading(true);
      setTimeout(() => {
        if (!mounted) return;
        void resolveAccessState(session?.user ?? null);
      }, 0);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        void resolveAccessState(session?.user ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      authSub.unsubscribe();
    };
  }, [resolveAccessState]);

  return { user, isSubscriber, subscription, loading };
};
