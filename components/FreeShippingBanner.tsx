'use client';

// import { calculateShipping } from '@/lib/shipping';
import { ShoppingCart } from 'lucide-react';

interface FreeShippingBannerProps {
  cartTotal: number;
  itemCount: number;
  className?: string;
}

export function FreeShippingBanner({
  cartTotal,
  // itemCount,
  className = '',
}: FreeShippingBannerProps) {
  // Always show free shipping banner since shipping is always free
  if (cartTotal === 0) {
    return null; // Don't show banner for empty cart
  }

  return (
    <div
      className={`bg-green-100 border border-green-200 text-green-800 p-3 rounded-lg flex items-center gap-2 ${className}`}
    >
      <ShoppingCart className='h-5 w-5 text-green-600' />
      <span className='font-medium'>🎉 Free shipping on all orders!</span>
    </div>
  );
}
