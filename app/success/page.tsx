'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Receipt,
  Loader2,
  Home,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { CartItem } from '@/types/shipping-types';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';

// Loading Spinner UI
const LoadingUI = () => {
  return (
    <div className='container mx-auto flex min-h-[40vh] items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='mx-auto h-12 w-12 animate-spin text-primary' />
        <p className='mt-2 text-lg text-muted-foreground'>
          Loading your order...
        </p>
      </div>
    </div>
  );
};

const SkeletonFallback = () => {
  return (
    <div className='container mx-auto flex min-h-[40vh] items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='mx-auto h-8 w-8 animate-spin text-muted-foreground' />
        <p className='mt-2 text-sm text-muted-foreground'>
          Loading order details...
        </p>
      </div>
    </div>
  );
};

export function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentIntentId = searchParams.get('payment_intent');
  const cartData = searchParams.get('cart');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [orderSaved, setOrderSaved] = useState<boolean | null>(null); // Track if the order was saved successfully
  const { clearCart } = useCart();
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === 'loading') {
      setIsLoading(true);
      return;
    }

    if (session?.user && cartData && !orderSaved) {
      setIsLoading(true);

      try {
        const decodedCartData = decodeURIComponent(cartData);
        const parsedCartData = JSON.parse(decodedCartData);

        setCart(parsedCartData);

        const fetchPaymentIntent = async () => {
          if (!paymentIntentId) {
            setError('No payment information found');
            setIsLoading(false);
            return;
          }

          try {
            const res = await fetch(
              `/api/retrieve-payment?payment_intent=${paymentIntentId}`
            );

            if (!res.ok) {
              throw new Error(
                `Failed to fetch payment details. Status: ${res.status}`
              );
            }

            const data = await res.json();

            if (data.success) {
              setReceiptUrl(data.receiptUrl);

              // Extract shipping details from metadata
              let shippingDetails;
              try {
                shippingDetails = data.metadata?.shippingDetails
                  ? JSON.parse(data.metadata.shippingDetails)
                  : {
                      name: 'N/A',
                      street1: 'N/A',
                      city: 'N/A',
                      state: 'N/A',
                      zip: 'N/A',
                      country: 'N/A',
                    };
              } catch (parseError) {
                console.error('Failed to parse shipping details:', parseError);
                shippingDetails = {
                  name: 'N/A',
                  street1: 'N/A',
                  city: 'N/A',
                  state: 'N/A',
                  zip: 'N/A',
                  country: 'N/A',
                };
              }

              console.log('Extracted shipping details:', shippingDetails);

              const orderPayload = {
                cart: parsedCartData.map((item: CartItem) => {
                  // Special handling for honey products
                  if (item.id === 'honey-001') {
                    return {
                      _key: `${item.id}-${Date.now()}`,
                      id: item.id,
                      title: 'Raw Sidr Honey (226g)',
                      price: item.price,
                      quantity: item.quantity,
                      user: {
                        _id: 'MH7kyac4DmuRU6j51iL0It',
                        email: 'contact@m4ktaba.com',
                      },
                      shippingStatus: 'pending',
                      refundDetails: {
                        refundStatus: 'not_requested',
                      },
                    };
                  }

                  // Normal handling for other products
                  return {
                    _key: `${item.id}-${Date.now()}`,
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    user: item.user ? {
                      _id: item.user._id,
                      email: item.user.email,
                      location: item.user.location,
                      stripeAccountId: item.user.stripeAccountId,
                    } : undefined,
                    shippingStatus: 'pending',
                    refundDetails: {
                      refundStatus: 'not_requested',
                    },
                  };
                }),
                status: 'pending',
                paymentId: paymentIntentId,
                userId: session.user._id,
                shippingDetails,
              };

              console.log('Order payload being sent:', {
                cartLength: orderPayload.cart.length,
                status: orderPayload.status,
                userId: orderPayload.userId,
                paymentId: orderPayload.paymentId,
                shippingDetails: orderPayload.shippingDetails,
                firstCartItem: orderPayload.cart[0],
              });

              try {
                // Get CSRF token
                const csrfResponse = await fetch('/api/csrf-token');
                const { token: csrfToken } = await csrfResponse.json();

                const saveOrderRes = await fetch('/api/orders', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                  },
                  body: JSON.stringify(orderPayload),
                });

                if (saveOrderRes.ok) {
                  const savedOrder = await saveOrderRes.json();
                  console.log('Order saved:', savedOrder);
                  setOrderSaved(true);

                  // Redirect to order confirmation page after a short delay
                  setTimeout(() => {
                    router.push(
                      `/order-confirmation/${savedOrder.order?._id || paymentIntentId}`
                    );
                  }, 2000);
                } else {
                  const errorData = await saveOrderRes.json();
                  console.error('Order saving failed:', errorData);
                  setError(errorData.message || 'Failed to save order');
                  setOrderSaved(false);
                }
              } catch (orderError) {
                console.error('Error saving order:', orderError);
                setError('Failed to save order. Please contact support.');
                setOrderSaved(false);
              }

              // Always clear the cart after payment is successful, regardless of order saving
              try {
                // Get CSRF token for cart clearing
                const csrfResponse = await fetch('/api/csrf-token');
                const { token: csrfToken } = await csrfResponse.json();

                // Clear cart on server
                await fetch('/api/cart', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                  },
                  body: JSON.stringify({ cart: [] }),
                });
              } catch (cartError) {
                console.error('Error clearing cart on server:', cartError);
              }

              // Clear cart locally
              clearCart();
            } else {
              throw new Error(
                data.error || 'Failed to retrieve payment details'
              );
            }
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : 'An unknown error occurred'
            );
            setOrderSaved(false);
          } finally {
            setIsLoading(false);
          }
        };

        fetchPaymentIntent();
      } catch (error) {
        setError('Failed to parse cart data.');
        console.error('Parsing error:', error);
        setIsLoading(false);
      }
    } else if (orderSaved) {
      setIsLoading(false);
    }
  }, [paymentIntentId, cartData, session, sessionStatus, orderSaved]);

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  if (isLoading) {
    return <LoadingUI />; // Show loading UI while loading
  }

  return (
    <div className='container mx-auto space-y-8 py-8 md:py-12'>
      <div className='mx-auto max-w-3xl space-y-8'>
        <div className='text-center'>
          <div className='mb-4 flex justify-center'>
            <div className='rounded-full bg-green-100 p-3'>
              <CheckCircle2 className='h-8 w-8 text-green-600' />
            </div>
          </div>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            Order Confirmed!
          </h1>
          <p className='mt-4 text-muted-foreground'>
            {orderSaved
              ? 'Thank you for your purchase. Your order is on its way!'
              : 'There was an issue saving your order. Please check the details below.'}
          </p>
        </div>

        {error && (
          <Alert variant='destructive' className='mx-auto max-w-md'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            {receiptUrl && (
              <CardDescription>
                <Link
                  href={receiptUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center text-primary hover:underline'
                >
                  <Receipt className='mr-1 h-4 w-4' />
                  View Receipt
                </Link>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {cart.length > 0 ? (
              <ScrollArea className='h-full max-h-[400px]'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className='text-right'>Quantity</TableHead>
                      <TableHead className='text-right'>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className='font-medium'>
                          {item.title}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Badge variant='secondary'>{item.quantity}</Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          ${item.price.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className='text-right'>
                        ${calculateTotal().toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </ScrollArea>
            ) : (
              <Alert>
                <AlertTitle>No Items</AlertTitle>
                <AlertDescription>Your cart was empty.</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <Separator />
          <CardFooter className='justify-between p-6'>
            <p className='text-sm text-muted-foreground'>
              Need help? Contact our support team.
            </p>
            <Button asChild>
              <Link href='/'>
                <Home className='mr-2 h-4 w-4' />
                Return Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<SkeletonFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
