import { useState, useEffect } from "react";
import { getActiveConf } from "@/lib/pawapay";

export interface ProviderConf {
  correspondentId: string;
  displayName: string;
  logo: string;
  status: string;
  prefix: string[];
  decimalsInAmount: string;
  minAmount: string;
  maxAmount: string;
  nameDisplayedToCustomer?: string;
  pinPrompt?: string;
  pinPromptInstructions?: string[];
  pinPromptRevivable?: boolean;
  revivalInstructions?: string[];
}

export function useActiveConf(countryIso3: string) {
  const [providers, setProviders] = useState<ProviderConf[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryIso3) return;
    setLoading(true);
    setError(null);
    setProviders([]);

    getActiveConf(countryIso3)
      .then((data) => {
        // pawaPay returns array of correspondents or wrapped object
        const items = Array.isArray(data) ? data : data?.correspondents ?? data?.data ?? [];
        setProviders(
          items.map((item: any) => ({
            correspondentId: item.correspondentId ?? item.correspondent ?? "",
            displayName: item.displayName ?? item.correspondentId ?? "",
            logo: item.logo ?? "",
            status: item.operationTypes?.[0]?.status ?? item.status ?? "OPERATIONAL",
            prefix: item.operationTypes?.[0]?.prefix ?? item.prefix ?? [],
            decimalsInAmount: item.operationTypes?.[0]?.decimalsInAmount ?? item.decimalsInAmount ?? "TWO",
            minAmount: item.operationTypes?.[0]?.minAmount ?? item.minAmount ?? "0",
            maxAmount: item.operationTypes?.[0]?.maxAmount ?? item.maxAmount ?? "999999",
            nameDisplayedToCustomer: item.operationTypes?.[0]?.nameDisplayedToCustomer ?? "",
            pinPrompt: item.operationTypes?.[0]?.pinPrompt ?? "AUTO",
            pinPromptInstructions: item.operationTypes?.[0]?.pinPromptInstructions ?? [],
            pinPromptRevivable: item.operationTypes?.[0]?.pinPromptRevivable ?? false,
            revivalInstructions: item.operationTypes?.[0]?.revivalInstructions ?? [],
          }))
        );
      })
      .catch((e) => setError("Unable to load payment options. Please try again."))
      .finally(() => setLoading(false));
  }, [countryIso3]);

  return { providers, loading, error };
}
