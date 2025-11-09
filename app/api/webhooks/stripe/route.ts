import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { reportError } from '@/lib/sentry';
import { counter } from '@/lib/metrics';

// Webhook events we handle
const HANDLED_EVENTS = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
] as const;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = (stripe as any).webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`✅ Received Stripe webhook: ${event.type}`);
  counter('webhook_stripe_received').inc();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription events if needed
        console.log(`Subscription event: ${event.type}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    counter('webhook_stripe_processed').inc();
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    reportError(error as Error, { context: 'stripe-webhook', type: event.type });
    counter('webhook_stripe_error').inc();

    // Return 200 to prevent Stripe from retrying
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 200 });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('💰 Payment succeeded:', paymentIntent.id);

  const orderId = paymentIntent.metadata.orderId;
  const buyerId = paymentIntent.metadata.buyerId;
  const buyerEmail = paymentIntent.receipt_email;

  // Update order status in database
  await updateOrderStatus(orderId, 'paid', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    paymentMethod: 'stripe',
  });

  // Send confirmation email
  await sendOrderConfirmationEmail(buyerEmail!, orderId, {
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
  });

  // Notify seller
  const sellerIds = paymentIntent.metadata.sellerIds?.split(',') || [];
  for (const sellerId of sellerIds) {
    await notifySeller(sellerId, 'new_order', { orderId });
  }

  counter('order_completed').inc();
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);

  const orderId = paymentIntent.metadata.orderId;
  const buyerEmail = paymentIntent.receipt_email;

  await updateOrderStatus(orderId, 'payment_failed', {
    paymentIntentId: paymentIntent.id,
    failureReason: paymentIntent.last_payment_error?.message,
  });

  // Notify buyer of failure
  if (buyerEmail) {
    await sendPaymentFailedEmail(buyerEmail, orderId);
  }

  counter('order_failed').inc();
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('💸 Refund processed:', charge.id);

  const paymentIntentId = charge.payment_intent as string;
  
  // Find order by payment intent ID
  const order = await findOrderByPaymentIntent(paymentIntentId);
  
  if (order) {
    await updateOrderStatus(order.id, 'refunded', {
      refundAmount: charge.amount_refunded,
      refundReason: charge.refunds?.data[0]?.reason,
    });

    // Notify buyer and seller
    await sendRefundConfirmationEmail(order.buyerEmail, order.id, {
      refundAmount: charge.amount_refunded / 100,
      currency: charge.currency,
    });
    await notifySeller(order.sellerId, 'order_refunded', { orderId: order.id });
  }

  counter('order_refunded').inc();
}

/**
 * Handle dispute
 */
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  console.log('⚠️  Dispute created:', dispute.id);

  const chargeId = dispute.charge as string;
  
  // Notify seller and admin
  await notifyAdmin('dispute_created', {
    disputeId: dispute.id,
    amount: dispute.amount,
    reason: dispute.reason,
  });

  counter('dispute_created').inc();
}

// Helper functions (to be implemented with your database)

async function updateOrderStatus(
  orderId: string,
  status: string,
  metadata: Record<string, any>
) {
  // TODO: Implement database update
  console.log(`Updating order ${orderId} to status: ${status}`, metadata);
  
  // This would typically update your Sanity database
  // const { writeClient } = await import('@/studio-m4ktaba/client');
  // await writeClient.patch(orderId).set({ status, ...metadata }).commit();
}

async function findOrderByPaymentIntent(paymentIntentId: string): Promise<{
  id: string;
  buyerEmail: string;
  sellerId: string;
} | null> {
  // TODO: Implement database query
  console.log(`Finding order by payment intent: ${paymentIntentId}`);
  return null;
}

async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  details: { amount: number; currency: string }
) {
  // TODO: Implement email sending
  console.log(`Sending confirmation email to ${email} for order ${orderId}`);
}

async function sendPaymentFailedEmail(email: string, orderId: string) {
  console.log(`Sending payment failed email to ${email} for order ${orderId}`);
}

async function sendRefundConfirmationEmail(
  email: string,
  orderId: string,
  details: { refundAmount: number; currency: string }
) {
  console.log(`Sending refund confirmation to ${email} for order ${orderId}`, details);
}

async function notifySeller(
  sellerId: string,
  event: string,
  data: Record<string, any>
) {
  console.log(`Notifying seller ${sellerId} about ${event}`, data);
}

async function notifyAdmin(event: string, data: Record<string, any>) {
  console.log(`Notifying admin about ${event}`, data);
}

