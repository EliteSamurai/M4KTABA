import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
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
