'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, Package, TruckIcon, CreditCard, Info } from 'lucide-react';
import {
  type MultiSellerCart,
  type SellerGroup,
  createMultiSellerCart,
  getSellerCount,
} from '@/lib/multi-seller-cart';
import { calculateTax, formatTax } from '@/lib/tax-calculator';
import { formatCurrency } from '@/lib/currency';
import type { CartItem } from '@/types/shipping-types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MultiSellerCheckoutProps {
  cart: CartItem[];
  shippingAddress: {
    country: string;
    region?: string;
  };
  currency?: string;
}

export function MultiSellerCheckout({
  cart,
  shippingAddress,
  currency = 'USD',
}: MultiSellerCheckoutProps) {
  const [multiCart, setMultiCart] = useState<MultiSellerCart | null>(null);

  useEffect(() => {
    if (cart.length > 0) {
      const cartWithTax = createMultiSellerCart(cart);

      // Calculate tax for each seller group
      cartWithTax.sellerGroups = cartWithTax.sellerGroups.map((group) => {
        const tax = calculateTax(
          group.subtotal,
          group.shipping,
          shippingAddress.country,
          shippingAddress.region
        );

        return {
          ...group,
          tax: tax.taxAmount,
          total: group.subtotal + group.shipping + tax.taxAmount,
        };
      });

      // Recalculate grand total
      cartWithTax.totalTax = cartWithTax.sellerGroups.reduce(
        (sum, group) => sum + group.tax,
        0
      );
      cartWithTax.grandTotal =
        cartWithTax.subtotal + cartWithTax.totalShipping + cartWithTax.totalTax;

      setMultiCart(cartWithTax);
    }
  }, [cart, shippingAddress]);

  if (!multiCart) {
    return <div>Loading...</div>;
  }

  const sellerCount = getSellerCount(cart);
  const isMultiSeller = sellerCount > 1;

  return (
    <div className="space-y-6">
      {/* Multi-Seller Notice */}
      {isMultiSeller && (
        <Alert>
          <Store className="h-4 w-4" />
          <AlertDescription>
            Your order contains items from <strong>{sellerCount} different sellers</strong>.
            Each seller will ship their items separately, and you'll receive {sellerCount}{' '}
            separate shipments.
          </AlertDescription>
        </Alert>
      )}

      {/* Seller Groups */}
      {multiCart.sellerGroups.map((group, index) => (
        <Card key={group.sellerId} className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                <div>
                  <CardTitle className="text-lg">{group.sellerName}</CardTitle>
                  <CardDescription className="text-xs">
                    {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline">Seller {index + 1}</Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Items */}
            <div className="space-y-4">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    {item.author && (
                      <p className="text-sm text-muted-foreground">by {item.author}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {formatCurrency(item.price, currency)}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Seller Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(group.subtotal, currency)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <TruckIcon className="h-3 w-3" />
                  <span>Shipping</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Each seller ships separately. Shipping calculated based on items
                          and destination.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span>{formatCurrency(group.shipping, currency)}</span>
              </div>

              {group.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span>Tax</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            {formatTax(
                              {
                                taxableAmount: group.subtotal + group.shipping,
                                taxRate: (group.tax / (group.subtotal + group.shipping)) * 100,
                                taxAmount: group.tax,
                                taxType: 'VAT',
                                country: shippingAddress.country,
                                region: shippingAddress.region,
                              },
                              currency
                            )}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span>{formatCurrency(group.tax, currency)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Seller Total</span>
                <span>{formatCurrency(group.total, currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Grand Total */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span>{formatCurrency(multiCart.subtotal, currency)}</span>
            </div>

            <div className="flex justify-between">
              <span>Total Shipping</span>
              <span>{formatCurrency(multiCart.totalShipping, currency)}</span>
            </div>

            {multiCart.totalTax > 0 && (
              <div className="flex justify-between">
                <span>Total Tax</span>
                <span>{formatCurrency(multiCart.totalTax, currency)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-green-700">
              <div className="flex items-center gap-1">
                <span>Platform Fee</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-green-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        We don't charge platform fees! 100% goes to sellers minus only
                        payment processor fees.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="font-semibold">{formatCurrency(0, currency)}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-2xl">
              <span>Grand Total</span>
              <span>{formatCurrency(multiCart.grandTotal, currency)}</span>
            </div>

            {isMultiSeller && (
              <p className="text-xs text-muted-foreground">
                Payment will be split between {sellerCount} sellers automatically.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fee Transparency */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-green-900">100% Transparent, 0% Platform Fees</p>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ No platform fees - sellers receive full amount</li>
                <li>✓ Only payment processor fees apply (~2.9% + $0.30)</li>
                <li>✓ Automatic payment splitting between sellers</li>
                <li>✓ Each seller ships and fulfills independently</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

