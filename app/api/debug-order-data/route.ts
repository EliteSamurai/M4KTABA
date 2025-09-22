import { NextRequest, NextResponse } from 'next/server';
import { readClient } from '@/studio-m4ktaba/client';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    console.log('🔍 Debugging order data for:', orderId);

    // Fetch order details
    const order = await (readClient as any).fetch(
      `*[_type == "order" && _id == $orderId][0]{
        _id,
        status,
        cart,
        trackingNumber,
        userEmail,
        shippingDetails,
        _createdAt,
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

    // Prepare the order data structure that would be sent to email templates
    const orderData = {
      _id: order._id,
      createdAt: order._createdAt || new Date().toISOString(),
      items:
        order.cart?.map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })) || [],
      total:
        order.cart?.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        ) || 0,
      shippingDetails: order.shippingDetails,
    };

    return NextResponse.json({
      success: true,
      rawOrder: order,
      processedOrderData: orderData,
      emailRecipient: order.userEmail || order.user?.email,
      hasShippingDetails: !!order.shippingDetails,
      cartItemCount: order.cart?.length || 0,
    });
  } catch (error) {
    console.error('❌ Debug order data error:', error);
    return NextResponse.json(
      { error: 'Failed to debug order data', details: error },
      { status: 500 }
    );
  }
}
