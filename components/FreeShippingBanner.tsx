'use client';

import { Truck, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FreeShippingBannerProps {
  cartTotal: number;
  itemCount: number;
  shippingTier?: 'domestic' | 'regional' | 'international';
  className?: string;
}

export function FreeShippingBanner({
  cartTotal,
  shippingTier = 'domestic',
  className = '',
}: FreeShippingBannerProps) {
  if (cartTotal === 0) {
    return null; // Don't show banner for empty cart
  }

  // Free shipping thresholds by tier
  const thresholds = {
    domestic: 35,
    regional: 50,
    international: 75,
  };

  const threshold = thresholds[shippingTier];
  const hasQualified = cartTotal >= threshold;
  const amountNeeded = threshold - cartTotal;

  if (hasQualified) {
    return (
      <div
        className={`bg-green-100 border border-green-200 text-green-800 p-3 rounded-lg flex items-center justify-between gap-2 ${className}`}
      >
        <div className='flex items-center gap-2'>
          <Truck className='h-5 w-5 text-green-600' />
          <span className='font-medium'>🎉 You qualified for free shipping!</span>
        </div>
        <Badge variant='secondary' className='bg-green-200 text-green-800'>
          ${threshold}+ order
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={`bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg flex items-center justify-between gap-2 ${className}`}
    >
      <div className='flex items-center gap-2'>
        <TrendingUp className='h-5 w-5 text-blue-600' />
        <span className='font-medium'>
          Add ${amountNeeded.toFixed(2)} more for free shipping!
        </span>
      </div>
      <Badge variant='secondary' className='bg-blue-200 text-blue-800'>
        ${threshold}+ {shippingTier}
      </Badge>
    </div>
  );
}
