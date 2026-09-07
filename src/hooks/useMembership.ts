import { useMemo } from "react";
import { useSubscriber, subscriptionAccessEnd, type SubscriptionRecord } from "@/hooks/useSubscriber";

export type MembershipState = "loading" | "guest" | "unpaid" | "active" | "grace" | "expired";

export interface Membership {
  state: MembershipState;
  loading: boolean;
  isMember: boolean;
  /** Whole days left before access ends (never negative). */
  daysLeft: number | null;
  renewsOn: Date | null;
  subscription: SubscriptionRecord | null;
  /** Label + destination for the primary call to action in the header. */
  ctaLabel: string;
  ctaHref: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function useMembership(): Membership {
  const { user, isSubscriber, subscription, loading } = useSubscriber();

  return useMemo<Membership>(() => {
    if (loading) {
      return {
        state: "loading",
        loading: true,
        isMember: false,
        daysLeft: null,
        renewsOn: null,
        subscription: null,
        ctaLabel: "Get Started",
        ctaHref: "/payment",
      };
    }

    if (!user) {
      return {
        state: "guest",
        loading: false,
        isMember: false,
        daysLeft: null,
        renewsOn: null,
        subscription: null,
        ctaLabel: "Create free account",
        ctaHref: "/signup",
      };
    }

    const periodEnd = subscription ? new Date(subscription.current_period_end) : null;
    const accessEnd = subscription ? subscriptionAccessEnd(subscription) : null;
    const now = Date.now();
    const daysLeft = accessEnd ? Math.max(0, Math.ceil((accessEnd.getTime() - now) / DAY_MS)) : null;

    if (isSubscriber) {
      const inGrace = !!periodEnd && periodEnd.getTime() <= now;
      return {
        state: inGrace ? "grace" : "active",
        loading: false,
        isMember: true,
        daysLeft,
        renewsOn: periodEnd,
        subscription,
        ctaLabel: inGrace ? "Renew membership" : "Go to my dashboard",
        ctaHref: inGrace ? "/payment" : "/dashboard",
      };
    }

    return {
      state: subscription ? "expired" : "unpaid",
      loading: false,
      isMember: false,
      daysLeft: 0,
      renewsOn: periodEnd,
      subscription,
      ctaLabel: subscription ? "Renew membership" : "Unlock streaming",
      ctaHref: "/payment",
    };
  }, [user, isSubscriber, subscription, loading]);
}
