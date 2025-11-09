/**
 * VAT/Tax Calculator
 * Supports regional tax rates and rules
 */

export interface TaxRate {
  country: string;
  region?: string; // State/province
  rate: number; // Percentage (e.g., 20 for 20%)
  type: 'VAT' | 'GST' | 'Sales Tax' | 'No Tax';
  includesShipping: boolean;
  threshold?: number; // Minimum order value for tax
}

export interface TaxCalculation {
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  taxType: string;
  country: string;
  region?: string;
}

/**
 * Tax rates by country/region
 * In production, this should come from a database or API
 */
export const TAX_RATES: Record<string, TaxRate> = {
  // European Union (VAT)
  'GB': { country: 'GB', rate: 20, type: 'VAT', includesShipping: true },
  'DE': { country: 'DE', rate: 19, type: 'VAT', includesShipping: true },
  'FR': { country: 'FR', rate: 20, type: 'VAT', includesShipping: true },
  'IT': { country: 'IT', rate: 22, type: 'VAT', includesShipping: true },
  'ES': { country: 'ES', rate: 21, type: 'VAT', includesShipping: true },
  'NL': { country: 'NL', rate: 21, type: 'VAT', includesShipping: true },
  'BE': { country: 'BE', rate: 21, type: 'VAT', includesShipping: true },
  'PL': { country: 'PL', rate: 23, type: 'VAT', includesShipping: true },
  'SE': { country: 'SE', rate: 25, type: 'VAT', includesShipping: true },
  'DK': { country: 'DK', rate: 25, type: 'VAT', includesShipping: true },
  'AT': { country: 'AT', rate: 20, type: 'VAT', includesShipping: true },
  'IE': { country: 'IE', rate: 23, type: 'VAT', includesShipping: true },

  // United States (Sales Tax by state)
  'US-CA': { country: 'US', region: 'CA', rate: 7.25, type: 'Sales Tax', includesShipping: false },
  'US-NY': { country: 'US', region: 'NY', rate: 4, type: 'Sales Tax', includesShipping: false },
  'US-TX': { country: 'US', region: 'TX', rate: 6.25, type: 'Sales Tax', includesShipping: false },
  'US-FL': { country: 'US', region: 'FL', rate: 6, type: 'Sales Tax', includesShipping: false },
  'US-WA': { country: 'US', region: 'WA', rate: 6.5, type: 'Sales Tax', includesShipping: false },

  // Canada (GST/HST)
  'CA-ON': { country: 'CA', region: 'ON', rate: 13, type: 'GST', includesShipping: true }, // HST
  'CA-QC': { country: 'CA', region: 'QC', rate: 14.975, type: 'GST', includesShipping: true }, // GST+QST
  'CA-BC': { country: 'CA', region: 'BC', rate: 12, type: 'GST', includesShipping: true }, // GST+PST
  'CA-AB': { country: 'CA', region: 'AB', rate: 5, type: 'GST', includesShipping: true }, // GST only

  // Middle East
  'AE': { country: 'AE', rate: 5, type: 'VAT', includesShipping: true }, // UAE
  'SA': { country: 'SA', rate: 15, type: 'VAT', includesShipping: true }, // Saudi Arabia

  // Asia-Pacific
  'AU': { country: 'AU', rate: 10, type: 'GST', includesShipping: true },
  'NZ': { country: 'NZ', rate: 15, type: 'GST', includesShipping: true },
  'SG': { country: 'SG', rate: 8, type: 'GST', includesShipping: true },
  'JP': { country: 'JP', rate: 10, type: 'VAT', includesShipping: true },
  'IN': { country: 'IN', rate: 18, type: 'GST', includesShipping: true },

  // Turkey
  'TR': { country: 'TR', rate: 18, type: 'VAT', includesShipping: true },

  // No tax countries
  'US-DE': { country: 'US', region: 'DE', rate: 0, type: 'No Tax', includesShipping: false },
  'US-MT': { country: 'US', region: 'MT', rate: 0, type: 'No Tax', includesShipping: false },
  'US-NH': { country: 'US', region: 'NH', rate: 0, type: 'No Tax', includesShipping: false },
  'US-OR': { country: 'US', region: 'OR', rate: 0, type: 'No Tax', includesShipping: false },
};

/**
 * Calculate tax for an order
 */
export function calculateTax(
  subtotal: number,
  shipping: number,
  country: string,
  region?: string
): TaxCalculation {
  // Build tax key
  const taxKey = region ? `${country}-${region}` : country;
  
  // Get tax rate
  const taxRate = TAX_RATES[taxKey] || TAX_RATES[country];

  if (!taxRate) {
    // No tax information available
    return {
      taxableAmount: 0,
      taxRate: 0,
      taxAmount: 0,
      taxType: 'No Tax',
      country,
      region,
    };
  }

  // Calculate taxable amount
  const taxableAmount = taxRate.includesShipping
    ? subtotal + shipping
    : subtotal;

  // Check threshold if applicable
  if (taxRate.threshold && taxableAmount < taxRate.threshold) {
    return {
      taxableAmount: 0,
      taxRate: 0,
      taxAmount: 0,
      taxType: 'Below Threshold',
      country,
      region,
    };
  }

  // Calculate tax
  const taxAmount = (taxableAmount * taxRate.rate) / 100;

  return {
    taxableAmount,
    taxRate: taxRate.rate,
    taxAmount,
    taxType: taxRate.type,
    country,
    region,
  };
}

/**
 * Calculate tax for multiple sellers
 */
export interface SellerTaxBreakdown {
  sellerId: string;
  subtotal: number;
  shipping: number;
  tax: TaxCalculation;
  total: number;
}

export function calculateMultiSellerTax(
  sellers: Array<{
    sellerId: string;
    subtotal: number;
    shipping: number;
  }>,
  country: string,
  region?: string
): SellerTaxBreakdown[] {
  return sellers.map((seller) => {
    const tax = calculateTax(seller.subtotal, seller.shipping, country, region);

    return {
      sellerId: seller.sellerId,
      subtotal: seller.subtotal,
      shipping: seller.shipping,
      tax,
      total: seller.subtotal + seller.shipping + tax.taxAmount,
    };
  });
}

/**
 * Get tax rate for display
 */
export function getTaxRateDisplay(country: string, region?: string): string {
  const taxKey = region ? `${country}-${region}` : country;
  const taxRate = TAX_RATES[taxKey] || TAX_RATES[country];

  if (!taxRate || taxRate.rate === 0) {
    return 'Tax-free';
  }

  return `${taxRate.type}: ${taxRate.rate}%`;
}

/**
 * Check if country/region has tax
 */
export function hasTax(country: string, region?: string): boolean {
  const taxKey = region ? `${country}-${region}` : country;
  const taxRate = TAX_RATES[taxKey] || TAX_RATES[country];

  return taxRate ? taxRate.rate > 0 : false;
}

/**
 * Get all supported tax regions
 */
export function getSupportedTaxRegions(): Array<{
  key: string;
  country: string;
  region?: string;
  rate: number;
  type: string;
}> {
  return Object.entries(TAX_RATES).map(([key, rate]) => ({
    key,
    country: rate.country,
    region: rate.region,
    rate: rate.rate,
    type: rate.type,
  }));
}

/**
 * Validate tax ID/VAT number (basic validation)
 */
export function validateTaxId(taxId: string, country: string): boolean {
  // Remove spaces and convert to uppercase
  const cleanTaxId = taxId.replace(/\s/g, '').toUpperCase();

  // Basic validation by country
  switch (country) {
    case 'GB':
      // UK VAT: 9 or 12 digits
      return /^GB\d{9}$|^GB\d{12}$/.test(cleanTaxId);

    case 'DE':
      // German VAT: DE + 9 digits
      return /^DE\d{9}$/.test(cleanTaxId);

    case 'FR':
      // French VAT: FR + 2 chars + 9 digits
      return /^FR[A-Z0-9]{2}\d{9}$/.test(cleanTaxId);

    case 'US':
      // US EIN: 2 digits + dash + 7 digits
      return /^\d{2}-\d{7}$/.test(cleanTaxId);

    default:
      // Generic: at least 8 characters
      return cleanTaxId.length >= 8;
  }
}

/**
 * Format tax amount for display
 */
export function formatTax(tax: TaxCalculation, currency = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });

  if (tax.taxAmount === 0) {
    return 'No tax';
  }

  return `${tax.taxType} (${tax.taxRate}%): ${formatter.format(tax.taxAmount)}`;
}

/**
 * Get tax exemption rules
 */
export interface TaxExemption {
  type: 'business' | 'charity' | 'education' | 'export';
  requiresDocument: boolean;
  requiresValidation: boolean;
}

export const TAX_EXEMPTIONS: Record<string, TaxExemption[]> = {
  US: [
    { type: 'business', requiresDocument: true, requiresValidation: true },
    { type: 'charity', requiresDocument: true, requiresValidation: true },
    { type: 'export', requiresDocument: false, requiresValidation: false },
  ],
  EU: [
    { type: 'business', requiresDocument: true, requiresValidation: true },
    { type: 'export', requiresDocument: true, requiresValidation: false },
  ],
};

/**
 * Check if buyer qualifies for tax exemption
 */
export function checkTaxExemption(
  country: string,
  exemptionType: string,
  hasValidDocument: boolean
): boolean {
  const exemptions = TAX_EXEMPTIONS[country] || [];
  const exemption = exemptions.find((e) => e.type === exemptionType);

  if (!exemption) return false;
  if (exemption.requiresDocument && !hasValidDocument) return false;

  return true;
}

