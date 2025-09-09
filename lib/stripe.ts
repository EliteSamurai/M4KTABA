import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser for this webhook
  },
};

export function getPlatformFeeAmount(totalCents: number): number {
  const bps = Number(process.env.PLATFORM_FEE_BPS || "0");
  if (!Number.isFinite(bps) || bps <= 0) return 0;
  return Math.floor((totalCents * bps) / 10_000);
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
};

export async function createPaymentIntentWithDestinationCharge(p: DestinationChargeParams) {
  const base: Stripe.PaymentIntentCreateParams = {
    amount: p.amountCents,
    currency: p.currency,
    automatic_payment_methods: { enabled: true },
    receipt_email: p.buyerEmail,
    transfer_group: p.orderId,
    metadata: {
      orderId: p.orderId,
      buyerId: p.buyerId,
      sellerIds: p.sellerIds.join(","),
      lineItemIds: p.lineItemIds.join(","),
      ...(p.metadata || {}),
    },
  };

  // Use destination charges only if there is a single seller with a connected account
  if (p.sellerStripeAccountId) {
    const fee = getPlatformFeeAmount(p.amountCents);
    (base as any).transfer_data = { destination: p.sellerStripeAccountId };
    if (fee > 0) (base as any).application_fee_amount = fee;
  }

  const opts: Stripe.RequestOptions = {};
  if (p.idempotencyKey) opts.idempotencyKey = p.idempotencyKey;
  const pi = await stripe.paymentIntents.create(base, opts);
  return pi;
}

export async function getTransactions(timeframe: "week" | "month" | "year") {
  const now = new Date();
  const startDate = new Date();

  switch (timeframe) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  const charges = await stripe.charges.list({
    created: {
      gte: Math.floor(startDate.getTime() / 1000),
    },
    limit: 100,
  });

  return charges.data;
}

export async function getRevenue(timeframe: "week" | "month" | "year") {
  const transactions = await getTransactions(timeframe);
  return transactions.reduce((acc, charge) => acc + charge.amount, 0) / 100;
}
