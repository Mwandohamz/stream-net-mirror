const ZERO_DECIMAL_CURRENCIES = new Set([
  "UGX", "RWF", "TZS", "XAF", "XOF", "XPF", "MWK", "BIF", "CLP", "DJF", "GNF",
  "ISK", "JPY", "KMF", "KRW", "PYG", "VND", "VUV",
]);

export function formatCurrencyAmount(amount: number, currency: string): string {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);
  const formatted = isZeroDecimal
    ? Math.round(amount).toLocaleString("en-US")
    : amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency} ${formatted}`;
}

export function getDecimalPlaces(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
}

export function roundForCurrency(amount: number, currency: string): string {
  const decimals = getDecimalPlaces(currency);
  return decimals === 0 ? Math.round(amount).toString() : amount.toFixed(2);
}

export function isZeroDecimal(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.has(currency);
}
