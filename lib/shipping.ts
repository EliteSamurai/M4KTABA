export interface ShippingRule {
  minOrderValue: number;
  freeShippingThreshold: number;
  flatRate: number;
  perItemRate: number;
}

export interface ShippingCalculation {
  cost: number;
  isFree: boolean;
  threshold: number;
  remaining: number;
  progress: number;
}

export const SHIPPING_RULES: ShippingRule[] = [
  {
    minOrderValue: 0,
    freeShippingThreshold: 0, // Always free shipping
    flatRate: 0,
    perItemRate: 0,
  },
];

export function calculateShipping(
  cartTotal: number,
  itemCount: number
): ShippingCalculation {
  const rule =
    SHIPPING_RULES.find(r => cartTotal >= r.minOrderValue) || SHIPPING_RULES[0];

  if (cartTotal >= rule.freeShippingThreshold) {
    return {
      cost: 0,
      isFree: true,
      threshold: rule.freeShippingThreshold,
      remaining: 0,
      progress: 100,
    };
  }

  const cost = rule.flatRate + itemCount * rule.perItemRate;
  const remaining = rule.freeShippingThreshold - cartTotal;
  const progress = (cartTotal / rule.freeShippingThreshold) * 100;

  return {
    cost,
    isFree: false,
    threshold: rule.freeShippingThreshold,
    remaining,
    progress,
  };
}

export function getShippingRule(cartTotal: number): ShippingRule {
  return (
    SHIPPING_RULES.find(r => cartTotal >= r.minOrderValue) || SHIPPING_RULES[0]
  );
}
