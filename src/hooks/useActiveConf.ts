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
        // pawaPay v2 active-conf returns { countries: [{ providers: [...] }] }
        let items: any[] = [];
        if (data?.countries && Array.isArray(data.countries)) {
          items = data.countries[0]?.providers ?? [];
        } else if (Array.isArray(data)) {
          items = data;
        } else {
          items = data?.correspondents ?? data?.data ?? [];
        }

        setProviders(
          items.map((item: any) => {
            // Find the first currency's DEPOSIT operation
            const firstCurrency = item.currencies?.[0];
            const deposit = firstCurrency?.operationTypes?.DEPOSIT;

            // Parse pin prompt instructions from channels
            const channels = deposit?.pinPromptInstructions?.channels ?? [];
            const pinInstructions = channels[0]?.instructions?.en?.map((i: any) => i.text) ?? [];
            const revivalChannels = channels.slice(1);
            const revivalInstructions = revivalChannels[0]?.instructions?.en?.map((i: any) => i.text) ?? [];

            return {
              correspondentId: item.provider ?? item.correspondentId ?? "",
              displayName: item.displayName ?? item.provider ?? "",
              logo: item.logo ?? "",
              status: deposit?.status ?? item.status ?? "OPERATIONAL",
              prefix: [],
              decimalsInAmount: deposit?.decimalsInAmount ?? "TWO_PLACES",
              minAmount: deposit?.minAmount ?? "0",
              maxAmount: deposit?.maxAmount ?? "999999",
              nameDisplayedToCustomer: deposit?.nameDisplayedToCustomer ?? item.nameDisplayedToCustomer ?? "",
              pinPrompt: deposit?.pinPrompt ?? "AUTOMATIC",
              pinPromptInstructions: pinInstructions,
              pinPromptRevivable: deposit?.pinPromptRevivable ?? false,
              revivalInstructions: revivalInstructions,
            };
          })
        );
      })
      .catch((e) => setError("Unable to load payment options. Please try again."))
      .finally(() => setLoading(false));
  }, [countryIso3]);

  return { providers, loading, error };
}
