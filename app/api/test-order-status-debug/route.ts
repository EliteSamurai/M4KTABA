import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { OrderStatus } from '@/lib/order-status';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 TEST ORDER STATUS DEBUG - Starting comprehensive test...');

    // Test 1: Session
    const session = await getServerSession(authOptions);
    console.log('🔍 Session:', {
      hasSession: !!session,
      userId: session?.user?._id,
      userEmail: session?.user?.email,
    });

    if (!session?.user?._id) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated session',
        step: 'session_check',
      });
    }

    // Test 2: Get order
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    console.log('🔍 Testing with order ID:', orderId);

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

    console.log('🔍 Order found:', {
      id: order._id,
      currentStatus: order.status,
      userEmail: order.userEmail,
      hasShippingDetails: !!order.shippingDetails,
      cartItems: order.cart?.length || 0,
    });

    // Test 3: Update order status (simulate the shipping process)
    const status = OrderStatus.SHIPPED;
    const trackingNumber = 'TEST-DEBUG-TRACKING-123';

    console.log('🔍 Updating order status to:', status);

    // Create timeline entry
    const timelineEntry = {
      status,
      timestamp: new Date(),
      description: 'Item marked as shipped',
      trackingNumber,
      notes: 'Debug test shipment',
    };

    // Update order
    const updateData = {
      status,
      timeline: [...(order.timeline || []), timelineEntry],
      _updatedAt: new Date().toISOString(),
      trackingNumber,
      'cart[].shippingStatus': 'shipped',
    };

    console.log('🔍 Updating order with data:', updateData);

    const updatedOrder = await (writeClient as any)
      .patch(orderId)
      .set(updateData)
      .commit();

    console.log('✅ Order updated successfully');

    // Test 4: Try to send email directly
    console.log('🔍 Attempting to send email...');

    try {
      const { emailTemplates, sendEmail } = await import('@/lib/email');

      // Prepare order data
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

      console.log('🔍 Order data prepared:', {
        id: orderData._id,
        itemCount: orderData.items.length,
        total: orderData.total,
        hasShippingDetails: !!orderData.shippingDetails,
      });

      // Generate email template
      const emailTemplate = emailTemplates.shippingUpdate(
        orderData,
        trackingNumber
      );
      console.log('🔍 Email template generated:', {
        subject: emailTemplate.subject,
        htmlLength: emailTemplate.html.length,
      });

      // Send email
      const recipientEmail = order.userEmail || order.user?.email;
      console.log('🔍 Sending email to:', recipientEmail);

      const emailResult = await sendEmail({
        to: recipientEmail || 'test@example.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      console.log('✅ Email sent successfully:', emailResult);

      return NextResponse.json({
        success: true,
        message: 'Order status updated and email sent successfully',
        orderId,
        status,
        trackingNumber,
        recipientEmail,
        emailSent: true,
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      return NextResponse.json({
        success: false,
        error: 'Email sending failed',
        orderId,
        status,
        trackingNumber,
        emailError:
          emailError instanceof Error ? emailError.message : String(emailError),
      });
    }
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return NextResponse.json(
      { error: 'Debug test failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
