import { useEffect, useState } from "react";

interface FxCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
let memoryCache: FxCache | null = null;
let inflight: Promise<FxCache | null> | null = null;

const FX_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fx-rates`;

async function loadRates(): Promise<FxCache | null> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL_MS) return memoryCache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(FX_URL, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const data = await res.json();
      if (!data?.rates) return null;
      memoryCache = { rates: data.rates, fetchedAt: Date.now() };
      return memoryCache;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Exchange rates with USD as the base currency. */
export function useFxRates() {
  const [rates, setRates] = useState<Record<string, number> | null>(memoryCache?.rates ?? null);
  const [loading, setLoading] = useState(!memoryCache);

  useEffect(() => {
    let mounted = true;
    void loadRates().then((cache) => {
      if (!mounted) return;
      setRates(cache?.rates ?? null);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  /** Converts a USD amount into the target currency. Returns null when the rate is unknown. */
  const convertFromUSD = (usd: number, currency: string): number | null => {
    if (currency === "USD") return usd;
    if (!rates || !rates[currency]) return null;
    return usd * rates[currency];
  };

  /** Converts an amount in `currency` back into USD. */
  const convertToUSD = (amount: number, currency: string): number | null => {
    if (currency === "USD") return amount;
    if (!rates || !rates[currency]) return null;
    return amount / rates[currency];
  };

  const rateFor = (currency: string): number | null => {
    if (currency === "USD") return 1;
    return rates?.[currency] ?? null;
  };

  return { rates, loading, convertFromUSD, convertToUSD, rateFor };
}
