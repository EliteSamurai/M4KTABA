export const locales = ['en', 'ar', 'ur', 'tr', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  ur: 'اردو',
  tr: 'Türkçe',
  fr: 'Français',
};

export const rtlLocales: Locale[] = ['ar', 'ur'];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

// Currency configuration
export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Relative to USD
  locale: string; // For formatting
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 1.0,
    locale: 'en-US',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rate: 0.92,
    locale: 'de-DE',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rate: 0.79,
    locale: 'en-GB',
    decimals: 2,
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    rate: 3.67,
    locale: 'ar-AE',
    decimals: 2,
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    rate: 3.75,
    locale: 'ar-SA',
    decimals: 2,
  },
  TRY: {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    rate: 32.0,
    locale: 'tr-TR',
    decimals: 2,
  },
  PKR: {
    code: 'PKR',
    symbol: '₨',
    name: 'Pakistani Rupee',
    rate: 278.0,
    locale: 'ur-PK',
    decimals: 0, // Pakistani Rupee typically doesn't use decimals
  },
};

export const defaultCurrency = 'USD';

// Locale to default currency mapping
export const localeCurrencyMap: Record<Locale, string> = {
  en: 'USD',
  ar: 'AED',
  ur: 'PKR',
  tr: 'TRY',
  fr: 'EUR',
};

// Get default currency for a locale
export function getDefaultCurrency(locale: Locale): string {
  return localeCurrencyMap[locale] || defaultCurrency;
}

