import { usePlans, planIntervalLabel, type Plan } from "@/hooks/usePlans";
import { useFxRates } from "@/hooks/useFxRates";
import { useProfile } from "@/hooks/useProfile";
import { useDisplayCurrency } from "@/context/CurrencyContext";
import { formatMoney, formatUsd } from "@/lib/currency";

/**
 * Single source of truth for prices shown anywhere in the app.
 * Plans (and their USD price) are managed from the admin dashboard; this hook
 * converts them into the currency the visitor selected (or their own country's).
 */
export function usePricing(currencyOverride?: string) {
  const { plans, loading: plansLoading } = usePlans();
  const { rateFor, loading: fxLoading } = useFxRates();
  const { profile, loading: profileLoading } = useProfile();
  const { currency: displayCurrency } = useDisplayCurrency();

  const currency = (currencyOverride || displayCurrency || profile?.currency || "USD").toUpperCase();
  const plan: Plan | null = plans.length > 0 ? plans[0] : null;
  const priceUsd = plan ? Number(plan.price_usd) : null;
  const fxRate = rateFor(currency);

  /** Converts a USD amount into the display currency (no rounding applied). */
  const toLocal = (usd: number): number | null => (fxRate === null ? null : usd * fxRate);

  /** Formatted price in the target currency, rounded once at display time. */
  const formatPrice = (usd: number, targetCurrency = currency): string =>
    formatMoney(usd, targetCurrency, rateFor(targetCurrency));

  return {
    plan,
    plans,
    priceUsd,
    currency,
    localPrice: priceUsd !== null ? toLocal(priceUsd) : null,
    fxRate,
    intervalLabel: plan ? planIntervalLabel(plan) : "",
    toLocal,
    formatPrice,
    formatUsd,
    /** True when the display currency is not USD, so both figures should show. */
    showsConversion: currency !== "USD" && fxRate !== null,
    loading: plansLoading || fxLoading || profileLoading,
  };
}
