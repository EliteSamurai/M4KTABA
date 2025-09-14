'use client';

import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { prefetchCheckoutData } from '@/lib/prefetch';

export default function CheckoutButton() {
  const { cart } = useCart();
  const router = useRouter();
  const [isPrefetched, setIsPrefetched] = React.useState(false);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    router.push(`/checkout?cart=${encodeURIComponent(JSON.stringify(cart))}`);
  };

  return (
    <button
      className='w-full bg-purple-600 text-white p-4 rounded'
      onClick={handleCheckout}
      onMouseEnter={async () => {
        if (isPrefetched) return;
        try {
          await prefetchCheckoutData(cart);
          setIsPrefetched(true);
        } catch {}
      }}
    >
      CHECKOUT
    </button>
  );
}
