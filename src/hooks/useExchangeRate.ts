import { useState, useEffect, useRef } from "react";

interface ExchangeRateData {
  rates: Record<string, number>;
  fetchedAt: number;
}

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 min
let cachedData: ExchangeRateData | null = null;

export function useExchangeRate() {
  const [rates, setRates] = useState<Record<string, number> | null>(cachedData?.rates ?? null);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (cachedData && Date.now() - cachedData.fetchedAt < CACHE_DURATION_MS) {
      setRates(cachedData.rates);
      setLoading(false);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch("https://open.er-api.com/v6/latest/ZMW")
      .then((r) => r.json())
      .then((data) => {
        if (data.rates) {
          cachedData = { rates: data.rates, fetchedAt: Date.now() };
          setRates(data.rates);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const convertFromZMW = (zmwAmount: number, targetCurrency: string): number | null => {
    if (!rates || !rates[targetCurrency]) return null;
    return zmwAmount * rates[targetCurrency];
  };

  const getUSDEquivalent = (zmwAmount: number): number | null => {
    if (!rates || !rates.USD) return null;
    return zmwAmount * rates.USD;
  };

  return { rates, loading, error, convertFromZMW, getUSDEquivalent };
}
