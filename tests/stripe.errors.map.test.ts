import { mapStripeError } from '@/lib/stripeErrorMap';

describe('stripe error map', () => {
  it('maps known codes', () => {
    expect(mapStripeError('card_declined')).toMatch(/declined/);
    expect(mapStripeError('incorrect_cvc')).toMatch(/security code/);
  });
  it('falls back for unknown', () => {
    expect(mapStripeError('unknown_code', 'Try again')).toBe('Try again');
  });
});
