import { NextRequest, NextResponse } from 'next/server';
import { readClient } from '@/studio-m4ktaba/client';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    console.log('🧪 Testing shipping email for order:', orderId);

    // Fetch order details
    const order = await (readClient as any).fetch(
      `*[_type == "order" && _id == $orderId][0]{
        _id,
        status,
        cart,
        trackingNumber,
        userEmail,
        shippingDetails,
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

    console.log('🧪 Order found:', {
      id: order._id,
      userEmail: order.userEmail,
      userEmailFromUser: order.user?.email,
      hasShippingDetails: !!order.shippingDetails,
      cartItems: order.cart?.length || 0,
    });

    // Test the email endpoint directly
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('🧪 Calling email endpoint:', `${baseUrl}/api/email/send`);

    const emailResponse = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-call': 'true',
      },
      body: JSON.stringify({
        template: 'shipping-update',
        orderId,
        trackingNumber: 'TEST-TRACKING-123',
      }),
    });

    if (emailResponse.ok) {
      const emailResult = await emailResponse.json();
      console.log('✅ Test email sent successfully:', emailResult);
      return NextResponse.json({
        success: true,
        message: 'Test shipping email sent successfully',
        emailResult,
      });
    } else {
      const errorText = await emailResponse.text();
      console.error('❌ Test email failed:', {
        status: emailResponse.status,
        statusText: emailResponse.statusText,
        error: errorText,
      });
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: {
          status: emailResponse.status,
          error: errorText,
        },
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Test shipping email error:', error);
    return NextResponse.json(
      { error: 'Failed to test shipping email', details: error },
      { status: 500 }
    );
  }
}
