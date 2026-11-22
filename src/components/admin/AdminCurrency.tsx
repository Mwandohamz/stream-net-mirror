import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminDisplayCurrency } from "@/lib/adminCurrency";

const STORAGE_KEY = "admin_display_currency";

type AdminCurrencyValue = {
  currency: AdminDisplayCurrency;
  setCurrency: (currency: AdminDisplayCurrency) => void;
};

const AdminCurrencyContext = createContext<AdminCurrencyValue>({
  currency: "USD",
  setCurrency: () => undefined,
});

export function AdminCurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<AdminDisplayCurrency>(() => {
    if (typeof window === "undefined") return "USD";
    return window.localStorage.getItem(STORAGE_KEY) === "ZMW" ? "ZMW" : "USD";
  });

  const value = useMemo<AdminCurrencyValue>(() => ({
    currency,
    setCurrency: (next) => {
      setCurrencyState(next);
      window.localStorage.setItem(STORAGE_KEY, next);
    },
  }), [currency]);

  return <AdminCurrencyContext.Provider value={value}>{children}</AdminCurrencyContext.Provider>;
}

export const useAdminCurrency = () => useContext(AdminCurrencyContext);

export function AdminCurrencyToggle() {
  const { currency, setCurrency } = useAdminCurrency();
  return (
    <div className="ml-auto flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">Money view</span>
      <Select value={currency} onValueChange={(value) => setCurrency(value as AdminDisplayCurrency)}>
        <SelectTrigger className="h-8 w-[104px] bg-secondary" aria-label="Admin money currency">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USD">USD</SelectItem>
          <SelectItem value="ZMW">ZMW</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
