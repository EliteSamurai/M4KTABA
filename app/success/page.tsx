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

    const hasPaymentIntent = !!paymentIntentId;
    const parseCart = (raw: string | null): CartItem[] | null => {
      if (!raw || typeof raw !== 'string') return null;
      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = JSON.parse(decodeURIComponent(raw));
        }
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    };
    const cartFromUrl = cartData ? parseCart(cartData) : null;
    const cartFromStorage =
      typeof sessionStorage !== 'undefined'
        ? (() => {
            try {
              const raw = sessionStorage.getItem('checkout_cart');
              const parsed = raw ? JSON.parse(raw) : null;
              return Array.isArray(parsed) ? parsed : null;
            } catch {
              return null;
            }
          })()
        : null;
    const parsedCartData = cartFromUrl ?? cartFromStorage;

    if (session?.user && hasPaymentIntent && parsedCartData && parsedCartData.length > 0 && !orderSaved) {
      setIsLoading(true);

      try {
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

              // Extract shipping details from metadata; normalize so OrderCreateSchema passes (all required fields non-empty)
              const required = (s: unknown) =>
                typeof s === 'string' && s.trim().length > 0 ? s.trim() : 'N/A';
              let shippingDetails: {
                name: string;
                street1: string;
                street2?: string;
                city: string;
                state: string;
                zip: string;
                country: string;
              };
              try {
                const raw = data.metadata?.shippingDetails
                  ? JSON.parse(data.metadata.shippingDetails)
                  : null;
                shippingDetails = {
                  name: required(raw?.name) ?? 'N/A',
                  street1: required(raw?.street1 ?? raw?.street) ?? 'N/A',
                  street2:
                    typeof raw?.street2 === 'string' ? raw.street2 : undefined,
                  city: required(raw?.city) ?? 'N/A',
                  state: required(raw?.state) ?? 'N/A',
                  zip: required(raw?.zip) ?? 'N/A',
                  country: required(raw?.country) ?? 'N/A',
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

              const userId =
                (session.user as { _id?: string; id?: string })._id ??
                (session.user as { _id?: string; id?: string }).id;
              if (!userId) {
                setError(
                  'Session missing user ID. Please sign in again and contact support with your payment ID if needed.'
                );
                setIsLoading(false);
                return;
              }

              const safeNumber = (n: unknown, fallback: number) =>
                typeof n === 'number' && Number.isFinite(n) ? n : fallback;
              const safeString = (s: unknown, fallback: string) =>
                typeof s === 'string' && s.length > 0 ? s : fallback;

              const orderPayload = {
                cart: parsedCartData
                  .map((item: CartItem) => {
                    if (item.id === 'honey-001') {
                      return {
                        _key: `${item.id}-${Date.now()}`,
                        id: item.id,
                        title: 'Raw Sidr Honey (226g)',
                        price: safeNumber(item.price, 0),
                        quantity: Math.max(1, safeNumber(item.quantity, 1)),
                        user: {
                          _id: 'MH7kyac4DmuRU6j51iL0It',
                          email: 'contact@m4ktaba.com',
                        },
                        shippingStatus: 'pending',
                        refundDetails: { refundStatus: 'not_requested' },
                      };
                    }
                    return {
                      _key: `${item.id}-${Date.now()}`,
                      id: safeString(item.id, 'unknown'),
                      title: safeString(item.title, 'Item'),
                      price: safeNumber(item.price, 0),
                      quantity: Math.max(1, safeNumber(item.quantity, 1)),
                      user: item.user
                        ? {
                            _id: item.user._id,
                            email: item.user.email,
                            location: item.user.location,
                            stripeAccountId: item.user.stripeAccountId,
                          }
                        : undefined,
                      shippingStatus: 'pending',
                      refundDetails: { refundStatus: 'not_requested' },
                    };
                  })
                  .filter(
                    (item: { id: string; quantity: number }) =>
                      item.id !== 'unknown' && item.quantity > 0
                  ),
                status: 'pending',
                paymentId: paymentIntentId,
                userId,
                shippingDetails,
              };

              if (orderPayload.cart.length === 0) {
                setError(
                  'Order cart is empty or invalid. Payment succeeded; please contact support with your payment ID.'
                );
                setIsLoading(false);
                return;
              }

              console.log('Order payload being sent:', {
                cartLength: orderPayload.cart.length,
                status: orderPayload.status,
                userId: orderPayload.userId,
                paymentId: orderPayload.paymentId,
                shippingDetails: orderPayload.shippingDetails,
                firstCartItem: orderPayload.cart[0],
              });

              try {
                const csrfResponse = await fetch('/api/csrf-token', {
                  credentials: 'include',
                });
                const csrfJson = await csrfResponse.json();
                const csrfToken =
                  csrfJson?.token ?? csrfJson?.csrfToken ?? csrfJson?.value ?? '';

                const saveOrderRes = await fetch('/api/orders', {
                  method: 'POST',
                  credentials: 'include',
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

                  // Only clear cart after successful order save
                  try {
                    // Clear cart on server
                    await fetch('/api/cart', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken,
                      },
                      body: JSON.stringify({ cart: JSON.stringify([]) }),
                    });

                    // Clear cart locally
                    await clearCart();

                    // Clear session storage backup
                    sessionStorage.removeItem('checkout_cart');
                  } catch (cartError) {
                    console.error('Error clearing cart:', cartError);
                    // Don't fail the whole flow if cart clear fails
                  }

                  // Redirect to order confirmation page after a short delay
                  setTimeout(() => {
                    router.push(
                      `/order-confirmation/${savedOrder.order?._id || paymentIntentId}`
                    );
                  }, 2000);
                } else {
                  let errorMessage =
                    'Payment succeeded but order could not be saved. Please contact support with your payment ID.';
                  try {
                    const contentType = saveOrderRes.headers.get('content-type');
                    if (contentType?.includes('application/json')) {
                      const errorData = await saveOrderRes.json();
                      const msg = errorData?.message;
                      if (typeof msg === 'string' && msg.length > 0) {
                        errorMessage = msg;
                      }
                      if (errorData?.errors?.length) {
                        console.error('Order validation errors:', errorData.errors);
                      }
                    }
                  } catch (_) {
                    errorMessage = `Order save failed (${saveOrderRes.status}). ${errorMessage}`;
                  }
                  console.error('Order saving failed:', saveOrderRes.status, errorMessage);
                  setError(errorMessage);
                  setOrderSaved(false);
                }
              } catch (orderError) {
                console.error('Error saving order:', orderError);
                const errMsg =
                  orderError instanceof Error
                    ? orderError.message
                    : 'Unknown error';
                setError(
                  `Failed to save order: ${errMsg}. Payment succeeded; please contact support with payment ID: ${paymentIntentId}`
                );
                setOrderSaved(false);
              }
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
        setError('Failed to load order data.');
        console.error('Order load error:', error);
        setIsLoading(false);
      }
    } else if (orderSaved) {
      setIsLoading(false);
    } else if (hasPaymentIntent && (!parsedCartData || parsedCartData.length === 0)) {
      setError('Order cart could not be loaded. Your payment succeeded; please contact support with your payment ID if you need help.');
      setIsLoading(false);
    } else {
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
