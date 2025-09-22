import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';
import {
  OrderStatus,
  OrderTrackingInfo,
} from '@/lib/order-status';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    // Fetch order from Sanity
    const order = await (readClient as any).fetch(
      `*[_type == "order" && _id == $orderId][0]{
        _id,
        status,
        paymentId,
        cart,
        trackingNumber,
        carrier,
        estimatedDelivery,
        timeline,
        _createdAt,
        _updatedAt,
        "user": user->{
          _id,
          name,
          email
        }
      }`,
      { orderId }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user has access to this order
    const isOwner = order.user?._id === session.user._id;
    const isSeller = order.cart?.some(
      (item: any) => item.user?._id === session.user._id
    );

    if (!isOwner && !isSeller) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build tracking info
    const trackingInfo: OrderTrackingInfo = {
      orderId: order._id,
      status: order.status || OrderStatus.PENDING,
      timeline: order.timeline || [
        {
          status: OrderStatus.PENDING,
          timestamp: new Date(order._createdAt),
          description: 'Order placed',
        },
      ],
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery
        ? new Date(order.estimatedDelivery)
        : undefined,
      lastUpdated: new Date(order._updatedAt || order._createdAt),
    };

    return NextResponse.json(trackingInfo);
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking information' },
      { status: 500 }
    );
  }
}

