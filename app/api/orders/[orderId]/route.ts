import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';
import { getOrderAccess } from '@/lib/order-access';

/**
 * GET /api/orders/:orderId — single order, owner-checked.
 * This route previously did not exist (only status/request-refund/tracking
 * sub-routes), so app/orders/[id] and OrderStatus always 404'd. Phase 4 fix.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId } = await params;

  const order = await (readClient as any).fetch(
    `*[_type == "order" && _id == $id][0]{
      _id,
      _createdAt,
      status,
      orderKind,
      paymentId,
      userEmail,
      shippingDetails,
      cart
    }`,
    { id: orderId }
  );

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const access = getOrderAccess(order, session.user as any);
  if (!access) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ ...order, ownedAs: access });
}
