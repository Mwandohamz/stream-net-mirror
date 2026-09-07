import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ALL_COUNTRIES, findCountry, type WorldCountry } from "@/data/allCountries";

interface CountrySelectProps {
  value?: string | null;
  onChange: (country: WorldCountry) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

const CountrySelect = ({ value, onChange, placeholder = "Select your country", disabled, id }: CountrySelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = findCountry(value);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso2.toLowerCase() === q ||
        c.iso3.toLowerCase() === q ||
        c.prefix.includes(q)
    );
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-background border-border font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <span aria-hidden="true">{selected.flag}</span>
              <span className="truncate">{selected.name}</span>
              <span className="text-muted-foreground text-xs">{selected.prefix}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover border-border" align="start">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country or code"
            className="border-0 focus-visible:ring-0 px-0 h-10"
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {results.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">No country found</p>
          )}
          {results.map((c) => (
            <button
              key={c.iso3}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
                setQuery("");
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors",
                selected?.iso3 === c.iso3 && "bg-accent"
              )}
            >
              <span aria-hidden="true">{c.flag}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.prefix}</span>
              {selected?.iso3 === c.iso3 && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CountrySelect;
