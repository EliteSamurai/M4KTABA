import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { verifyCsrf } from '@/lib/csrf';

/**
 * POST /api/orders/[orderId]/request-refund
 * Body: { cartItemId, refundReason, refundAmount }
 *
 * Phase 5: buyer-facing refund REQUEST. This only records the request on the
 * correct field (cart[].refundDetails.refundStatus = 'requested') and
 * flags for manual review (the webhook/marketplace operator issues the actual
 * Stripe refund in the Dashboard per decision C). It never touches Stripe.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const csrf = await verifyCsrf();
  if (csrf) return csrf;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await req.json().catch(() => ({}));
    const { cartItemId, refundReason, refundAmount } = body || {};

    // Basic input validation: sale item id, a reason, and a positive amount.
    // refundReason length is bounded to avoid unbounded Sanity document writes.
    if (
      typeof cartItemId !== 'string' ||
      cartItemId.length === 0 ||
      typeof refundReason !== 'string' ||
      refundReason.trim().length === 0 ||
      refundReason.length > 500
    ) {
      return NextResponse.json({ message: 'Invalid refund data.' }, { status: 400 });
    }

    const refundAmountNum = Number(refundAmount);
    if (!Number.isFinite(refundAmountNum) || refundAmountNum <= 0) {
      return NextResponse.json({ message: 'Invalid refund amount.' }, { status: 400 });
    }

    // Fetch the order document from Sanity
    const order = await (readClient as any).fetch(
      `*[_type == "order" && _id == $orderId][0]`,
      { orderId }
    );
    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    // Only the buyer (owner) may request a refund.
    if (order.userEmail !== session.user.email) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const itemIndex = (order.cart || []).findIndex(
      (item: any) => item.id === cartItemId || item._key === cartItemId
    );
    if (itemIndex === -1) {
      return NextResponse.json(
        { message: 'Cart item not found in order.' },
        { status: 404 }
      );
    }

    // Cap the refund request at the item's actual price so a buyer can't
    // request (or later be issued) more than they paid for this item.
    const itemPrice = Number(order.cart[itemIndex].price) || 0;
    if (refundAmountNum > itemPrice) {
      return NextResponse.json(
        { message: 'Refund amount cannot exceed the item price.' },
        { status: 400 }
      );
    }

    // Write into the correct per-item refundDetails (matches the schema used
    // by the webhook/order docs; previously this wrote to a non-existent
    // `cartItems` array).
    const updatedOrder = await (writeClient as any)
      .patch(orderId)
      .set({ [`cart[${itemIndex}].refundDetails`]: {
        refundStatus: 'requested',
        refundReason,
        refundAmount: refundAmountNum,
        refundDate: new Date().toISOString(),
      }})
      .commit();

    return NextResponse.json({
      message: 'Refund request submitted successfully.',
      order: updatedOrder,
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing refund request:', error);
    return NextResponse.json(
      { message: 'Error processing refund request.' },
      { status: 500 }
    );
  }
}
