// tests/refund-dispute.test.ts — Phase 5: refund/dispute reconciliation.
import { computeReversalAmountCents } from '@/app/api/webhooks/stripe-webhook/route';

describe('computeReversalAmountCents (shipping-excluded pro-rata)', () => {
  it('full refund reverses the entire transfer (subtotal + shipping)', () => {
    // transfer $40 (subtotal $30), charge $50 fully refunded.
    const cents = computeReversalAmountCents({
      transferAmount: 4000,
      sellerSubtotal: 3000,
      grandSubtotal: 4000,
      refundedAmount: 5000,
      chargeAmount: 5000,
    });
    expect(cents).toBe(4000); // shipping included on full refund
  });

  it('partial refund scales down item subtotal only (shipping excluded)', () => {
    // seller1 subtotal $10, seller2 subtotal $30, grand $40, refund $9 of $50.
    const s1 = computeReversalAmountCents({
      transferAmount: 1000, // seller1 transfer = $10
      sellerSubtotal: 1000,
      grandSubtotal: 4000,
      refundedAmount: 900,
      chargeAmount: 5000,
    });
    const s2 = computeReversalAmountCents({
      transferAmount: 4000, // seller2 transfer = $40 (subtotal $30 + ship $10)
      sellerSubtotal: 3000,
      grandSubtotal: 4000,
      refundedAmount: 900,
      chargeAmount: 5000,
    });
    expect(s1).toBe(225); // 900 × (10/40)
    expect(s2).toBe(675); // 900 × (30/40)
    expect(s1 + s2).toBe(900); // exactly the refunded amount, shipping untouched
  });

  it('caps partial refund at the seller subtotal (never drags shipping negative)', () => {
    // seller with subtotal $5 but transfer $20 (huge shipping) — a big refund of $19
    // should be capped at $5, not eat into shipping.
    const cents = computeReversalAmountCents({
      transferAmount: 2000,
      sellerSubtotal: 500,
      grandSubtotal: 500,
      refundedAmount: 1900,
      chargeAmount: 2000,
    });
    expect(cents).toBe(500);
  });

  it('returns 0 for a partial refund with no computable grand subtotal', () => {
    // grandSubtotal 0 → can't attribute; and NOT a full refund, so 0.
    expect(
      computeReversalAmountCents({
        transferAmount: 1000,
        sellerSubtotal: 1000,
        grandSubtotal: 0,
        refundedAmount: 500,
        chargeAmount: 1000,
      })
    ).toBe(0);
  });

  it('full refund returns whole transfer even when grand subtotal is 0', () => {
    expect(
      computeReversalAmountCents({
        transferAmount: 1000,
        sellerSubtotal: 1000,
        grandSubtotal: 0,
        refundedAmount: 1000,
        chargeAmount: 1000,
      })
    ).toBe(1000);
  });
});
