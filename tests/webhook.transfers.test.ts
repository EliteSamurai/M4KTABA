/**
 * Unit tests for webhook transfer creation logic
 *
 * Strategy: mock ONLY the Stripe SDK (stripe.transfers.create) at the lowest
 * level, then import and exercise the REAL createTransfer from lib/stripe.ts.
 * This ensures a regression (e.g. dropping source_transaction) will fail a test.
 */

jest.mock('stripe', () => {
  const transfersCreate = jest.fn();
  const stripeImpl = {
    transfers: { create: transfersCreate },
    paymentIntents: { create: jest.fn() },
    charges: { list: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  };
  return { __esModule: true, default: jest.fn(() => stripeImpl) };
});

jest.mock('@/lib/stripe', () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
  return jest.requireActual('../lib/stripe');
});

jest.mock('@/lib/idempotency', () => ({
  makeKey: jest.fn(),
  begin: jest.fn(),
  commit: jest.fn(),
  fail: jest.fn(),
}));

jest.mock('@/studio-m4ktaba/client', () => ({
  writeClient: { create: jest.fn(), patch: jest.fn() },
  readClient: { fetch: jest.fn() },
}));

jest.mock('@/lib/email', () => ({
  emailTemplates: { newOrderNotification: jest.fn() },
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

import { stripe } from '@/lib/stripe';
import { begin, commit, fail, makeKey } from '@/lib/idempotency';
import { writeClient } from '@/studio-m4ktaba/client';
import { emailTemplates } from '@/lib/email';
import { processRealOrder } from '@/app/api/webhooks/stripe-webhook/route';

function makeItem(price: number, quantity: number, sellerId: string) {
  return {
    id: 'item_' + sellerId,
    title: 'Book by ' + sellerId,
    price,
    quantity,
    user: {
      _id: sellerId,
      email: sellerId + '@example.com',
      stripeAccountId: 'acct_' + sellerId,
    },
  };
}

function makePaymentIntent(overrides: any = {}): any {
  return {
    id: 'pi_test_123',
    currency: 'usd',
    amount: 5000,
    transfer_group: 'group_test',
    metadata: overrides.metadata || {},
    latest_charge: 'ch_test_123',
    receipt_email: 'buyer@example.com',
    ...overrides,
  };
}

describe('Webhook Transfer Creation', () => {
  const ct = (stripe as any).transfers.create;
  const mb = begin as any;
  const mc = commit as any;
  const mf = fail as any;
  const mk = makeKey as any;
  const wcc = writeClient.create as any;
  const wcp = writeClient.patch as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mk.mockImplementation((parts: (string | number | undefined | null)[]) =>
      parts.filter(Boolean).join(':')
    );
    mb.mockResolvedValue({ status: 'pending' });
    mc.mockResolvedValue(undefined);
    mf.mockResolvedValue(undefined);
    ct.mockResolvedValue({ id: 'tr_test' });
    wcc.mockResolvedValue({ _id: 'order_test_123', transfersCreated: false });
    wcp.mockReturnValue({
      set: jest.fn().mockReturnThis(),
      commit: jest.fn().mockResolvedValue({}),
    });
    (emailTemplates.newOrderNotification as any).mockReturnValue({
      subject: 'New Order',
      html: '<p>Order</p>',
    });
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  it('destination charge: skips transfer creation', async () => {
    const pi = makePaymentIntent({
      transfer_data: { destination: 'acct_dest_123' },
    });
    await processRealOrder(
      'buyer@example.com',
      {},
      [makeItem(10, 1, 'seller1')],
      pi
    );
    expect(ct).not.toHaveBeenCalled();
    expect(mb).not.toHaveBeenCalled();
  });

  it('platform charge: creates transfer for each seller with correct amount', async () => {
    const pi = makePaymentIntent();
    const cart = [makeItem(10, 1, 'seller1'), makeItem(20, 2, 'seller2')];
    await processRealOrder('buyer@example.com', {}, cart, pi);
    expect(ct).toHaveBeenCalledTimes(2);
    expect(ct).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        amount: 1000,
        currency: 'usd',
        destination: 'acct_seller1',
        source_transaction: 'ch_test_123',
      }),
      expect.anything()
    );
    expect(ct).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        amount: 4000,
        currency: 'usd',
        destination: 'acct_seller2',
        source_transaction: 'ch_test_123',
      }),
      expect.anything()
    );
  });

  it('idempotency: second call skips transfer creation', async () => {
    const pi = makePaymentIntent();
    const cart = [makeItem(10, 1, 'seller1')];
    mb.mockResolvedValueOnce({ status: 'pending' }).mockResolvedValueOnce({
      status: 'committed',
    });
    await processRealOrder('buyer@example.com', {}, cart, pi);
    expect(ct).toHaveBeenCalledTimes(1);
    await processRealOrder('buyer@example.com', {}, cart, pi);
    expect(ct).toHaveBeenCalledTimes(1);
  });

  it('partial failure: second seller still processed after first fails', async () => {
    const pi = makePaymentIntent();
    let n = 0;
    ct.mockImplementation(async () => {
      n++;
      if (n === 1) throw new Error('fail');
      return { id: 'tr_test' };
    });
    const cart = [makeItem(10, 1, 'seller1'), makeItem(20, 2, 'seller2')];
    await processRealOrder('buyer@example.com', {}, cart, pi);
    expect(ct).toHaveBeenCalledTimes(2);
    expect(mf).toHaveBeenCalled();
    expect(mc).toHaveBeenCalled();
  });

  it('transfer amount includes buyer-paid shipping', async () => {
    const sb = {
      sellers: [
        { sellerId: 'seller1', shipping: { buyerPays: 2.5 } },
        { sellerId: 'seller2', shipping: { buyerPays: 1.0 } },
      ],
    };
    const pi = makePaymentIntent({
      metadata: { shippingBreakdown: JSON.stringify(sb) },
    });
    const cart = [makeItem(10, 1, 'seller1'), makeItem(20, 2, 'seller2')];
    await processRealOrder('buyer@example.com', {}, cart, pi);
    expect(ct).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ amount: 1250, destination: 'acct_seller1' }),
      expect.anything()
    );
    expect(ct).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ amount: 4100, destination: 'acct_seller2' }),
      expect.anything()
    );
  });
});
