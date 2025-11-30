/**
 * Multi-Country Shipping Calculator for M4KTABA
 * 
 * Calculates shipping costs based on seller and buyer countries,
 * with fair distribution between buyer, seller, and platform.
 * 
 * Tiers:
 * - Domestic: Same country as seller
 * - Regional: Same region (e.g., GCC, EU, North America)
 * - International: Cross-region shipping
 */

export type ShippingTier = 'domestic' | 'regional' | 'international';

export interface ShippingCalculation {
  tier: ShippingTier;
  buyerPays: number;
  sellerPays: number;
  platformSubsidy: number;
  actualCost: number;
  carrierEstimate?: number;
  estimatedDays: { min: number; max: number };
  carrier: string;
  note?: string;
}

export interface ShippingConfig {
  domestic: {
    buyerPays: number;
    sellerPays: number;
    platformSubsidy: number;
    actualCost: number;
  };
  regional: {
    buyerPays: number;
    sellerPays: number;
    platformSubsidy: number;
    actualCost: number;
  };
  international: {
    buyerPays: number;
    sellerPays: number;
    platformSubsidy: number;
    actualCost: number;
  };
}

// Regional groupings for shipping calculation
export const SHIPPING_REGIONS = {
  middleEast: ['AE', 'SA', 'QA', 'KW', 'OM', 'BH', 'JO', 'LB', 'EG', 'IQ', 'YE'],
  gcc: ['AE', 'SA', 'QA', 'KW', 'OM', 'BH'], // Gulf Cooperation Council
  northAmerica: ['US', 'CA', 'MX'],
  europe: [
    'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE',
    'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'PL', 'CZ', 'HU', 'RO',
    'BG', 'HR', 'SI', 'SK', 'EE', 'LV', 'LT', 'LU', 'MT', 'CY'
  ],
  southAsia: ['PK', 'IN', 'BD', 'LK', 'NP', 'AF', 'MV', 'BT'],
  eastAsia: ['JP', 'CN', 'KR', 'TW', 'HK', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID'],
  oceania: ['AU', 'NZ', 'FJ', 'PG'],
  africa: ['ZA', 'NG', 'KE', 'GH', 'TZ', 'UG', 'ET', 'MA', 'DZ', 'TN'],
  latinAmerica: ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY']
} as const;

// Free shipping thresholds by tier
export const FREE_SHIPPING_THRESHOLDS = {
  domestic: 35.00,
  regional: 50.00,
  international: 75.00
} as const;

// Default shipping configuration
const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  domestic: {
    buyerPays: 3.99,
    sellerPays: 0,
    platformSubsidy: 1.50,
    actualCost: 5.49
  },
  regional: {
    buyerPays: 7.99,
    sellerPays: 1.00,
    platformSubsidy: 2.00,
    actualCost: 10.99
  },
  international: {
    buyerPays: 14.99,
    sellerPays: 4.00,
    platformSubsidy: 0,
    actualCost: 18.99
  }
};

/**
 * Determine which region a country belongs to
 */
export function getRegion(countryCode: string): string | null {
  const upperCode = countryCode.toUpperCase();
  
  for (const [region, countries] of Object.entries(SHIPPING_REGIONS)) {
    if ((countries as readonly string[]).includes(upperCode)) {
      return region;
    }
  }
  
  return null;
}

/**
 * Normalize country code to 2-letter uppercase ISO format
 * Handles various input formats and returns consistent output
 */
export function normalizeCountryCode(countryInput: string | undefined | null): string {
  if (!countryInput || typeof countryInput !== 'string') {
    return 'US'; // Default fallback
  }
  
  // Trim whitespace and convert to uppercase
  let code = countryInput.trim().toUpperCase();
  
  // If it's already a 2-letter code, return it
  if (code.length === 2 && /^[A-Z]{2}$/.test(code)) {
    return code;
  }
  
  // Handle common country name mappings
  const countryNameMap: Record<string, string> = {
    'UNITED STATES': 'US',
    'USA': 'US',
    'UNITED STATES OF AMERICA': 'US',
    'AMERICA': 'US',
    'CANADA': 'CA',
    'UNITED KINGDOM': 'GB',
    'UK': 'GB',
    'GREAT BRITAIN': 'GB',
    'ENGLAND': 'GB',
    'SAUDI ARABIA': 'SA',
    'KSA': 'SA',
    'SAUDI': 'SA',
    'UNITED ARAB EMIRATES': 'AE',
    'UAE': 'AE',
    'EMIRATES': 'AE',
    'DUBAI': 'AE',
    'ABU DHABI': 'AE',
  };
  
  // Check if it's a country name
  if (countryNameMap[code]) {
    return countryNameMap[code];
  }
  
  // Default to US if we can't determine
  console.warn(`[Shipping] Could not normalize country code: "${countryInput}", defaulting to US`);
  return 'US';
}

/**
 * Check if two countries are in the same region
 */
export function isSameRegion(country1: string, country2: string): boolean {
  const region1 = getRegion(country1);
  const region2 = getRegion(country2);
  
  return region1 !== null && region1 === region2;
}

/**
 * Check if both countries are in the GCC (special fast/cheap shipping)
 */
export function isGCC(country1: string, country2: string): boolean {
  const gcc = SHIPPING_REGIONS.gcc as readonly string[];
  return gcc.includes(country1.toUpperCase()) && 
         gcc.includes(country2.toUpperCase());
}

/**
 * Get shipping tier based on seller and buyer countries
 */
export function getShippingTier(
  sellerCountry: string, 
  buyerCountry: string
): ShippingTier {
  // Normalize both country codes to ensure consistency
  const seller = normalizeCountryCode(sellerCountry);
  const buyer = normalizeCountryCode(buyerCountry);
  
  // Debug log for troubleshooting
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Shipping] Calculating tier: ${sellerCountry} (${seller}) → ${buyerCountry} (${buyer})`);
  }
  
  // Domestic: Same country
  if (seller === buyer) {
    return 'domestic';
  }
  
  // Regional: Same region
  if (isSameRegion(seller, buyer)) {
    return 'regional';
  }
  
  // International: Different regions
  return 'international';
}

/**
 * Calculate shipping cost for a single seller to buyer route
 */
export function calculateShipping(
  sellerCountry: string,
  buyerCountry: string,
  itemCount: number = 1,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): ShippingCalculation {
  const tier = getShippingTier(sellerCountry, buyerCountry);
  const tierConfig = config[tier];
  
  // Base shipping + per-item fee (for multiple books)
  const perItemFee = itemCount > 1 ? (itemCount - 1) * 1.50 : 0;
  const buyerPays = tierConfig.buyerPays + perItemFee;
  const actualCost = tierConfig.actualCost + (perItemFee * 1.5);
  
  // Special handling for GCC (fast and cheap within Gulf countries)
  if (tier === 'regional' && isGCC(sellerCountry, buyerCountry)) {
    return {
      tier: 'regional',
      buyerPays: 4.99 + perItemFee,
      sellerPays: 0,
      platformSubsidy: 2.50,
      actualCost: 7.49 + (perItemFee * 1.5),
      estimatedDays: { min: 2, max: 4 },
      carrier: 'Aramex Express',
      note: '🌟 GCC Express - Fast delivery within Gulf countries'
    };
  }
  
  // Get estimated delivery times and carrier
  const { estimatedDays, carrier } = getCarrierInfo(tier, sellerCountry, buyerCountry);
  
  return {
    tier,
    buyerPays: Math.round(buyerPays * 100) / 100,
    sellerPays: tierConfig.sellerPays,
    platformSubsidy: tierConfig.platformSubsidy,
    actualCost: Math.round(actualCost * 100) / 100,
    estimatedDays,
    carrier
  };
}

/**
 * Get carrier information and estimated delivery times
 */
function getCarrierInfo(
  tier: ShippingTier,
  sellerCountry: string,
  buyerCountry: string
): { estimatedDays: { min: number; max: number }; carrier: string } {
  const seller = sellerCountry.toUpperCase();
  const buyer = buyerCountry.toUpperCase();
  
  // US domestic - USPS Media Mail (cheapest for books)
  if (seller === 'US' && buyer === 'US') {
    return {
      estimatedDays: { min: 3, max: 7 },
      carrier: 'USPS Media Mail'
    };
  }
  
  // Middle East domestic
  if ((SHIPPING_REGIONS.middleEast as readonly string[]).includes(seller) && seller === buyer) {
    return {
      estimatedDays: { min: 2, max: 5 },
      carrier: 'Aramex / Local Post'
    };
  }
  
  // Europe domestic
  if ((SHIPPING_REGIONS.europe as readonly string[]).includes(seller) && seller === buyer) {
    return {
      estimatedDays: { min: 2, max: 5 },
      carrier: 'Royal Mail / Local Post'
    };
  }
  
  // Regional shipping
  if (tier === 'regional') {
    return {
      estimatedDays: { min: 5, max: 10 },
      carrier: 'DHL / Aramex'
    };
  }
  
  // International shipping
  return {
    estimatedDays: { min: 10, max: 21 },
    carrier: 'DHL International / FedEx'
  };
}

/**
 * Calculate if order qualifies for free shipping
 */
export function qualifiesForFreeShipping(
  cartTotal: number,
  tier: ShippingTier
): boolean {
  return cartTotal >= FREE_SHIPPING_THRESHOLDS[tier];
}

/**
 * Get remaining amount needed for free shipping
 */
export function getRemainingForFreeShipping(
  cartTotal: number,
  tier: ShippingTier
): number {
  const threshold = FREE_SHIPPING_THRESHOLDS[tier];
  const remaining = threshold - cartTotal;
  return Math.max(0, remaining);
}

/**
 * Calculate total shipping for a multi-seller cart
 * Returns per-seller breakdown and total
 */
export interface MultiSellerShipping {
  totalBuyerPays: number;
  totalSellerPays: number;
  totalPlatformSubsidy: number;
  totalActualCost: number;
  sellers: Array<{
    sellerId: string;
    sellerCountry: string;
    shipping: ShippingCalculation;
    itemCount: number;
    subtotal: number;
    qualifiesForFree: boolean;
  }>;
  multiSellerDiscount: number;
}

export function calculateMultiSellerShipping(
  sellers: Array<{
    sellerId: string;
    sellerCountry: string;
    itemCount: number;
    subtotal: number;
  }>,
  buyerCountry: string
): MultiSellerShipping {
  const sellerShipping = sellers.map((seller, index) => {
    const shipping = calculateShipping(
      seller.sellerCountry,
      buyerCountry,
      seller.itemCount
    );
    
    const qualifiesForFree = qualifiesForFreeShipping(seller.subtotal, shipping.tier);
    
    // Apply multi-seller discount (25% off for additional sellers)
    let buyerPays = shipping.buyerPays;
    if (index > 0 && sellers.length > 1) {
      buyerPays = buyerPays * 0.75; // 25% discount
    }
    
    // Free shipping if threshold met
    if (qualifiesForFree) {
      buyerPays = 0;
    }
    
    return {
      sellerId: seller.sellerId,
      sellerCountry: seller.sellerCountry,
      shipping: { ...shipping, buyerPays },
      itemCount: seller.itemCount,
      subtotal: seller.subtotal,
      qualifiesForFree
    };
  });
  
  // Calculate discount
  const originalTotal = sellerShipping.reduce((sum, s) => 
    sum + calculateShipping(s.sellerCountry, buyerCountry, s.itemCount).buyerPays, 0
  );
  const discountedTotal = sellerShipping.reduce((sum, s) => sum + s.shipping.buyerPays, 0);
  const multiSellerDiscount = originalTotal - discountedTotal;
  
  return {
    totalBuyerPays: sellerShipping.reduce((sum, s) => sum + s.shipping.buyerPays, 0),
    totalSellerPays: sellerShipping.reduce((sum, s) => sum + s.shipping.sellerPays, 0),
    totalPlatformSubsidy: sellerShipping.reduce((sum, s) => sum + s.shipping.platformSubsidy, 0),
    totalActualCost: sellerShipping.reduce((sum, s) => sum + s.shipping.actualCost, 0),
    sellers: sellerShipping,
    multiSellerDiscount: Math.round(multiSellerDiscount * 100) / 100
  };
}

/**
 * Get shipping tier badge emoji and label
 */
export function getShippingBadge(tier: ShippingTier): { emoji: string; label: string } {
  const badges = {
    domestic: { emoji: '🏠', label: 'Domestic' },
    regional: { emoji: '📦', label: 'Regional' },
    international: { emoji: '✈️', label: 'International' }
  };
  
  return badges[tier];
}

/**
 * Format shipping cost for display
 */
export function formatShippingCost(amount: number, isFree: boolean = false): string {
  if (isFree || amount === 0) {
    return 'FREE';
  }
  return `$${amount.toFixed(2)}`;
}

