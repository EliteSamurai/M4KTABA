'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'stripe' | 'paypal';

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  paypalEnabled?: boolean;
  className?: string;
}

export function PaymentMethodSelector({
  value,
  onChange,
  paypalEnabled = true,
  className,
}: PaymentMethodSelectorProps) {
  return (
    <div className={className}>
      <Label className="text-base font-semibold mb-3 block">
        Payment Method
      </Label>
      <div className="grid gap-3"
        role="radiogroup"
        aria-label="Payment method selection"
      >
        {/* Stripe Payment Option */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            value === 'stripe' && 'ring-2 ring-primary'
          )}
          onClick={() => onChange('stripe')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                name="payment-method"
                value="stripe"
                checked={value === 'stripe'}
                onChange={() => onChange('stripe')}
                className="h-4 w-4"
                id="stripe"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <Label
                    htmlFor="stripe"
                    className="text-base font-medium cursor-pointer"
                  >
                    Credit / Debit Card
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Visa, Mastercard, American Express, and more
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Secure
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* PayPal Payment Option */}
        {paypalEnabled && (
          <Card
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              value === 'paypal' && 'ring-2 ring-primary'
            )}
            onClick={() => onChange('paypal')}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="payment-method"
                  value="paypal"
                  checked={value === 'paypal'}
                  onChange={() => onChange('paypal')}
                  className="h-4 w-4"
                  id="paypal"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-[#00457C]" />
                    <Label
                      htmlFor="paypal"
                      className="text-base font-medium cursor-pointer"
                    >
                      PayPal
                    </Label>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay with PayPal balance, bank, or card
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Global
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Method Info */}
      <div className="mt-3 p-3 bg-muted/50 rounded-md">
        <p className="text-xs text-muted-foreground">
          {value === 'stripe' && (
            <>
              💳 <strong>Secure payment</strong> powered by Stripe. Your card
              information is encrypted and never stored on our servers.
            </>
          )}
          {value === 'paypal' && (
            <>
              🌍 <strong>Global coverage</strong> - PayPal supports 200+
              countries and 25+ currencies. Pay in your local currency.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

