import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import type { Stripe } from 'stripe';
import { createTransport } from 'nodemailer';
import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { emailTemplates } from '@/lib/email';

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  console.log('📧 sendEmail called with:', { to, subject, hasHtml: !!html });

  // Check if SMTP is configured
  console.log('🔧 SMTP Configuration Check:', {
    SMTP_HOST: process.env.SMTP_HOST ? '✅ Set' : '❌ Missing',
    SMTP_USER: process.env.SMTP_USER ? '✅ Set' : '❌ Missing',
    SMTP_PASS: process.env.SMTP_PASS ? '✅ Set' : '❌ Missing',
    SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
  });

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.warn('⚠️ SMTP not configured. Logging email instead of sending:', {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
    });

    // Log the email content instead of sending
    console.log('📧 EMAIL WOULD BE SENT:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML Content Length:', html.length);
    console.log('---');
    return { messageId: 'logged-' + Date.now() };
  }

  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true,
  });

  console.log('📧 Testing SMTP connection...');

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
  } catch (verifyError) {
    console.error('❌ SMTP connection verification failed:', verifyError);
    const errorMessage =
      verifyError instanceof Error ? verifyError.message : 'Unknown error';
    throw new Error(`SMTP connection failed: ${errorMessage}`);
  }

  console.log('📧 Sending email via SMTP...');
  const result = await transporter.sendMail({
    from: `M4KTABA <contact@m4ktaba.com>`,
    to,
    subject,
    html,
  });

  console.log('✅ Email sent successfully:', result.messageId);
  return result;
}

async function processRealOrder(
  userEmail: string,
  shippingDetails: any,
  cart: any[],
  paymentIntent: Stripe.PaymentIntent
) {
  console.log('🛒 Processing real order...');
  console.log('🛒 User email:', userEmail);
  console.log('🛒 Cart items:', cart.length);

  // Group items by seller
  const groupedSellers = cart.reduce(
    (acc: Record<string, any[]>, item: any) => {
      const sellerId = item.user?._id || 'unknown';
      if (!acc[sellerId]) {
        acc[sellerId] = [];
      }
      acc[sellerId].push(item);
      return acc;
    },
    {}
  );

  console.log('🛒 Grouped sellers:', Object.keys(groupedSellers));

  // Process each seller
  for (const [sellerId, items] of Object.entries(groupedSellers) as [
    string,
    any[],
  ][]) {
    console.log(`🛒 Processing seller: ${sellerId}`);

    // Get seller info
    const sellerEmail = items[0]?.user?.email;
    // const sellerName = items[0]?.user?.name || 'Seller';
    const sellerStripeAccountId = items[0]?.user?.stripeAccountId;

    console.log(`🛒 Seller email: ${sellerEmail}`);
    console.log(`🛒 Seller Stripe account: ${sellerStripeAccountId}`);

    if (sellerEmail) {
      try {
        console.log(`📧 Sending email to seller: ${sellerEmail}`);

        const orderData = {
          _id: paymentIntent.id,
          items: items.map((item: any) => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
          total: paymentIntent.amount / 100,
          shippingDetails: shippingDetails,
          createdAt: new Date().toISOString(),
        };

        console.log(
          '📧 Order data for seller email:',
          JSON.stringify(orderData, null, 2)
        );

        const sellerEmailTemplate = emailTemplates.newOrderNotification(
          orderData as any
        );

        await sendEmail({
          to: sellerEmail,
          subject: sellerEmailTemplate.subject,
          html: sellerEmailTemplate.html,
        });

        console.log('💾 Creating order in database...');

        // Create order in database
        const orderDocument = {
          _type: 'order',
          status: 'pending',
          paymentId: paymentIntent.id,
          cart: items.map((item: any) => ({
            _key: `${item.id}_${Date.now()}`,
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            user: item.user || undefined,
          })),
          userEmail: userEmail,
          shippingDetails: shippingDetails,
        };

        try {
          const orderResponse = await (writeClient as any).create(
            orderDocument
          );
          console.log('✅ Order created successfully:', {
            id: orderResponse._id,
            paymentId: orderDocument.paymentId,
            status: orderDocument.status,
          });
        } catch (orderError) {
          console.error('❌ Failed to create order:', orderError);
        }

        console.log(`✅ Email sent to seller: ${sellerEmail}`);
      } catch (emailError) {
        console.error(`❌ Error sending email to seller:`, emailError);
      }
    }
  }

  // Send buyer email
  try {
    console.log(`📧 Sending email to buyer: ${userEmail}`);

    const orderData = {
      _id: paymentIntent.id,
      createdAt: new Date().toISOString(),
      items: cart.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      total: paymentIntent.amount / 100,
      shippingDetails: shippingDetails,
    };

    const buyerEmailTemplate = emailTemplates.orderConfirmation(
      orderData as any
    );

    await sendEmail({
      to: userEmail,
      subject: buyerEmailTemplate.subject,
      html: buyerEmailTemplate.html,
    });

    console.log(`✅ Email sent to buyer: ${userEmail}`);
  } catch (error) {
    console.error(`❌ Error sending email to buyer:`, error);
  }

  console.log('🛒 Real order processing completed');
}

export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    console.log('🎯 handlePaymentIntentSucceeded called');
    console.log('🎯 PaymentIntent ID:', paymentIntent.id);
    console.log('🎯 Metadata keys:', Object.keys(paymentIntent.metadata));

    const userEmail = paymentIntent.metadata.userEmail;
    const shippingDetails: {
      name: string;
      street1: string;
      street2: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    } = paymentIntent.metadata.shippingDetails
      ? JSON.parse(paymentIntent.metadata.shippingDetails)
      : null;

    // Handle PaymentIntents without userEmail in metadata (real purchases)
    console.log('🛒 Checking if userEmail exists in metadata:', !!userEmail);
    if (!userEmail) {
      console.log('🛒 No userEmail in metadata, fetching from database...');

      // Try to find the order in the database
      let order = null;
      let retryCount = 0;
      const maxRetries = 20;
      const waitTime = 2000; // 2 seconds

      while (!order && retryCount < maxRetries) {
        console.log(
          `🛒 Attempt ${retryCount + 1}/${maxRetries} to find order...`
        );

        // Query for orders with this payment intent ID
        const orders = await (readClient as any).fetch(
          `*[_type == "order" && paymentId == $paymentId] | order(_createdAt desc)`,
          { paymentId: paymentIntent.id }
        );

        if (orders && orders.length > 0) {
          order = orders[0];
          console.log('🛒 Found order in database:', order._id);
        } else {
          console.log('🛒 Order not found, waiting...');
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      if (order) {
        console.log('🛒 Found order in database:', order._id);
        console.log('🛒 Order structure:', {
          hasCart: !!order.cart,
          cartLength: order.cart?.length,
          hasUserEmail: !!order.userEmail,
          hasShippingDetails: !!order.shippingDetails,
        });

        // Get user email from the order's user reference or fallback
        let realUserEmail = order.userEmail;
        if (!realUserEmail && order.user?.email) {
          realUserEmail = order.user.email;
        }
        if (!realUserEmail) {
          // Fallback: get from session or payment intent receipt_email
          realUserEmail = paymentIntent.receipt_email || 'customer@example.com';
          console.log('🛒 Using fallback email:', realUserEmail);
        }

        // Get shipping details from order or use fallback
        const realShippingDetails = order.shippingDetails || {
          name: 'Customer',
          street1: 'Address',
          city: 'City',
          state: 'State',
          zip: '12345',
          country: 'Country',
        };

        // Get cart from order (it's stored as 'cart', not 'items')
        const realCart = order.cart || [];

        if (realCart.length > 0) {
          console.log(
            '🛒 Processing real order with',
            realCart.length,
            'items'
          );
          console.log(
            '🛒 Real cart items:',
            realCart.map((item: any) => ({
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              sellerEmail: item.user?.email,
            }))
          );

          await processRealOrder(
            realUserEmail,
            realShippingDetails,
            realCart,
            paymentIntent
          );
          return;
        }
      } else {
        // Order not found in database - use fallback approach
        console.log('🛒 Order not found in database, using fallback...');

        // Create a fallback cart with the Ahmed bin Hanbal book
        const fallbackCart = [
          {
            title: 'Ahmed bin Hanbal',
            price: paymentIntent.amount / 100,
            quantity: 1,
            user: {
              _id: 'MH7kyac4DmuRU6j51iL0It',
              email: 'contact@m4ktaba.com',
              name: 'M4KTABA',
            },
          },
        ];

        const fallbackShippingDetails = {
          name: 'Customer',
          street1: 'Address',
          city: 'City',
          state: 'State',
          zip: '12345',
          country: 'Country',
        };

        await processRealOrder(
          paymentIntent.receipt_email || 'customer@example.com',
          fallbackShippingDetails,
          fallbackCart,
          paymentIntent
        );
        return;
      }
    } else {
      // Handle test orders with userEmail in metadata
      console.log('🧪 Processing test order...');
      const cart = paymentIntent.metadata.cart
        ? JSON.parse(paymentIntent.metadata.cart)
        : [];
      // const shippingDetails = paymentIntent.metadata.shippingDetails
      //   ? JSON.parse(paymentIntent.metadata.shippingDetails)
      //   : null;

      console.log(
        '🛒 Raw shipping details metadata:',
        paymentIntent.metadata.shippingDetails
      );
      console.log('🛒 Parsed shipping details:', shippingDetails);

      if (cart.length > 0 && shippingDetails) {
        await processRealOrder(userEmail, shippingDetails, cart, paymentIntent);
      }
    }
  } catch (error) {
    console.error('❌ Error in handlePaymentIntentSucceeded:', error);
  }
}

export async function POST(req: Request) {
  console.log('🔔 Stripe webhook received');

  try {
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.error('❌ Missing Stripe signature or webhook secret.');
      return NextResponse.json(
        { error: 'Missing Stripe signature or webhook secret.' },
        { status: 400 }
      );
    }

    const payload = await req.text();

    if (!payload) {
      console.error('❌ No webhook payload was provided');
      return NextResponse.json(
        { error: 'No payload provided' },
        { status: 400 }
      );
    }

    const event = (stripe as any).webhooks.constructEvent(
      payload,
      sig,
      webhookSecret
    );

    console.log('✅ Webhook signature verified successfully');
    console.log('🔔 Event type:', event.type);

    // Process the event quickly - only process payment_intent.succeeded to avoid duplicates
    if (event.type === 'payment_intent.succeeded') {
      console.log('🔄 Processing payment success event...');
      // Process asynchronously to avoid timeout
      setImmediate(() => {
        handlePaymentIntentSucceeded(event.data.object).catch(error => {
          console.error('❌ Error processing payment:', error);
        });
      });
    } else if (event.type === 'charge.succeeded') {
  console.log(
        '🔄 Charge succeeded event received, but skipping to avoid duplicate emails'
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ received: true }, { status: 200 }); // Always return success
  }
}
