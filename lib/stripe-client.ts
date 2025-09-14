import type { Stripe } from 'stripe';
import { stripe } from './stripe';
import { writeClient } from '@/studio-m4ktaba/client';
import { sendEmail, emailTemplates } from '@/lib/email';
import type { OrderItem, Order } from '@/types/order';

export type StripeEvent = Stripe.Event;
export type StripePaymentIntent = Stripe.PaymentIntent;
export type StripeTransfer = Stripe.Transfer;

export interface StripeMetadata {
  orderId: string;
  userEmail: string;
  shippingDetails: string;
  items: string;
}

export async function validateWebhookSignature(
  req: Request,
  signature: string | null
): Promise<StripeEvent> {
  if (!signature) {
    throw new Error('Missing stripe-signature header');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET');
  }

  const body = await req.text();
  return (stripe as any).webhooks.constructEvent(
    body,
    signature,
    webhookSecret
  ) as StripeEvent;
}

export async function validateEventData(event: StripeEvent) {
  if (!event.type || !event.data.object) {
    throw new Error('Invalid event data');
  }
  return event;
}

export async function handlePaymentIntentSucceeded(event: StripeEvent) {
  const paymentIntent = event.data.object as StripePaymentIntent;
  const metadata = paymentIntent.metadata as unknown as StripeMetadata;
  const { orderId, userEmail, shippingDetails, items } = metadata;

  if (!orderId || !userEmail || !shippingDetails || !items) {
    throw new Error('Missing required metadata');
  }

  // Parse the items and shipping details from JSON
  const parsedItems = JSON.parse(items) as OrderItem[];
  const parsedShippingDetails = JSON.parse(shippingDetails);

  // Update order status to paid
  await (writeClient as any).patch(orderId).set({ status: 'paid' }).commit();

  // Group items by seller
  const sellerItems = parsedItems.reduce(
    (acc: Record<string, OrderItem[]>, item) => {
      if (!acc[item.sellerId]) {
        acc[item.sellerId] = [];
      }
      acc[item.sellerId].push(item);
      return acc;
    },
    {}
  );

  // Process each seller's items
  for (const [sellerId, items] of Object.entries(sellerItems)) {
    try {
      // Get seller's Stripe account
      const seller = await (writeClient as any).getDocument(sellerId);
      if (!seller || !seller.stripeAccountId) {
        throw new Error(`Seller ${sellerId} has no Stripe account`);
      }

      // Calculate total for this seller's items
      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Create transfer to seller
      await (stripe as any).transfers.create({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        destination: seller.stripeAccountId,
        transfer_group: orderId,
      });

      // Send email to seller
      await sendEmail({
        to: seller.email,
        ...emailTemplates.newOrderNotification(
          {
            _id: orderId,
            items,
            total,
            shippingDetails: parsedShippingDetails,
            createdAt: new Date().toISOString(),
          } as Order,
          seller.name
        ),
      });
    } catch (error) {
      console.error(`Error processing seller ${sellerId}:`, error);
      // Continue with other sellers even if one fails
    }
  }

  // Send confirmation email to buyer
  await sendEmail({
    to: userEmail,
    ...emailTemplates.orderConfirmation({
      _id: orderId,
      items: parsedItems,
      total: paymentIntent.amount / 100,
      shippingDetails: parsedShippingDetails,
      createdAt: new Date().toISOString(),
    } as Order),
  });
}
