import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { OrderStatus, OrderTimeline } from '@/lib/order-status';
import { verifyCsrf } from '@/lib/csrf';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  console.log('🔍 PATCH /api/orders/[orderId]/status called');
  console.log('🔍 Request headers:', Object.fromEntries(req.headers.entries()));

  const csrf = await verifyCsrf();
  if (csrf) {
    console.log('❌ CSRF verification failed:', csrf);
    return csrf;
  }

  try {
    const session = await getServerSession(authOptions);
    console.log('🔍 Session:', {
      hasSession: !!session,
      userId: session?.user?._id,
      userEmail: session?.user?.email,
    });

    if (!session?.user?._id) {
      console.log('❌ No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    const { status, trackingNumber, notes } = await req.json();

    // Validate status
    if (!Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch order to check permissions
    const order = await (readClient as any).fetch(
      `*[_type == "order" && _id == $orderId][0]{
        _id,
        cart,
        timeline
      }`,
      { orderId }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is a seller for this order
    console.log('🔍 Permission check:', {
      sessionUserId: session.user._id,
      orderCart: order.cart?.map((item: any) => ({
        itemId: item.id,
        sellerId: item.user?._id,
        sellerEmail: item.user?.email,
      })),
    });

    const isSeller = order.cart?.some(
      (item: any) =>
        item.user?._id === session.user._id ||
        item.user?.email === session.user.email
    );

    console.log('🔍 Is seller:', isSeller);

    if (!isSeller) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create timeline entry
    const timelineEntry: OrderTimeline = {
      status,
      timestamp: new Date(),
      description: getStatusDescription(status),
      trackingNumber,
      notes,
    };

    // Update order with new status and timeline
    const updateData: any = {
      status,
      timeline: [...(order.timeline || []), timelineEntry],
      _updatedAt: new Date().toISOString(),
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    // Also update individual cart item shipping status
    if (status === OrderStatus.SHIPPED) {
      updateData['cart[].shippingStatus'] = 'shipped';
    } else if (status === OrderStatus.DELIVERED) {
      updateData['cart[].shippingStatus'] = 'delivered';
    }

    await (writeClient as any).patch(orderId).set(updateData).commit();

    // Send email notification to buyer if status changed to shipped or delivered
    if (status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED) {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-call': 'true',
          },
          body: JSON.stringify({
            template:
              status === OrderStatus.SHIPPED
                ? 'shipping-update'
                : 'delivery-confirmation',
            orderId,
            trackingNumber,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      status,
      timeline: updateData.timeline,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

function getStatusDescription(status: OrderStatus): string {
  const descriptions = {
    [OrderStatus.PENDING]: 'Order is pending confirmation',
    [OrderStatus.CONFIRMED]: 'Order has been confirmed',
    [OrderStatus.PROCESSING]: 'Order is being processed',
    [OrderStatus.SHIPPED]: 'Order has been shipped',
    [OrderStatus.IN_TRANSIT]: 'Order is in transit',
    [OrderStatus.DELIVERED]: 'Order has been delivered',
    [OrderStatus.CANCELLED]: 'Order has been cancelled',
    [OrderStatus.REFUNDED]: 'Order has been refunded',
  };
  return descriptions[status] || 'Order status updated';
}
