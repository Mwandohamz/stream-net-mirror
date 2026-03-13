export interface Country {
  name: string;
  iso3: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  prefix: string;
}

export const SUPPORTED_COUNTRIES: Country[] = [
  { name: "Zambia", iso3: "ZMB", flag: "🇿🇲", currency: "ZMW", currencySymbol: "ZMW", prefix: "+260" },
  { name: "Rwanda", iso3: "RWA", flag: "🇷🇼", currency: "RWF", currencySymbol: "RWF", prefix: "+250" },
  { name: "Uganda", iso3: "UGA", flag: "🇺🇬", currency: "UGX", currencySymbol: "UGX", prefix: "+256" },
  { name: "Ghana", iso3: "GHA", flag: "🇬🇭", currency: "GHS", currencySymbol: "GHS", prefix: "+233" },
  { name: "Kenya", iso3: "KEN", flag: "🇰🇪", currency: "KES", currencySymbol: "KES", prefix: "+254" },
  { name: "Tanzania", iso3: "TZA", flag: "🇹🇿", currency: "TZS", currencySymbol: "TZS", prefix: "+255" },
  { name: "Cameroon", iso3: "CMR", flag: "🇨🇲", currency: "XAF", currencySymbol: "XAF", prefix: "+237" },
  { name: "Senegal", iso3: "SEN", flag: "🇸🇳", currency: "XOF", currencySymbol: "XOF", prefix: "+221" },
  { name: "Benin", iso3: "BEN", flag: "🇧🇯", currency: "XOF", currencySymbol: "XOF", prefix: "+229" },
  { name: "Ivory Coast", iso3: "CIV", flag: "🇨🇮", currency: "XOF", currencySymbol: "XOF", prefix: "+225" },
  { name: "Malawi", iso3: "MWI", flag: "🇲🇼", currency: "MWK", currencySymbol: "MWK", prefix: "+265" },
  { name: "Nigeria", iso3: "NGA", flag: "🇳🇬", currency: "NGN", currencySymbol: "₦", prefix: "+234" },
  { name: "Mozambique", iso3: "MOZ", flag: "🇲🇿", currency: "MZN", currencySymbol: "MZN", prefix: "+258" },
];

export const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES[0]; // Zambia
