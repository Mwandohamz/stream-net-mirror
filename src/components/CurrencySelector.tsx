import { useDisplayCurrency } from "@/context/CurrencyContext";
import { Globe } from "lucide-react";

/**
 * Lets a visitor pick the country whose currency prices are shown in.
 * The admin's USD price is always displayed alongside the converted amount.
 */
const CurrencySelector = ({ className = "" }: { className?: string }) => {
  const { country, countries, setCountryIso2 } = useDisplayCurrency();

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Globe size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
      <label htmlFor="currency-country" className="sr-only">
        Show prices for country
      </label>
      <select
        id="currency-country"
        value={country.iso2}
        onChange={(e) => setCountryIso2(e.target.value)}
        className="h-9 max-w-[190px] rounded-md border border-border bg-secondary px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {countries.map((c) => (
          <option key={c.iso2} value={c.iso2}>
            {c.flag} {c.name} ({c.currency})
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;
