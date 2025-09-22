import { NextRequest, NextResponse } from 'next/server';
import { readClient } from '@/studio-m4ktaba/client';
import { emailTemplates } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    console.log('🧪 Testing email template generation for order:', orderId);

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

    // Prepare order data exactly as the email endpoint does
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

    console.log('🧪 Order data prepared:', orderData);

    // Test shipping update template generation
    const trackingNumber = order.trackingNumber || 'TEST-TRACKING-123';
    const emailTemplate = emailTemplates.shippingUpdate(orderData, trackingNumber);

    console.log('🧪 Email template generated:', {
      subject: emailTemplate.subject,
      htmlLength: emailTemplate.html.length,
      hasHtml: !!emailTemplate.html,
    });

    return NextResponse.json({
      success: true,
      orderData,
      emailTemplate: {
        subject: emailTemplate.subject,
        htmlLength: emailTemplate.html.length,
        htmlPreview: emailTemplate.html.substring(0, 500) + '...',
      },
      recipient: order.userEmail || order.user?.email,
      trackingNumber,
    });
  } catch (error) {
    console.error('❌ Test email template error:', error);
    return NextResponse.json(
      { error: 'Failed to test email template', details: error },
      { status: 500 }
    );
  }
}
