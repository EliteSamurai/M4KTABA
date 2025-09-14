import { NextResponse } from 'next/server';
import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { createTransport } from 'nodemailer';
import { CartItem } from '@/types/shipping-types';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const itemId = searchParams.get('itemId');
  const { trackingNumber } = await req.json();

  if (!orderId || !itemId) {
    return NextResponse.json(
      { error: 'Missing orderId or itemId' },
      { status: 400 }
    );
  }

  try {
    // Fetch the order
    const order = await (readClient as any).fetch(
      `*[_type == "order" && paymentId == $orderId][0]`,
      { orderId }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Find the cart item
    const cartItem = order.cart.find((item: CartItem) => item.id === itemId);

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found in order' },
        { status: 404 }
      );
    }

    const buyer = await (readClient as any).fetch(
      `*[_type == "user" && references(*[_type == "order" && paymentId == $orderId]._id)]{
          _id,
          email
        }`,
      { orderId }
    );

    if (!buyer[0]?.email) {
      return NextResponse.json(
        { error: 'Buyer information not found' },
        { status: 404 }
      );
    }

    // Update the shipping status of the specific cart item
    const updatedCart = order.cart.map((item: CartItem) =>
      item.id === itemId ? { ...item, shippingStatus: 'shipped' } : item
    );

    // Update the order in the database
    await (writeClient as any)
      .patch(order._id)
      .set({ cart: updatedCart })
      .commit();

    // Send email to the customer
    const transporter = createTransport({
      service: 'SMTP',
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailContent = `
        <p>Dear Customer,</p>
        <p>Your item <strong>${cartItem.title}</strong> has been shipped!</p>
        ${
          trackingNumber
            ? `<p>Tracking Number: ${trackingNumber}</p>`
            : `<p>No tracking number was provided by the seller.</p>`
        }
        <p>Thank you for shopping with us!</p>
      `;

    await transporter.sendMail({
      from: `M4KTABA <contact@m4ktaba.com>`,
      to: buyer[0].email,
      subject: 'Your Order Has Been Shipped!',
      html: emailContent,
    });

    return NextResponse.json(
      { message: 'Shipping status updated and email sent successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating shipping status:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping status' },
      { status: 500 }
    );
  }
}
