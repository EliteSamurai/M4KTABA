import { CartItem } from '@/types/shipping-types';
import { checkoutCopy } from '@/copy/checkout';
import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CartSummaryProps {
  cart: CartItem[];
  shippingCost?: number;
  currency?: string;
}

export function CartSummary({
  cart,
  shippingCost = 0,
  currency = 'USD',
}: CartSummaryProps) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  // NO PLATFORM FEES - sellers receive full amount
  const platformFee = 0;
  const total = subtotal + shippingCost;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow relative'>
      <div className="flex items-center justify-between mb-6">
        <h2 className='text-2xl font-bold'>
          {checkoutCopy.cartSummary.yourOrder}
        </h2>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          No Platform Fees
        </Badge>
      </div>

      <div className='space-y-4'>
        {cart.map((item, index) => (
          <div key={index} className='flex gap-4'>
            <div className="flex-1">
              <h3 className='font-medium'>{item.title}</h3>
              <p className='text-sm text-gray-500'>
                {checkoutCopy.cartSummary.quantity}: {item.quantity}
              </p>
              <p className='font-medium'>{formatPrice(item.price)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section with Transparent Breakdown */}
      <div className='mt-6 pb-2 space-y-2 border-t-2'>
        <div className='pt-2 flex justify-between'>
          <span>{checkoutCopy.cartSummary.subtotal}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className='flex justify-between text-sm'>
          <div className="flex items-center gap-1">
            <span>{checkoutCopy.cartSummary.shipping}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Shipping calculated based on destination. Rates vary by country.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span>
            {shippingCost === 0
              ? checkoutCopy.cartSummary.shippingFree
              : formatPrice(shippingCost)}
          </span>
        </div>

        <div className='flex justify-between text-sm text-green-700'>
          <div className="flex items-center gap-1">
            <span>Platform Fee</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-green-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    We don't charge any platform fees! Sellers receive the full amount.
                    Only payment processor fees apply (handled by Stripe/PayPal).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="font-semibold">{formatPrice(platformFee)}</span>
        </div>

        <div className='flex justify-between font-bold text-lg pt-2 border-t'>
          <span>{checkoutCopy.cartSummary.total}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Fee Transparency Notice */}
      <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
        <p className="text-xs text-green-800">
          <strong>💚 100% goes to sellers</strong> - We operate as a no-fee marketplace.
          Sellers receive the full amount minus only payment processing fees
          (2.9% + $0.30 for cards, varies by country for PayPal).
        </p>
      </div>
    </div>
  );
}
