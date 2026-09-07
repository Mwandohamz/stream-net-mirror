import { usePlans, planIntervalLabel, type Plan } from "@/hooks/usePlans";
import { useFxRates } from "@/hooks/useFxRates";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrencyAmount } from "@/lib/currency";

/**
 * Single source of truth for prices shown anywhere in the app.
 * Plans (and their USD price) are managed from the admin dashboard; this hook
 * converts them into the currency that makes sense for the visitor.
 */
export function usePricing(currencyOverride?: string) {
  const { plans, loading: plansLoading } = usePlans();
  const { convertFromUSD, rateFor, loading: fxLoading } = useFxRates();
  const { profile, loading: profileLoading } = useProfile();

  const currency = (currencyOverride || profile?.currency || "ZMW").toUpperCase();
  const plan: Plan | null = plans.length > 0 ? plans[0] : null;
  const priceUsd = plan ? Number(plan.price_usd) : null;

  const toLocal = (usd: number): number | null => convertFromUSD(usd, currency);

  const formatPrice = (usd: number, targetCurrency = currency): string => {
    if (targetCurrency === "USD") return formatCurrencyAmount(usd, "USD");
    const local = convertFromUSD(usd, targetCurrency);
    if (local === null) return formatCurrencyAmount(usd, "USD");
    return formatCurrencyAmount(local, targetCurrency);
  };

  return {
    plan,
    plans,
    priceUsd,
    currency,
    localPrice: priceUsd !== null ? toLocal(priceUsd) : null,
    fxRate: rateFor(currency),
    intervalLabel: plan ? planIntervalLabel(plan) : "",
    toLocal,
    formatPrice,
    loading: plansLoading || fxLoading || profileLoading,
  };
}
