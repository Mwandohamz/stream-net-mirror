import { Clock } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";

const TONE_CLASSES: Record<string, string> = {
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  red: "border-destructive/40 bg-destructive/10 text-destructive",
};

interface Props {
  /** When access actually ends (period end + grace). */
  target: Date | string | null | undefined;
  prefix?: string;
  className?: string;
}

/** Live "time left" pill: green, then amber under 7 days, red on the last day. */
const CountdownBadge = ({ target, prefix, className = "" }: Props) => {
  const countdown = useCountdown(target);
  if (!countdown) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tabular-nums ${TONE_CLASSES[countdown.tone]} ${className}`}
      title={target ? new Date(target).toLocaleString() : undefined}
    >
      <Clock size={12} aria-hidden="true" />
      {countdown.expired ? "Expired" : `${prefix ? `${prefix} ` : ""}${countdown.label}`}
    </span>
  );
};

export default CountdownBadge;
