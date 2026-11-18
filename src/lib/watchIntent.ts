import type { MembershipState } from "@/hooks/useMembership";

/** Where a public "Watch" tap leads: account first, then payment, then the member Watch hub. */
export function publicWatchDestination(state: MembershipState): string {
  if (state === "active" || state === "grace") return "/dashboard?tab=watch";
  if (state === "guest" || state === "loading") return "/signup?next=%2Fpayment";
  return "/payment";
}
