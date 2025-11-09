import Stripe from 'stripe';

// Create a build-safe Stripe client
function createStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    // Return a mock client during build time
    return {
      paymentIntents: {
        create: async () => {
          throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY');
        },
      },
      charges: {
        list: async () => {
          throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY');
        },
      },
    } as unknown as Partial<Stripe>;
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });
}

export const stripe = createStripeClient();

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser for this webhook
  },
};

/**
 * Platform fee calculation (DISABLED for no-fee marketplace)
 * This marketplace operates with 0% platform fees.
 * Sellers receive the full amount minus only payment processor fees.
 * @deprecated Platform fees are disabled
 */
export function getPlatformFeeAmount(totalCents: number): number {
  // Always return 0 - no platform fees
  return 0;
}

export type DestinationChargeParams = {
  amountCents: number;
  currency: string;
  buyerEmail: string;
  orderId: string;
  buyerId: string;
  sellerStripeAccountId?: string | null;
  sellerIds: string[];
  lineItemIds: string[];
  // Optional idempotency key passthrough
  idempotencyKey?: string;
  metadata?: Record<string, string>;
  // Payment method types (includes Apple Pay/Google Pay via 'link')
  paymentMethodTypes?: string[];
};

export async function createPaymentIntentWithDestinationCharge(
  p: DestinationChargeParams
) {
  const base: Stripe.PaymentIntentCreateParams = {
    amount: p.amountCents,
    currency: p.currency,
    // Enable automatic payment methods including Apple Pay, Google Pay, Link
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'always',
    },
    // Explicitly list payment method types if provided
    ...(p.paymentMethodTypes && { payment_method_types: p.paymentMethodTypes }),
    receipt_email: p.buyerEmail,
    transfer_group: p.orderId,
    metadata: {
      orderId: p.orderId,
      buyerId: p.buyerId,
      sellerIds: p.sellerIds.join(','),
      lineItemIds: p.lineItemIds.join(','),
      ...(p.metadata || {}),
    },
  };

  // Use destination charges only if there is a single seller with a connected account
  // NO PLATFORM FEES: Sellers receive full amount minus payment processor fees only
  if (p.sellerStripeAccountId) {
    Object.assign(base, {
      transfer_data: { destination: p.sellerStripeAccountId },
    });
    // Platform fee is 0 - no application_fee_amount set
  }

  const opts: Stripe.RequestOptions = {};
  if (p.idempotencyKey) opts.idempotencyKey = p.idempotencyKey;
  const pi = await (stripe as any).paymentIntents.create(base, opts);
  return pi;
}

export async function getTransactions(timeframe: 'week' | 'month' | 'year') {
  const now = new Date();
  const startDate = new Date();

  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  const charges = await (stripe as any).charges.list({
    created: {
      gte: Math.floor(startDate.getTime() / 1000),
    },
    limit: 100,
  });

  return charges.data;
}

export async function getRevenue(timeframe: 'week' | 'month' | 'year') {
  const transactions = await getTransactions(timeframe);
  return (
    transactions.reduce(
      (acc: number, charge: Stripe.Charge) => acc + charge.amount,
      0
    ) / 100
  );
}
