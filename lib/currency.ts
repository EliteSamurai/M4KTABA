import { SUPPORTED_CURRENCIES, type CurrencyConfig } from './i18n/config';

/**
 * Convert price from USD to target currency
 * In production, this should fetch live exchange rates
 */
export async function convertPrice(
  amountUSD: number,
  targetCurrency: string
): Promise<number> {
  const config = SUPPORTED_CURRENCIES[targetCurrency];
  if (!config) return amountUSD;

  // TODO: In production, fetch live rates from an API like:
  // - https://api.exchangerate-api.com/v4/latest/USD
  // - https://openexchangerates.org/api/latest.json
  // const rates = await fetchExchangeRates();
  // return amountUSD * rates[targetCurrency];

  return amountUSD * config.rate;
}

/**
 * Convert price from USD to target currency (synchronous)
 * Uses cached exchange rates
 */
export function convertPriceSync(
  amountUSD: number,
  targetCurrency: string
): number {
  const config = SUPPORTED_CURRENCIES[targetCurrency];
  if (!config) return amountUSD;

  return amountUSD * config.rate;
}

/**
 * Format currency amount with proper locale and symbol
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string
): string {
  const config = SUPPORTED_CURRENCIES[currency];
  if (!config) {
    // Fallback formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  return new Intl.NumberFormat(locale || config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return SUPPORTED_CURRENCIES[currency]?.symbol || '$';
}

/**
 * Get currency configuration
 */
export function getCurrencyConfig(currency: string): CurrencyConfig | null {
  return SUPPORTED_CURRENCIES[currency] || null;
}

/**
 * Get all supported currency codes
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(SUPPORTED_CURRENCIES);
}

/**
 * Check if currency is supported
 */
export function isCurrencySupported(currency: string): boolean {
  return currency in SUPPORTED_CURRENCIES;
}

/**
 * Convert and format in one go
 */
export async function convertAndFormat(
  amountUSD: number,
  targetCurrency: string,
  locale?: string
): Promise<string> {
  const converted = await convertPrice(amountUSD, targetCurrency);
  return formatCurrency(converted, targetCurrency, locale);
}

/**
 * Convert and format (synchronous)
 */
export function convertAndFormatSync(
  amountUSD: number,
  targetCurrency: string,
  locale?: string
): string {
  const converted = convertPriceSync(amountUSD, targetCurrency);
  return formatCurrency(converted, targetCurrency, locale);
}

