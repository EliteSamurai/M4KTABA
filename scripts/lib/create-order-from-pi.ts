/**
 * Create a Sanity order from a Stripe payment intent (if missing).
 * Used by backfill script and sync script.
 */

import type Stripe from 'stripe';

export type CreateResult =
  | { created: true; orderId: string }
  | { created: false; reason: string };

type SanityLike = { fetch: (query: string, params: Record<string, unknown>) => Promise<unknown[]>; create: (doc: unknown) => Promise<{ _id: string }> };

export async function createOrderFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  readClient: SanityLike,
  writeClient: SanityLike
): Promise<CreateResult> {
  const piId = paymentIntent.id;
  if (paymentIntent.status !== 'succeeded') {
    return { created: false, reason: `Payment intent status is ${paymentIntent.status}` };
  }

  const existing = await readClient.fetch(
    `*[_type == "order" && paymentId == $paymentId][0]`,
    { paymentId: piId }
  );
  if (existing) {
    return { created: false, reason: 'Order already exists' };
  }

  const metadata = paymentIntent.metadata;
  const userEmail =
    (metadata.userEmail as string) || (paymentIntent.receipt_email as string) || '';
  let shippingDetails: Record<string, string> = {
    name: 'N/A',
    street1: 'N/A',
    city: 'N/A',
    state: 'N/A',
    zip: 'N/A',
    country: 'N/A',
  };
  if (metadata.shippingDetails) {
    try {
      shippingDetails = { ...shippingDetails, ...JSON.parse(metadata.shippingDetails as string) };
    } catch (_) {
      // ignore
    }
  }

  let cart: Array<{ id: string; title: string; price: number; quantity: number; user?: any }> = [];
  if (metadata.cart) {
    try {
      cart = JSON.parse(metadata.cart as string);
    } catch (_) {
      // ignore
    }
  }
  if (cart.length === 0 && metadata.lineItemIds) {
    const ids = (metadata.lineItemIds as string).split(',').filter(Boolean);
    const books = await readClient.fetch(
      `*[_type == "book" && _id in $ids]{ _id, title, price, "user": user->{ _id, email, stripeAccountId } }`,
      { ids }
    );
    cart = (books || []).map((b: any) => ({
      id: b._id,
      title: b.title || 'Book',
      price: typeof b.price === 'number' ? b.price : 0,
      quantity: 1,
      user: b.user,
    }));
  }

  if (cart.length === 0) {
    return { created: false, reason: 'No cart or lineItemIds in metadata' };
  }

  const orderDocument = {
    _type: 'order',
    status: 'pending',
    paymentId: piId,
    cart: cart.map((item: any) => ({
      _key: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      id: item.id,
      title: item.title,
      quantity: item.quantity ?? 1,
      price: item.price,
      user: item.user || undefined,
    })),
    userEmail: userEmail || (paymentIntent.receipt_email as string) || 'unknown',
    shippingDetails,
  };

  const created = await writeClient.create(orderDocument);
  return { created: true, orderId: created._id };
}
