"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CartSummary } from "./cart-summary";
import { CheckoutForm } from "./checkout-form";
import type { CartItem } from "@/types/shipping-types";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const shippingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  zip: z.string().min(1, "ZIP code is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

export default function CheckoutPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isShippingValid, setIsShippingValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [addressError, setAddressError] = useState("");
  const router = useRouter();

  if (!session) {
    router.push("/login");
    return null;
  }

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      name: "",
      street1: "",
      street2: "",
      city: "",
      zip: "",
      state: "",
      country: "",
    },
  });

  useEffect(() => {
    if (session?.user?.location) {
      const { location } = session.user;
      form.reset({
        name: session.user.name || "",
        street1: location.street || "",
        street2: "",
        city: location.city || "",
        zip: location.zip || "",
        state: location.state || "",
        country: location.country || "",
      });
    }
  }, [session, form]);

  useEffect(() => {
    const cartParam = searchParams.get("cart");
    if (cartParam) {
      try {
        const parsedCart = JSON.parse(decodeURIComponent(cartParam));
        setCart(parsedCart);
      } catch (error) {
        console.error("Failed to parse cart data:", error);
        setCart([]);
      }
    }
  }, [searchParams]);

  const createPaymentIntent = async (
    cart: CartItem[],
    shippingDetails: ShippingFormValues
  ) => {
    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, shippingDetails }),
      });

      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
    }
  };

  const validateAddress = async (shippingData: ShippingFormValues) => {
    try {
      const response = await fetch("/api/validate-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shippingData),
      });

      const result = await response.json();
      return result.isValid ?? false;
    } catch (error) {
      console.error("Address validation error:", error);
      return false;
    }
  };

  async function onSubmit(data: ShippingFormValues) {
    setIsValidating(true);
    setAddressError("");

    try {
      const isValidAddress = await validateAddress(data);

      if (isValidAddress) {
        setIsShippingValid(true);
        createPaymentIntent(cart, data);
      } else {
        setAddressError(
          "Invalid shipping address. Please check and try again."
        );
      }
    } catch (error) {
      setAddressError("Error validating address. Please try again.");
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <div className="container mx-auto min-h-screen py-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="mt-2 text-muted-foreground">
            Complete your purchase by providing shipping details and payment
            information.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {cart && cart.length > 0 ? (
            <CartSummary cart={cart} />
          ) : (
            <Alert>
              <AlertTitle>Your cart is empty</AlertTitle>
              <AlertDescription>
                Add some items to your cart to continue shopping.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {!isShippingValid ? (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Details</CardTitle>
                  <CardDescription>
                    Enter your shipping address for delivery.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="street1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="street2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apartment, suite, etc.</FormLabel>
                            <FormControl>
                              <Input placeholder="Apt 4B" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="New York" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="NY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="zip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="10001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="United States" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {addressError && (
                        <Alert variant="destructive">
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{addressError}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isValidating}
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Validating Address...
                          </>
                        ) : (
                          <>
                            <MapPin className="mr-2 h-4 w-4" />
                            Validate & Continue
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : clientSecret ? (
              <Card>
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                  <CardDescription>
                    Complete your purchase securely with Stripe.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      shippingDetails={form.getValues()}
                      cart={cart}
                    />
                  </Elements>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center p-6">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading payment details...</span>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
