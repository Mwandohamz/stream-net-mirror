import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { validateAdminEmail } from "@/hooks/useAdmin";
import { readCachedMembership, writeCachedMembership } from "@/lib/membershipCache";

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
  // Start from the last confirmed snapshot so returning members see "active" instantly.
  const [cached] = useState(() => readCachedMembership());
  const [user, setUser] = useState<User | null>(() => (cached ? ({ id: cached.userId, email: cached.email ?? undefined } as User) : null));
  const [isSubscriber, setIsSubscriberState] = useState(cached?.isSubscriber ?? false);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(cached?.subscription ?? null);
  const [loading, setLoading] = useState(!cached);
  const hasStateRef = useRef(!!cached);
  const latestRef = useRef<{ user: User | null; sub: SubscriptionRecord | null }>({ user: cached ? ({ id: cached.userId } as User) : null, sub: cached?.subscription ?? null });
  const setIsSubscriber = useCallback((value: boolean) => {
    setIsSubscriberState(value);
    const { user: u, sub } = latestRef.current;
    writeCachedMembership(u ? { userId: u.id, email: u.email ?? null, isSubscriber: value, subscription: sub } : null);
    hasStateRef.current = !!u;
  }, []);
  const requestIdRef = useRef(0);
  const claimedRef = useRef(false);

  const resolveAccessState = useCallback(async (currentUser: User | null) => {
    const requestId = ++requestIdRef.current;

    try {
      setUser(currentUser);
      latestRef.current = { user: currentUser, sub: null };

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
      latestRef.current.sub = subscriptionRecord;

      if (isSubscriptionActive(subscriptionRecord)) {
        setIsSubscriber(true);
        return;
      }

      // 2. Claim any completed payment made with this email before the account existed.
      if (!claimedRef.current) {
        claimedRef.current = true;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) throw new Error("no session");
          const { data: claim } = await supabase.functions.invoke("claim-payments");
          if ((claim as any)?.activated > 0) {
            const { data: fresh } = await supabase
              .from("subscriptions" as any)
              .select("*")
              .eq("user_id", currentUser.id)
              .maybeSingle();
            const freshRecord = (fresh as any as SubscriptionRecord) ?? null;
            setSubscription(freshRecord);
            latestRef.current.sub = freshRecord;
            if (isSubscriptionActive(freshRecord)) {
              setIsSubscriber(true);
              return;
            }
          }
        } catch (e) {
          console.warn("claim-payments failed", e);
        }
      }

      // 3. Legacy lifetime subscriber rows
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

      // 4. Admin bypass
      if (currentUser.email) {
        const admin = await validateAdminEmail(currentUser.email);
        if (admin) {
          setIsSubscriber(true);
          return;
        }
      }

      setIsSubscriber(false);
    } catch {
      // Network failure: keep the last confirmed state instead of flashing "inactive".
      if (!hasStateRef.current) setIsSubscriberState(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [setIsSubscriber]);

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
      // Keep showing the known state while re-checking; only block on first load.
      if (!hasStateRef.current || session?.user?.id !== latestRef.current.user?.id) setLoading(true);
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

    // Lets other parts of the app (e.g. a completed payment) force a re-check.
    const onRefresh = () => {
      if (!mounted) return;
      claimedRef.current = false;
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        void resolveAccessState(session?.user ?? null);
      });
    };
    window.addEventListener("membership:refresh", onRefresh);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      window.removeEventListener("membership:refresh", onRefresh);
      authSub.unsubscribe();
    };
  }, [resolveAccessState]);

  return { user, isSubscriber, subscription, loading };
};
