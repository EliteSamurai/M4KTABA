import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';
import { getOrderAccess } from '@/lib/order-access';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface OrderConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const session = await getServerSession(authOptions);
  const { orderId } = await params;

  if (!session?.user) {
    return (
      <div className='container mx-auto py-8'>
        <Card>
          <CardContent className='p-6 text-center'>
            <p>Please sign in to view your order details.</p>
            <Button asChild className='mt-4'>
              <Link href='/auth/signin'>Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch the order so we can show who ships it — but only to the buyer/seller
  // who owns it (same guard as /orders/[id], GET /api/orders/[orderId], and the
  // tracking route; shared via lib/order-access.ts).
  const order = (await (readClient as any).fetch(
    `*[_type == "order" && _id == $id][0]{
      _id, status, paymentId, userEmail, shippingDetails,
      "cart": cart[]{
        _key, id, title, price, quantity,
        "user": user->{ _id, name, email }
      }
    }`,
    { id: orderId }
  )) as any;

  if (!order) {
    return (
      <div className='container mx-auto py-8'>
        <Card>
          <CardContent className='p-6 text-center'>
            <h1 className='text-2xl font-bold'>Order Not Found</h1>
            <p className='mt-2 text-gray-600'>
              The order you are looking for does not exist.
            </p>
            <Button asChild className='mt-4' variant='outline'>
              <Link href='/'>Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const access = getOrderAccess(order, session.user as any);
  if (!access) {
    return (
      <div className='container mx-auto py-8'>
        <Card>
          <CardContent className='p-6 text-center'>
            <h1 className='text-2xl font-bold'>Forbidden</h1>
            <p className='mt-2 text-gray-600'>
              You do not have permission to view this order.
            </p>
            <Button asChild className='mt-4' variant='outline'>
              <Link href='/'>Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group cart items by seller for display.
  const sellerMap = new Map<string, { name: string; items: any[] }>();
  for (const item of order.cart ?? []) {
    const sid = item.user?._id || 'unknown';
    if (!sellerMap.has(sid)) {
      sellerMap.set(sid, {
        name: item.user?.name || item.user?.email?.split('@')[0] || 'Seller',
        items: [],
      });
    }
    sellerMap.get(sid)!.items.push(item);
  }
  const sellers = [...sellerMap.entries()];

  return (
    <div className='container mx-auto py-8 space-y-8'>
      {/* Header */}
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='bg-green-100 rounded-full p-4'>
            <CheckCircle className='h-12 w-12 text-green-600' />
          </div>
        </div>
        <h1 className='text-3xl font-bold text-gray-900'>Order Confirmed!</h1>
        <p className='text-lg text-gray-600'>
          Thank you for your purchase. We've sent you a confirmation email.
        </p>
        <Badge variant='outline' className='text-lg px-4 py-2'>
          Order #{orderId}
        </Badge>
      </div>

      {/* Order Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            Order Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-3'>
            <Badge variant='default'>Order Confirmed</Badge>
            <p className='text-sm text-gray-600'>
              Your order has been received and is being processed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Seller attribution — trust chain: who ships your order */}
      {sellers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='h-5 w-5' />
              {sellers.length > 1
                ? `${sellers.length} sellers ship this order`
                : 'Ships from one seller'}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {sellers.map(([sid, seller]) => (
              <div
                key={sid}
                className='flex items-center justify-between text-sm'
              >
                {sid !== 'unknown' ? (
                  <Link
                    href={`/seller/${sid}`}
                    className='text-muted-foreground hover:text-foreground hover:underline'
                  >
                    {seller.name}
                  </Link>
                ) : (
                  <span className='text-muted-foreground'>{seller.name}</span>
                )}
                <span className='text-muted-foreground'>
                  $
                  {seller.items
                    .reduce(
                      (sum: number, it: any) => sum + it.price * it.quantity,
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid md:grid-cols-2 gap-4'>
            <div className='p-4 bg-blue-50 rounded-lg'>
              <h3 className='font-semibold text-blue-900 mb-2'>
                📧 Check Your Email
              </h3>
              <p className='text-sm text-blue-700'>
                We've sent you a confirmation email with all the details about
                your order.
              </p>
            </div>
            <div className='p-4 bg-green-50 rounded-lg'>
              <h3 className='font-semibold text-green-900 mb-2'>
                📦 Track Your Order
              </h3>
              <p className='text-sm text-green-700'>
                You can track your order status and get updates on delivery
                progress.
              </p>
            </div>
            <div className='p-4 bg-purple-50 rounded-lg'>
              <h3 className='font-semibold text-purple-900 mb-2'>
                💬 Need Help?
              </h3>
              <p className='text-sm text-purple-700'>
                Contact our support team if you have any questions about your
                order.
              </p>
            </div>
            <div className='p-4 bg-orange-50 rounded-lg'>
              <h3 className='font-semibold text-orange-900 mb-2'>
                🛍️ Continue Shopping
              </h3>
              <p className='text-sm text-orange-700'>
                Discover more great books and deals in our marketplace.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row gap-4 justify-center'>
        <Button asChild variant='outline'>
          <Link href='/all'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Continue Shopping
          </Link>
        </Button>
        <Button asChild>
          <Link href='/dashboard'>View All Orders</Link>
        </Button>
      </div>
    </div>
  );
}
