export interface ShippingZone {
  id: string;
  name: string;
  countries: string[]; // ISO 3166-1 alpha-2 country codes
  rates: {
    standard: number; // in USD
    express: number;
  };
  estimatedDays: {
    standard: { min: number; max: number };
    express: { min: number; max: number };
  };
  carrier: string;
  restrictions?: string[]; // Items that cannot be shipped to this zone
  customsRequired: boolean;
}

export const SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'zone-domestic-us',
    name: 'Domestic (United States)',
    countries: ['US'],
    rates: {
      standard: 5.99,
      express: 15.99,
    },
    estimatedDays: {
      standard: { min: 3, max: 7 },
      express: { min: 1, max: 3 },
    },
    carrier: 'USPS',
    customsRequired: false,
  },
  {
    id: 'zone-middle-east',
    name: 'Middle East',
    countries: ['AE', 'SA', 'QA', 'KW', 'OM', 'BH', 'JO', 'LB', 'EG'],
    rates: {
      standard: 12.99,
      express: 29.99,
    },
    estimatedDays: {
      standard: { min: 7, max: 14 },
      express: { min: 3, max: 7 },
    },
    carrier: 'DHL',
    customsRequired: true,
  },
  {
    id: 'zone-europe',
    name: 'Europe',
    countries: [
      'GB',
      'DE',
      'FR',
      'IT',
      'ES',
      'NL',
      'BE',
      'AT',
      'CH',
      'SE',
      'NO',
      'DK',
      'FI',
      'IE',
      'PT',
      'GR',
      'PL',
      'CZ',
      'HU',
      'RO',
    ],
    rates: {
      standard: 14.99,
      express: 34.99,
    },
    estimatedDays: {
      standard: { min: 7, max: 14 },
      express: { min: 3, max: 7 },
    },
    carrier: 'DHL',
    customsRequired: true,
  },
  {
    id: 'zone-south-asia',
    name: 'South Asia',
    countries: ['PK', 'IN', 'BD', 'LK', 'NP', 'AF'],
    rates: {
      standard: 11.99,
      express: 27.99,
    },
    estimatedDays: {
      standard: { min: 10, max: 21 },
      express: { min: 5, max: 10 },
    },
    carrier: 'DHL',
    customsRequired: true,
  },
  {
    id: 'zone-canada',
    name: 'Canada',
    countries: ['CA'],
    rates: {
      standard: 9.99,
      express: 19.99,
    },
    estimatedDays: {
      standard: { min: 5, max: 10 },
      express: { min: 2, max: 5 },
    },
    carrier: 'USPS / Canada Post',
    customsRequired: true,
  },
  {
    id: 'zone-australia-nz',
    name: 'Australia & New Zealand',
    countries: ['AU', 'NZ'],
    rates: {
      standard: 16.99,
      express: 39.99,
    },
    estimatedDays: {
      standard: { min: 10, max: 21 },
      express: { min: 5, max: 10 },
    },
    carrier: 'DHL',
    customsRequired: true,
  },
  {
    id: 'zone-east-asia',
    name: 'East Asia',
    countries: ['JP', 'KR', 'CN', 'TW', 'HK', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID'],
    rates: {
      standard: 15.99,
      express: 37.99,
    },
    estimatedDays: {
      standard: { min: 10, max: 21 },
      express: { min: 5, max: 10 },
    },
    carrier: 'DHL',
    customsRequired: true,
  },
  {
    id: 'zone-latin-america',
    name: 'Latin America',
    countries: [
      'MX',
      'BR',
      'AR',
      'CL',
      'CO',
      'PE',
      'VE',
      'EC',
      'GT',
      'CU',
      'BO',
      'HN',
      'PY',
      'SV',
      'NI',
      'CR',
      'PA',
      'UY',
    ],
    rates: {
      standard: 14.99,
      express: 34.99,
    },
    estimatedDays: {
      standard: { min: 14, max: 28 },
      express: { min: 7, max: 14 },
    },
    carrier: 'DHL',
    customsRequired: true,
  },
  {
    id: 'zone-africa',
    name: 'Africa',
    countries: ['ZA', 'NG', 'KE', 'GH', 'TZ', 'UG', 'MA', 'DZ', 'TN', 'ET'],
    rates: {
      standard: 17.99,
      express: 42.99,
    },
    estimatedDays: {
      standard: { min: 14, max: 28 },
      express: { min: 7, max: 14 },
    },
    carrier: 'DHL',
    customsRequired: true,
  },
  {
    id: 'zone-rest-of-world',
    name: 'Rest of World',
    countries: ['*'], // Wildcard for all other countries
    rates: {
      standard: 19.99,
      express: 44.99,
    },
    estimatedDays: {
      standard: { min: 14, max: 28 },
      express: { min: 7, max: 14 },
    },
    carrier: 'DHL',
    customsRequired: true,
  },
];

/**
 * Get shipping zone for a country
 */
export function getShippingZone(countryCode: string): ShippingZone {
  const zone = SHIPPING_ZONES.find(z => z.countries.includes(countryCode));
  // Return specific zone or fallback to "Rest of World"
  return zone || SHIPPING_ZONES[SHIPPING_ZONES.length - 1];
}

/**
 * Calculate shipping cost for a country
 */
export function calculateShipping(
  countryCode: string,
  method: 'standard' | 'express' = 'standard'
): number {
  const zone = getShippingZone(countryCode);
  return zone.rates[method];
}

/**
 * Get estimated delivery days
 */
export function getEstimatedDelivery(
  countryCode: string,
  method: 'standard' | 'express' = 'standard'
): { min: number; max: number } {
  const zone = getShippingZone(countryCode);
  return zone.estimatedDays[method];
}

/**
 * Check if country is supported for shipping
 */
export function isShippingSupported(countryCode: string): boolean {
  // All countries are supported (fallback to rest-of-world)
  return true;
}

/**
 * Check if customs documentation is required
 */
export function requiresCustoms(countryCode: string): boolean {
  const zone = getShippingZone(countryCode);
  return zone.customsRequired;
}

/**
 * Get all available shipping zones
 */
export function getAllShippingZones(): ShippingZone[] {
  return SHIPPING_ZONES.filter(zone => !zone.countries.includes('*'));
}

/**
 * Format estimated delivery as string
 */
export function formatDeliveryEstimate(
  countryCode: string,
  method: 'standard' | 'express' = 'standard'
): string {
  const estimate = getEstimatedDelivery(countryCode, method);
  if (estimate.min === estimate.max) {
    return `${estimate.min} days`;
  }
  return `${estimate.min}-${estimate.max} days`;
}

