import { Input } from "@/components/ui/input";
import { findCountry } from "@/data/allCountries";

interface PhoneNumberFieldProps {
  countryIso?: string | null;
  /** Local digits only (without the country dialling code). */
  value: string;
  onChange: (localDigits: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
}

/** Builds a full E.164 number from a country and local digits. */
export function buildE164(countryIso: string | null | undefined, localDigits: string): string {
  const country = findCountry(countryIso);
  const prefix = country?.prefix ?? "";
  const digits = (localDigits || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!prefix || !digits) return "";
  return `${prefix}${digits}`.replace(/[^\d+]/g, "");
}

/** Splits a stored E.164 number back into local digits for a given country. */
export function splitLocalDigits(countryIso: string | null | undefined, e164: string | null | undefined): string {
  if (!e164) return "";
  const country = findCountry(countryIso);
  const prefixDigits = (country?.prefix ?? "").replace(/\D/g, "");
  const digits = e164.replace(/\D/g, "");
  if (prefixDigits && digits.startsWith(prefixDigits)) return digits.slice(prefixDigits.length);
  return digits;
}

const PhoneNumberField = ({
  countryIso,
  value,
  onChange,
  id,
  placeholder = "Phone number",
  disabled,
}: PhoneNumberFieldProps) => {
  const country = findCountry(countryIso);

  return (
    <div className="flex items-stretch rounded-md border border-border bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      <span className="flex items-center gap-1.5 px-3 text-sm text-muted-foreground bg-muted/40 border-r border-border shrink-0">
        <span aria-hidden="true">{country?.flag ?? "🌍"}</span>
        <span className="font-medium text-foreground">{country?.prefix ?? "+"}</span>
      </span>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        disabled={disabled || !country}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder={country ? placeholder : "Select a country first"}
        className="border-0 focus-visible:ring-0 rounded-none"
      />
    </div>
  );
};

export default PhoneNumberField;
