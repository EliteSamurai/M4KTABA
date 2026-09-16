import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';
import { getOrderAccess } from '@/lib/order-access';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Package,
  Truck,
} from 'lucide-react';

const STATUS_META: Record<
  string,
  { label: string; Icon: typeof Package; className: string }
> = {
  paid: {
    label: 'Payment Received',
    Icon: CheckCircle,
    className: 'text-blue-500',
  },
  shipped: { label: 'Shipped', Icon: Truck, className: 'text-purple-500' },
  delivered: {
    label: 'Delivered',
    Icon: CheckCircle,
    className: 'text-green-500',
  },
  // 'pending' only occurs on legacy/pre-fix orders going forward; both new
  // writers (success page + stripe webhook) persist 'paid'.
  pending: { label: 'Pending', Icon: Clock, className: 'text-yellow-500' },
  disputed: {
    label: 'Issue Reported',
    Icon: Clock,
    className: 'text-red-500',
  },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.email) {
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

  const order = (await (readClient as any).fetch(
    `*[_type == "order" && _id == $id][0]{
      _id, _createdAt, status, orderKind, paymentId, userEmail,
      shippingDetails, cart
    }`,
    { id }
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
          </CardContent>
        </Card>
      </div>
    );
  // Group items by seller so buyer and seller both see who ships what.
  const groups = new Map<string, { label: string; items: any[] }>();
  for (const item of order.cart || []) {
    const sellerKey = item.user?._id || 'unknown';
    if (!groups.has(sellerKey)) {
      groups.set(sellerKey, {
        label: item.user?.name || item.user?.email || 'Seller',
        items: [],
      });
    }
    groups.get(sellerKey)!.items.push(item);
  }
  const sellerList = [...groups.entries()];
  const grandTotal = (order.cart || []).reduce(
    (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  // Fallback renders the raw status verbatim (capitalized) so unexpected
  // values are shown truthfully instead of masquerading as another state.
  const meta =
    STATUS_META[order.status] ??
    ({
      label:
        typeof order.status === 'string'
          ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
          : 'Order Update',
      Icon: Clock,
      className: 'text-yellow-500',
    } as const);
  const StatusIcon = meta.Icon;

  return (
    <div className='container mx-auto py-8'>
      <div className='mx-auto max-w-3xl space-y-6'>
        <div className='text-center space-y-3'>
          <h1 className='text-3xl font-bold'>Order Details</h1>
          <Badge variant='outline' className='px-4 py-1'>
            {order._id}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <StatusIcon className={`h-5 w-5 ${meta.className}`} />
              {meta.label}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {sellerList.map(([sellerKey, group]) => (
              <div key={sellerKey}>
                <h3 className='mb-2 text-sm font-semibold'>{group.label}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className='text-right'>Quantity</TableHead>
                      <TableHead className='text-right'>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className='font-medium'>
                          {item.title}
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.quantity}
                        </TableCell>
                        <TableCell className='text-right'>
                          ${(item.price || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>
                        {sellerList.length > 1 ? 'Seller Total' : 'Total'}
                      </TableCell>
                      <TableCell className='text-right'>
                        $
                        {group.items
                          .reduce(
                            (sum, item) =>
                              sum + (item.price || 0) * (item.quantity || 1),
                            0
                          )
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            ))}
            {sellerList.length > 1 && (
              <div className='flex items-center justify-between border-t pt-2'>
                <p className='text-sm font-medium'>Total (all sellers)</p>
                <p className='text-lg font-semibold'>
                  ${grandTotal.toFixed(2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='h-5 w-5' />
              Shipping Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <address className='text-sm not-italic'>
              {order.shippingDetails?.name}
              <br />
              {order.shippingDetails?.street1}
              {order.shippingDetails?.street2 && (
                <>
                  <br />
                  {order.shippingDetails.street2}
                </>
              )}
              <br />
              {order.shippingDetails?.city},{' '}
              {order.shippingDetails?.state}{' '}
              {order.shippingDetails?.zip}
              <br />
              {order.shippingDetails?.country}
            </address>
          </CardContent>
        </Card>

        <div className='text-center'>
          <Button asChild variant='outline'>
            <Link href='/'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

  }
