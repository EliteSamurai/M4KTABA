import { NextRequest, NextResponse } from 'next/server';
import { readClient } from '@/studio-m4ktaba/client';
import { emailTemplates } from '@/lib/email';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    // Check if this is an internal call
    const internalCall = req.headers.get('x-internal-call');
    if (!internalCall) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template, orderId, trackingNumber } = await req.json();

    if (!template || !orderId) {
      return NextResponse.json(
        { error: 'Missing template or orderId' },
        { status: 400 }
      );
    }

    console.log('📧 Email send endpoint called:', {
      template,
      orderId,
      trackingNumber,
    });

    // Fetch order details
    const order = await (readClient as any).fetch(
      `*[_type == "order" && _id == $orderId][0]{
        _id,
        status,
        cart,
        trackingNumber,
        estimatedDelivery,
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
      console.log('❌ Order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prepare email data
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

    console.log('📧 Order data prepared:', {
      orderId: orderData._id,
      itemCount: orderData.items.length,
      total: orderData.total,
      hasShippingDetails: !!orderData.shippingDetails,
    });

    // Get appropriate template and send email
    let emailTemplate;
    switch (template) {
      case 'order-confirmation':
        emailTemplate = emailTemplates.orderConfirmation(orderData);
        break;
      case 'new-order-notification':
        emailTemplate = emailTemplates.newOrderNotification(orderData);
        break;
      case 'shipping-update':
        emailTemplate = emailTemplates.shippingUpdate(
          orderData,
          trackingNumber || order.trackingNumber
        );
        break;
      case 'delivery-confirmation':
        emailTemplate = emailTemplates.orderConfirmation(orderData); // Use order confirmation for now
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid template' },
          { status: 400 }
        );
    }

    // Send the actual email
    const recipientEmail = order.userEmail || order.user?.email;
    console.log('📧 Sending email:', {
      to: recipientEmail,
      subject: emailTemplate.subject,
      template,
      orderId,
      trackingNumber: trackingNumber || order.trackingNumber,
    });

    await sendEmail({
      to: recipientEmail || 'test@example.com',
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      template,
      orderId,
      recipientEmail,
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error },
      { status: 500 }
    );
  }
}