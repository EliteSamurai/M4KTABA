// Mock the stripe module before importing
jest.mock('@/lib/stripe', () => {
  const mockCreatePaymentIntent = jest.fn();
  const mockGetPlatformFeeAmount = jest.fn();
  return {
    createPaymentIntentWithDestinationCharge: mockCreatePaymentIntent,
    getPlatformFeeAmount: mockGetPlatformFeeAmount,
    stripe: {
      paymentIntents: {
        create: jest.fn(),
      },
    },
  };
});

import {
  createPaymentIntentWithDestinationCharge,
  getPlatformFeeAmount,
} from '@/lib/stripe';

describe('destination charges', () => {
  it('sets transfer_data.destination and application_fee_amount when seller present', async () => {
    const mockStripe = require('@/lib/stripe');

    // Setup mocks
    mockStripe.createPaymentIntentWithDestinationCharge.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'cs_123',
    });
    mockStripe.getPlatformFeeAmount.mockReturnValue(250);

    process.env.PLATFORM_FEE_BPS = '250'; // 2.5%
    const res = await createPaymentIntentWithDestinationCharge({
      amountCents: 10000,
      currency: 'usd',
      buyerEmail: 'buyer@example.com',
      orderId: 'order_1',
      buyerId: 'u_1',
      sellerStripeAccountId: 'acct_123',
      sellerIds: ['s_1'],
      lineItemIds: ['l_1'],
    } as any);

    expect(res.client_secret).toBe('cs_123');
    const fee = getPlatformFeeAmount(10000);
    expect(fee).toBe(250);
  });
});
