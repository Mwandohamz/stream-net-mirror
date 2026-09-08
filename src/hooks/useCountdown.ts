import { useEffect, useState } from "react";

export type CountdownTone = "green" | "amber" | "red";

export interface Countdown {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  tone: CountdownTone;
  /** e.g. "12d 04h 31m" or "Expired" */
  label: string;
}

/**
 * Live ticking countdown to a target date. Re-renders every second so members
 * and admins see the same clock, not just a calendar date.
 */
export function useCountdown(target: Date | string | null | undefined): Countdown | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!target) return null;
  const end = typeof target === "string" ? new Date(target) : target;
  if (Number.isNaN(end.getTime())) return null;

  const totalMs = end.getTime() - now;
  const expired = totalMs <= 0;
  const abs = Math.max(0, totalMs);

  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const seconds = Math.floor((abs % 60_000) / 1000);

  const tone: CountdownTone = expired ? "red" : days >= 7 ? "green" : days >= 1 ? "amber" : "red";

  const label = expired
    ? "Expired"
    : days > 0
      ? `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`
      : `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

  return { totalMs, days, hours, minutes, seconds, expired, tone, label };
}
