import { useNavigate } from "react-router-dom";
import { AlertTriangle, Lock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMembership } from "@/hooks/useMembership";
import { usePricing } from "@/hooks/usePricing";

/**
 * Slim status strip shown under the navbar. It makes the difference between a
 * signed-out visitor, a signed-in unpaid account and an active member obvious
 * on every page, using one shared visual language.
 */
const MembershipBanner = () => {
  const navigate = useNavigate();
  const { state, daysLeft, renewsOn, ctaLabel, ctaHref } = useMembership();
  const { priceUsd, formatPrice, loading } = usePricing();

  if (state === "loading" || state === "guest") return null;

  const priceLabel = priceUsd === null || loading ? "" : formatPrice(priceUsd);
  const expiringSoon = state === "active" && daysLeft !== null && daysLeft <= 7;

  let tone = "bg-primary/10 border-primary/30 text-foreground";
  let Icon = Lock;
  let message = `Your account is ready. Unlock streaming${priceLabel ? ` for ${priceLabel}` : ""}.`;

  if (state === "active" && !expiringSoon) {
    tone = "bg-emerald-500/10 border-emerald-500/30 text-foreground";
    Icon = PlayCircle;
    message = daysLeft !== null ? `Membership active — renews in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.` : "Membership active.";
  } else if (expiringSoon || state === "grace") {
    tone = "bg-amber-500/10 border-amber-500/40 text-foreground";
    Icon = AlertTriangle;
    message = renewsOn
      ? `Renew before ${renewsOn.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} to keep watching.`
      : "Renew to keep watching.";
  } else if (state === "expired") {
    tone = "bg-amber-500/10 border-amber-500/40 text-foreground";
    Icon = AlertTriangle;
    message = "Your membership has ended. Renew to switch your streaming links back on.";
  }

  return (
    <div className={`container mx-auto mt-1.5 flex items-center justify-between gap-2 rounded-full border px-3 py-1 backdrop-blur-md md:px-4 ${tone}`}>
      <p className="flex min-w-0 items-center gap-2 text-[11px] md:text-xs">
        <Icon size={14} className="shrink-0" aria-hidden="true" />
        <span className="truncate">{message}</span>
      </p>
      <Button
        size="sm"
        className="h-6 shrink-0 rounded-full bg-primary px-3 text-[11px] text-primary-foreground hover:bg-primary/80"
        onClick={() => navigate(ctaHref)}
      >
        {ctaLabel}
      </Button>
    </div>
  );
};


export default MembershipBanner;
