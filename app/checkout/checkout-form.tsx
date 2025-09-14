"use client";

import { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Loader2, LockOpenIcon as LockClosedIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types/shipping-types";

interface CheckoutFormProps {
  cart: CartItem[];
  shippingDetails: {
    name: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export function CheckoutForm({ cart }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Payment system is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Serialize cart into a query string
    const cartData = encodeURIComponent(JSON.stringify(cart));

    try {
      // Call (stripe as any).confirmPayment here and store the result
      const result = await (stripe as any).confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success?cart=${cartData}`,
        },
        redirect: "if_required",
      });

      // Check if the payment failed or succeeded
      if (result.error) {
        console.error("Payment Error:", result.error);
        setError(result.error.message || "An error occurred during payment");
        toast({
          title: "Payment Failed",
          description:
            result.error.message || "An error occurred during payment",
          variant: "destructive",
        });
      } else if (result.paymentIntent) {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
        window.location.href = `/success?payment_intent=${result.paymentIntent.id}&cart=${cartData}`;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error);
        setError("An unexpected error occurred. Please try again.");
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockClosedIcon className="h-4 w-4" />
            Payment Details
          </CardTitle>
          <CardDescription>
            Enter your card information to complete the purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "space-y-6 transition-opacity",
              isLoading && "opacity-50"
            )}
          >
            <PaymentElement
              className="payment-element"
              options={{
                layout: "tabs",
              }}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading || !stripe || !elements}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <LockClosedIcon className="mr-2 h-4 w-4" />
                Pay Securely
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Overlay for loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-lg bg-background p-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Processing payment...</span>
          </div>
        </div>
      )}
    </form>
  );
}

// Add custom styles for the Stripe Payment Element
const styles = `
  .payment-element {
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --radius: 0.5rem;
    --border: 1px solid hsl(var(--border));
    --ring: hsl(var(--ring));
    --ring-offset: white;
  }

  .payment-element .StripeElement {
    background: transparent;
    padding: 0.75rem;
    border: var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    transition: all 150ms ease;
  }

  .payment-element .StripeElement--focus {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .payment-element .StripeElement--invalid {
    border-color: hsl(var(--destructive));
  }
`;

// Add the styles to the document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
