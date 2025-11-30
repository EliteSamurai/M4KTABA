'use client';

import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { prefetchCheckoutData } from '@/lib/prefetch';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

export default function CheckoutButton() {
  const { cart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [isPrefetched, setIsPrefetched] = React.useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before checking out.',
        variant: 'destructive',
      });
      return;
    }

    // Store cart in session storage as backup
    try {
      sessionStorage.setItem('checkout_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to store cart in session storage', error);
    }

    router.push(`/checkout?cart=${encodeURIComponent(JSON.stringify(cart))}`);
  };

  const isDisabled = cart.length === 0;

  return (
    <Button
      className='w-full bg-purple-600 hover:bg-purple-700 text-white'
      onClick={handleCheckout}
      disabled={isDisabled}
      onMouseEnter={async () => {
        if (isPrefetched || isDisabled) return;
        try {
          await prefetchCheckoutData(cart);
          setIsPrefetched(true);
        } catch {}
      }}
    >
      <ShoppingCart className='mr-2 h-4 w-4' />
      CHECKOUT
    </Button>
  );
}
