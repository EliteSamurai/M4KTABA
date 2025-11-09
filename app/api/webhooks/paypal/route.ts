import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { reportError } from '@/lib/sentry';
import { counter } from '@/lib/metrics';
import crypto from 'crypto';

// PayPal webhook events we handle
const HANDLED_EVENTS = [
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DENIED',
  'PAYMENT.CAPTURE.REFUNDED',
  'CUSTOMER.DISPUTE.CREATED',
] as const;

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  create_time: string;
  resource_type: string;
  resource: {
    id: string;
    amount?: {
      currency_code: string;
      value: string;
    };
    custom_id?: string;
    [key: string]: any;
  };
  summary: string;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  
  // PayPal webhook verification headers
  const transmissionId = headersList.get('paypal-transmission-id');
  const transmissionTime = headersList.get('paypal-transmission-time');
  const certUrl = headersList.get('paypal-cert-url');
  const authAlgo = headersList.get('paypal-auth-algo');
  const transmissionSig = headersList.get('paypal-transmission-sig');

  if (!transmissionId || !transmissionSig) {
    return NextResponse.json(
      { error: 'Missing PayPal webhook headers' },
      { status: 400 }
    );
  }

  // Verify webhook signature
  const isValid = await verifyPayPalWebhook({
    transmissionId,
    transmissionTime: transmissionTime!,
    certUrl: certUrl!,
    authAlgo: authAlgo!,
    transmissionSig,
    webhookId: process.env.PAYPAL_WEBHOOK_ID!,
    body,
  });

  if (!isValid) {
    console.error('⚠️  PayPal webhook signature verification failed');
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  let event: PayPalWebhookEvent;
  
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`✅ Received PayPal webhook: ${event.event_type}`);
  counter('webhook_paypal_received').inc();

  try {
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(event);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(event);
        break;

      case 'CUSTOMER.DISPUTE.CREATED':
        await handleDisputeCreated(event);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }

    counter('webhook_paypal_processed').inc();
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    reportError(error as Error, {
      context: 'paypal-webhook',
      type: event.event_type,
    });
    counter('webhook_paypal_error').inc();

    // Return 200 to prevent PayPal from retrying
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 200 }
    );
  }
}

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptureCompleted(event: PayPalWebhookEvent) {
  console.log('💰 PayPal payment completed:', event.resource.id);

  const orderId = event.resource.custom_id;
  const amount = parseFloat(event.resource.amount?.value || '0');
  const currency = event.resource.amount?.currency_code || 'USD';

  // Update order status
  await updateOrderStatus(orderId!, 'paid', {
    paypalCaptureId: event.resource.id,
    amount: amount * 100, // Convert to cents
    currency: currency.toLowerCase(),
    paymentMethod: 'paypal',
  });

  // Send confirmation email (would need to fetch buyer email from order)
  // await sendOrderConfirmationEmail(buyerEmail, orderId, { amount, currency });

  counter('order_completed').inc();
}

/**
 * Handle denied payment
 */
async function handlePaymentCaptureDenied(event: PayPalWebhookEvent) {
  console.log('❌ PayPal payment denied:', event.resource.id);

  const orderId = event.resource.custom_id;

  await updateOrderStatus(orderId!, 'payment_failed', {
    paypalCaptureId: event.resource.id,
    failureReason: event.summary,
  });

  counter('order_failed').inc();
}

/**
 * Handle refund
 */
async function handlePaymentCaptureRefunded(event: PayPalWebhookEvent) {
  console.log('💸 PayPal refund processed:', event.resource.id);

  const refundAmount = parseFloat(event.resource.amount?.value || '0');

  // Would need to find order by capture ID
  await notifyAdmin('paypal_refund', {
    refundId: event.resource.id,
    amount: refundAmount,
  });

  counter('order_refunded').inc();
}

/**
 * Handle dispute
 */
async function handleDisputeCreated(event: PayPalWebhookEvent) {
  console.log('⚠️  PayPal dispute created:', event.resource.id);

  await notifyAdmin('paypal_dispute_created', {
    disputeId: event.resource.id,
    summary: event.summary,
  });

  counter('dispute_created').inc();
}

/**
 * Verify PayPal webhook signature
 * https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
 */
async function verifyPayPalWebhook(params: {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookId: string;
  body: string;
}): Promise<boolean> {
  // In production, you should verify the webhook signature
  // For now, we'll implement a basic check
  
  // TODO: Implement full PayPal webhook verification
  // https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
  
  if (process.env.NODE_ENV === 'development') {
    // Skip verification in development
    return true;
  }

  try {
    const { getPayPalAccessToken } = await import('@/lib/paypal');
    const accessToken = await getPayPalAccessToken();

    const PAYPAL_API_BASE =
      process.env.NODE_ENV === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          transmission_id: params.transmissionId,
          transmission_time: params.transmissionTime,
          cert_url: params.certUrl,
          auth_algo: params.authAlgo,
          transmission_sig: params.transmissionSig,
          webhook_id: params.webhookId,
          webhook_event: JSON.parse(params.body),
        }),
      }
    );

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verifying PayPal webhook:', error);
    return false;
  }
}

// Helper functions

async function updateOrderStatus(
  orderId: string,
  status: string,
  metadata: Record<string, any>
) {
  console.log(`Updating order ${orderId} to status: ${status}`, metadata);
  // TODO: Implement database update
}

async function notifyAdmin(event: string, data: Record<string, any>) {
  console.log(`Notifying admin about ${event}`, data);
  // TODO: Implement admin notification (email, Slack, etc.)
}

