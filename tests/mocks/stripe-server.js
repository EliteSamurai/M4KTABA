// tests/mocks/stripe-server.js (CommonJS for Jest)
let stripeImpl = {
  paymentIntents: {
    create: jest
      .fn()
      .mockResolvedValue({ id: "pi_test", client_secret: "cs_test" }),
    confirm: jest
      .fn()
      .mockResolvedValue({ id: "pi_test", status: "succeeded" }),
  },
  transfers: {
    create: jest.fn().mockResolvedValue({ id: "tr_test" }),
  },
  charges: {
    list: jest.fn().mockResolvedValue({ data: [] }),
  },
};

const config = { api: { bodyParser: false } };
const getPlatformFeeAmount = (cents) => {
  const bps = Number(process.env.PLATFORM_FEE_BPS || "0");
  const amount = Number(cents || 0);
  return Math.round((amount * bps) / 10000);
};
async function createPaymentIntentWithDestinationCharge(args = {}) {
  const s = module.exports.stripe;
  const res = await s.paymentIntents.create({
    amount: args.amountCents ?? 0,
    currency: args.currency ?? "usd",
    automatic_payment_methods: { enabled: true },
    transfer_data: args.sellerStripeAccountId
      ? { destination: args.sellerStripeAccountId }
      : undefined,
    application_fee_amount: getPlatformFeeAmount(args.amountCents ?? 0),
    transfer_group: args.orderId,
    receipt_email: args.buyerEmail,
    metadata: {
      orderId: args.orderId,
      buyerId: args.buyerId,
      sellerIds: Array.isArray(args.sellerIds)
        ? args.sellerIds.join(",")
        : undefined,
      lineItemIds: Array.isArray(args.lineItemIds)
        ? args.lineItemIds.join(",")
        : undefined,
    },
  });
  return res;
}

module.exports = {
  __esModule: true,
  get config() {
    return config;
  },
  get getPlatformFeeAmount() {
    return getPlatformFeeAmount;
  },
  get createPaymentIntentWithDestinationCharge() {
    return createPaymentIntentWithDestinationCharge;
  },
  // Provide a getter so tests can spy with access type 'get'
  get stripe() {
    return stripeImpl;
  },
};
