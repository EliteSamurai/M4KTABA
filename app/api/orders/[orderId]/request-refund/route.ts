import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { createTransport } from 'nodemailer'; // Assuming you're using Nodemailer

const transporter = createTransport({
  service: 'SMTP',
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Optional, useful for self-signed certs
  },
  debug: true,
});

export async function POST(req: Request) {
  try {
    const { orderId, cartItemId, refundReason, refundAmount } =
      await req.json();

    if (!cartItemId || !refundReason || refundAmount <= 0) {
      return new Response(JSON.stringify({ message: 'Invalid refund data.' }), {
        status: 400,
      });
    }

    // Fetch the order document from Sanity
    const order = await (readClient as any).fetch(
      `*[_type == "order" && _id == $orderId][0]`,
      { orderId: orderId }
    );

    if (!order) {
      return new Response(JSON.stringify({ message: 'Order not found.' }), {
        status: 404,
      });
    }

    // Fetch user and seller information
    const user = await (readClient as any).fetch(
      `*[_type == "user" && $orderId in orderHistory[]._ref][0]
`,
      {
        orderId: orderId,
      }
    );

    const cartItem = order.cart?.find(
      (item: { id: string }) => item.id === cartItemId
    );

    if (!cartItem) {
      console.error(
        'Cart item not found.',
        'Cart items:',
        order.cart,
        'Provided cartItemId:',
        cartItemId
      );
      throw new Error('Cart item not found.');
    }

    const sellerUserId = cartItem.user._id;

    const seller = await (readClient as any).fetch(
      `*[_type == "user" && _id == $sellerId][0]`,
      { sellerId: sellerUserId }
    );

    if (!user || !seller) {
      return new Response(
        JSON.stringify({ message: 'User or seller not found.' }),
        {
          status: 404,
        }
      );
    }

    // Update refund status
    const updatedOrder = await (writeClient as any)
      .patch(orderId)
      .setIfMissing({ cartItems: [] })
      .insert('replace', 'cartItems[_key == $cartItemId]', [
        {
          _key: cartItemId,
          refundStatus: 'requested',
          refundReason: refundReason,
          refundAmount: refundAmount,
          refundDate: new Date().toISOString(),
        },
      ])
      .commit();

    // Send emails
    const sellerEmail = seller.email; // Assuming seller document has an `email` field
    const userEmail = user.email; // Assuming user document has an `email` field

    await transporter.sendMail({
      from: `M4KTABA <contact@m4ktaba.com>`,
      to: sellerEmail,
      subject: 'Refund Requested for Your Product',
      text: `A refund has been requested for a product you sold. 

      Order ID: ${orderId}
      Refund Reason: ${refundReason}
      Refund Amount: $${refundAmount}
User Location: 
${user.location.street}, 
${user.location.city}, 
${user.location.state} ${user.location.zip}, 
${user.location.country}
      
      The item is being returned to you. Please confirm its arrival once you receive it to proceed with the refund.`,
    });

    await transporter.sendMail({
      from: `M4KTABA <contact@m4ktaba.com>`,
      to: userEmail,
      subject: 'Refund Request Update',
      text: `Your refund request has been submitted successfully. \n\nOrder ID: ${orderId}\nRefund Reason: ${refundReason}\nRefund Amount: $${refundAmount}\n\nNote: Your refund will be processed once the seller confirms receiving the returned item. Please ensure the item is sent back in its original condition.`,
    });

    return new Response(
      JSON.stringify({
        message: 'Refund request submitted successfully. Emails sent.',
        order: updatedOrder,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing refund request:', error);
    return new Response(
      JSON.stringify({
        message: 'Error processing refund request.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}
