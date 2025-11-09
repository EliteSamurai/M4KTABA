/**
 * Multi-Seller Cart System
 * Handles cart operations with multiple sellers
 */

import { CartItem } from '@/types/shipping-types';

export interface SellerGroup {
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  stripeAccountId?: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface MultiSellerCart {
  items: CartItem[];
  sellerGroups: SellerGroup[];
  totalItems: number;
  subtotal: number;
  totalShipping: number;
  totalTax: number;
  grandTotal: number;
}

/**
 * Group cart items by seller
 */
export function groupItemsBySeller(items: CartItem[]): SellerGroup[] {
  const sellerMap = new Map<string, CartItem[]>();

  // Group items by seller
  items.forEach((item) => {
    const sellerId = item.user?._id || 'unknown';
    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, []);
    }
    sellerMap.get(sellerId)!.push(item);
  });

  // Create seller groups with calculations
  const sellerGroups: SellerGroup[] = [];

  sellerMap.forEach((sellerItems, sellerId) => {
    const subtotal = sellerItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate shipping per seller (can be customized)
    const shipping = calculateShippingForSeller(sellerItems);

    // Calculate tax per seller
    const tax = 0; // Will be calculated based on buyer location

    sellerGroups.push({
      sellerId,
      sellerName: sellerItems[0]?.user?.name || 'Unknown Seller',
      sellerEmail: sellerItems[0]?.user?.email,
      stripeAccountId: sellerItems[0]?.user?.stripeAccountId,
      items: sellerItems,
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
    });
  });

  return sellerGroups;
}

/**
 * Calculate shipping cost for a seller's items
 */
function calculateShippingForSeller(items: CartItem[]): number {
  // Simple calculation: $5 base + $2 per additional item
  if (items.length === 0) return 0;
  
  const baseShipping = 5.0;
  const perItemShipping = 2.0;
  
  return baseShipping + (items.length - 1) * perItemShipping;
}

/**
 * Create multi-seller cart summary
 */
export function createMultiSellerCart(items: CartItem[]): MultiSellerCart {
  const sellerGroups = groupItemsBySeller(items);

  const subtotal = sellerGroups.reduce((sum, group) => sum + group.subtotal, 0);
  const totalShipping = sellerGroups.reduce((sum, group) => sum + group.shipping, 0);
  const totalTax = sellerGroups.reduce((sum, group) => sum + group.tax, 0);

  return {
    items,
    sellerGroups,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    totalShipping,
    totalTax,
    grandTotal: subtotal + totalShipping + totalTax,
  };
}

/**
 * Validate cart items across multiple sellers
 */
export async function validateMultiSellerCart(
  items: CartItem[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('Cart is empty');
    return { valid: false, errors };
  }

  // Check for items without sellers
  const itemsWithoutSellers = items.filter((item) => !item.user?._id);
  if (itemsWithoutSellers.length > 0) {
    errors.push(`${itemsWithoutSellers.length} items missing seller information`);
  }

  // Check for invalid prices
  const invalidPriceItems = items.filter((item) => item.price <= 0);
  if (invalidPriceItems.length > 0) {
    errors.push(`${invalidPriceItems.length} items have invalid prices`);
  }

  // Check for invalid quantities
  const invalidQuantityItems = items.filter((item) => item.quantity <= 0);
  if (invalidQuantityItems.length > 0) {
    errors.push(`${invalidQuantityItems.length} items have invalid quantities`);
  }

  // TODO: Check item availability in database

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate order split for multi-seller checkout
 * Returns payment amounts per seller
 */
export interface SellerPayment {
  sellerId: string;
  stripeAccountId?: string;
  amount: number;
  platformFee: number; // Always 0
  processorFee: number;
  netAmount: number;
  items: CartItem[];
}

export function calculateSellerPayments(
  multiCart: MultiSellerCart
): SellerPayment[] {
  return multiCart.sellerGroups.map((group) => {
    const amount = group.total;
    const platformFee = 0; // No platform fees
    const processorFee = amount * 0.029 + 0.3; // Stripe fees
    const netAmount = amount - processorFee;

    return {
      sellerId: group.sellerId,
      stripeAccountId: group.stripeAccountId,
      amount,
      platformFee,
      processorFee,
      netAmount,
      items: group.items,
    };
  });
}

/**
 * Get seller summary for display
 */
export function getSellerSummary(sellerGroups: SellerGroup[]): string {
  const sellerCount = sellerGroups.length;
  const sellerNames = sellerGroups.map((g) => g.sellerName).join(', ');

  if (sellerCount === 1) {
    return `Sold by ${sellerNames}`;
  }

  return `${sellerCount} sellers: ${sellerNames}`;
}

/**
 * Check if cart has multiple sellers
 */
export function hasMultipleSellers(items: CartItem[]): boolean {
  const sellerIds = new Set(items.map((item) => item.user?._id).filter(Boolean));
  return sellerIds.size > 1;
}

/**
 * Get seller count
 */
export function getSellerCount(items: CartItem[]): number {
  const sellerIds = new Set(items.map((item) => item.user?._id).filter(Boolean));
  return sellerIds.size;
}

