import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ALL_COUNTRIES, type WorldCountry } from "@/data/allCountries";

const STORAGE_KEY = "snm_display_country";

interface CurrencyContextValue {
  country: WorldCountry;
  currency: string;
  setCountryIso2: (iso2: string) => void;
  countries: WorldCountry[];
}

/**
 * USD is the base currency for every visitor. The country picker only adds a
 * local equivalent on top — we never guess a currency from the browser locale.
 */
const FALLBACK: WorldCountry =
  ALL_COUNTRIES.find((c) => c.iso2 === "US") ??
  ALL_COUNTRIES.find((c) => c.currency === "USD") ??
  ALL_COUNTRIES[0];

function savedCountry(): WorldCountry {
  if (typeof window !== "undefined") {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    const savedMatch = saved ? ALL_COUNTRIES.find((c) => c.iso2 === saved) : undefined;
    if (savedMatch) return savedMatch;
  }
  return FALLBACK;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [country, setCountry] = useState<WorldCountry>(FALLBACK);

  useEffect(() => {
    setCountry(savedCountry());
  }, []);

  const setCountryIso2 = useCallback((iso2: string) => {
    const match = ALL_COUNTRIES.find((c) => c.iso2 === iso2);
    if (!match) return;
    setCountry(match);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, iso2);
    } catch {
      /* storage unavailable — selection still applies for this page */
    }
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({ country, currency: country.currency, setCountryIso2, countries: ALL_COUNTRIES }),
    [country, setCountryIso2]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export function useDisplayCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      country: FALLBACK,
      currency: FALLBACK.currency,
      setCountryIso2: () => undefined,
      countries: ALL_COUNTRIES,
    };
  }
  return ctx;
}
