export interface LoyaltyTier {
  name: string;
  minSpent: number;
  pointsMultiplier: number;
  benefits: string[];
  color: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'Bronze',
    minSpent: 0,
    pointsMultiplier: 1,
    benefits: ['Basic support', 'Email updates'],
    color: 'text-amber-600 bg-amber-100',
  },
  {
    name: 'Silver',
    minSpent: 200,
    pointsMultiplier: 1.2,
    benefits: [
      'Priority support',
      'Free shipping on orders over $35',
      'Early access to sales',
    ],
    color: 'text-gray-600 bg-gray-100',
  },
  {
    name: 'Gold',
    minSpent: 500,
    pointsMultiplier: 1.5,
    benefits: [
      'VIP support',
      'Free shipping on all orders',
      'Exclusive deals',
      'Birthday rewards',
    ],
    color: 'text-yellow-600 bg-yellow-100',
  },
  {
    name: 'Platinum',
    minSpent: 1000,
    pointsMultiplier: 2,
    benefits: [
      'Concierge support',
      'Free shipping on all orders',
      'Exclusive deals',
      'Birthday rewards',
      'Personal book recommendations',
    ],
    color: 'text-purple-600 bg-purple-100',
  },
];

export function calculateLoyaltyPoints(
  orderValue: number,
  tier: LoyaltyTier
): number {
  return Math.floor(orderValue * 0.05 * tier.pointsMultiplier); // 5% base rate
}

export function getLoyaltyTier(totalSpent: number): LoyaltyTier {
  return (
    LOYALTY_TIERS.slice()
      .reverse()
      .find(tier => totalSpent >= tier.minSpent) || LOYALTY_TIERS[0]
  );
}

export function getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
  const currentIndex = LOYALTY_TIERS.findIndex(
    tier => tier.name === currentTier.name
  );
  return currentIndex < LOYALTY_TIERS.length - 1
    ? LOYALTY_TIERS[currentIndex + 1]
    : null;
}

export function getPointsToNextTier(
  currentTier: LoyaltyTier,
  totalSpent: number
): number {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return 0;
  return nextTier.minSpent - totalSpent;
}

export function formatLoyaltyPoints(points: number): string {
  return points.toLocaleString();
}

