import { useState, useEffect, useRef, useCallback } from "react";
import { checkDepositStatus } from "@/lib/pawapay";

type PaymentStatusResult = {
  status: "PENDING" | "COMPLETED" | "FAILED" | "TIMEOUT" | null;
  data: any;
  error: string | null;
};

const POLL_INTERVAL = 5000;
const TIMEOUT_MS = 3 * 60 * 1000; // 3 min

export function usePaymentStatus(depositId: string | null) {
  const [result, setResult] = useState<PaymentStatusResult>({ status: null, data: null, error: null });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!depositId) return;
    stoppedRef.current = false;
    setResult({ status: "PENDING", data: null, error: null });

    const poll = async () => {
      if (stoppedRef.current) return;
      try {
        const data = await checkDepositStatus(depositId);
        const status = data?.status ?? data?.[0]?.status;
        if (status === "COMPLETED") {
          setResult({ status: "COMPLETED", data: data?.[0] ?? data, error: null });
          stop();
        } else if (status === "FAILED") {
          const reason = data?.[0]?.failureReason?.failureMessage ?? data?.failureReason?.failureMessage ?? "Payment failed";
          setResult({ status: "FAILED", data: data?.[0] ?? data, error: reason });
          stop();
        }
      } catch {
        // don't mark as failed on network error
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    timeoutRef.current = setTimeout(() => {
      stop();
      setResult((prev) => prev.status === "PENDING" ? { status: "TIMEOUT", data: null, error: "Payment timed out. Please try again." } : prev);
    }, TIMEOUT_MS);

    return stop;
  }, [depositId, stop]);

  return result;
}
