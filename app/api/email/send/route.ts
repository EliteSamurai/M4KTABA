import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';
import { emailTemplates } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    // Check if this is an internal API call (from order status update)
    const isInternalCall = req.headers.get('x-internal-call') === 'true';

    if (!isInternalCall) {
      const session = await getServerSession(authOptions);
      if (!session?.user?._id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { template, orderId, trackingNumber } = await req.json();

    if (!template || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user has access to this order (skip for internal calls)
    if (!isInternalCall) {
      const session = await getServerSession(authOptions);
      const isOwner = order.user?._id === session?.user?._id;
      const isSeller = order.cart?.some(
        (item: any) => item.user?._id === session?.user?._id
      );

      if (!isOwner && !isSeller) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
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

    // Get appropriate template and send email
    let emailTemplate;
    switch (template) {
      case 'order-confirmation':
        emailTemplate = emailTemplates.orderConfirmation(orderData);
        break;
      case 'new-order-notification':
        // For seller notifications, we need to get the seller name
        const sellerName = order.cart?.[0]?.user?.name || 'Seller';
        emailTemplate = emailTemplates.newOrderNotification(
          orderData,
          sellerName
        );
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
      orderData: {
        hasItems: orderData.items.length > 0,
        hasShippingDetails: !!orderData.shippingDetails,
        total: orderData.total,
      },
    });

    // Import and use the sendEmail function
    const { sendEmail } = await import('@/lib/email');
    await sendEmail({
      to: order.userEmail || order.user?.email || 'test@example.com',
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      template,
      orderId,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
