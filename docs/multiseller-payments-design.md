# Payments Architecture

- Destination charges used when a single seller is present: we set `transfer_data.destination` and optional `application_fee_amount` based on `PLATFORM_FEE_BPS`.
- Metadata includes `orderId`, `buyerId`, `sellerIds`, and `lineItemIds`.
- `transfer_group` is set to `orderId`.
- Idempotency: client sends `Idempotency-Key`; server derives if missing using userId+orderId+step and passes to Stripe request.
- Webhooks are deduped via `lib/idempotency` using keys of the form `stripe:webhook:<event.id>`.
- For multi-seller carts, fallback to platform charges and issue transfers per seller in webhook.

Env:

- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- PLATFORM_FEE_BPS (optional, default 0)
- REDIS_URL (optional; in-memory fallback if absent)

---

# Multi-Seller Payments: Bug Analysis & Fix Design

## Status: ⚠️ Known Limitation — Bug Identified, Not Yet Fixed

**Last updated:** 2026-09-12
**Severity:** High (latent — will cause financial harm when triggered)
**Stripe data verified:** 2026-09-12

## 1. The Bug

### Current Behavior

When a buyer checks out with items from **multiple sellers**, the checkout
flow creates a single `PaymentIntent` at `app/api/create-payment-intent/route.ts`
for the **entire cart total**. However, the `transfer_data.destination` field —
which routes funds directly to a seller's Stripe Connect account — is only set
when there is **exactly one seller** with a connected Stripe account:

```typescript
// route.ts ~line 169 (original numbering)
const sellerStripeAccountId =
  sellerIds.length === 1 ? cart[0]?.user?.stripeAccountId || null : null;
```

For multi-seller carts, `sellerStripeAccountId` is always `null`, producing a
**platform charge** (money deposited into the platform's Stripe account) with
**no destination routing**.

Meanwhile, the webhook at `app/api/webhooks/stripe-webhook/route.ts` correctly
groups the cart by seller, sends emails, and creates per-seller database
orders — but it **never calls `stripe.transfers.create()`** to move funds from
the platform balance to each seller's Connect account.

### Consequence

| Scenario | Result |
|---|---|
| Single-seller checkout | ✅ Works — destination charge routes funds to seller |
| Multi-seller checkout | ❌ **Money stuck in platform account — sellers never paid** |

A manual `stripe.transfers.create()` call would be required to pay any seller
in a multi-seller order. Without it, sellers' payouts are silently lost.

## 2. Evidence (Live Data Verified)

### Stripe Query Results (2026-09-12)

```
Total PaymentIntents: 54
  Single-seller:     15  (all with correct transfer_data.destination)
  Multi-seller:       0  ← BUG NEVER TRIGGERED
  Zero-seller:       39  (test/dev PIs with no seller metadata)
```

```
Platform account charges: 9 total
  WITH destination (Connect routing):  3  (succeeded real orders)
  WITHOUT destination (platform):      6  (abandoned PIs + 1 no-account PI)
```

```
Connected accounts: 13 express accounts (sellers)
  All have 0 transfers received
```

### Sanity Orders (5 total, all single-seller)

| Order ID | Created | Status | Seller |
|---|---|---|---|
| `zN9dkQTAaPz6IPeiY1paFE` | 2025-09-21 | `shipped` | Raw Sidr Honey ($59.99) |
| `zN9dkQTAaPz6IPeiY1n0oY` | 2025-09-21 | `pending` | Raw Sidr Honey ($59.99) |
| `aXR5rgIQA8myvhXHnbUTau` | 2025-09-21 | `pending` | Raw Sidr Honey ($59.99) |
| `LRF31LjMeR0tYSnPYB1YT4` | 2026-03-07 | `pending` | Sharh al-Aqidah ($21.99) |
| `2RlbKxeFZqpYApAqQ96IwT` | 2026-03-21 | `pending` | Sharh al-Aqidah ($21.99) |

### Conclusion

**Zero multi-seller PaymentIntents have ever been created.** The bug is latent:
15 single-seller PIs were correctly routed via destination charges, and 39
test PIs were never completed. No seller reconciliation is needed.

## 3. Current Architecture

### Payment Intent Creation (`app/api/create-payment-intent/route.ts`)

1. Groups cart items by `sellerId` → `sellerGroups` Map
2. Calculates per-seller shipping via `calculateMultiSellerShipping()`
3. Creates **ONE** `PaymentIntent` for `totalAmount = subtotal + totalShipping`
4. Sets `sellerStripeAccountId = sellerIds.length === 1 ? ... : null`
5. Passes to `createPaymentIntentWithDestinationCharge()` which conditionally
   adds `transfer_data.destination` only if `sellerStripeAccountId` is truthy
6. Sets `transfer_group` to `orderId`, stores cart/seller info in metadata
7. Returns `{ clientSecret }` to frontend

### Checkout Form (`app/checkout/checkout-form.tsx`)

Uses Stripe's modern `PaymentElement` + `stripe.confirmPayment()`:
```typescript
const result = await stripe.confirmPayment({
  elements,
  confirmParams: { return_url: successUrl },
  redirect: 'if_required',
});
```

This confirms **one** PaymentIntent (the one tied to the `clientSecret` passed
to the `Elements` provider in `page.tsx`).

### Webhook Handler (`app/api/webhooks/stripe-webhook/route.ts`)

On `payment_intent.succeeded`:
1. Extracts metadata (`sellerIds`, `lineItemIds`, `shippingDetails`, etc.)
2. Falls back to `lineItemIds` → fetches books from Sanity with `stripeAccountId`
3. Groups items by seller
4. For each seller: sends confirmation email + creates a Sanity order document
5. **Does NOT create Stripe transfers** — this is the gap

### Key Data Available in Webhook

The webhook has everything needed to create transfers:
- `paymentIntent.charges.data[0].id` — the charge ID (use as `source_transaction`)
- Per-seller amounts (from `metadata.shippingBreakdown` + line item `price × quantity`)
- Per-seller Stripe account IDs (from Sanity book `user.stripeAccountId`)
- `transfer_group` = `orderId` (already set on the PI)

## 4. Proposed Fix: Stripe Connect "Separate Charges & Transfers"

### Approach (Stripe-Recommended for Marketplaces)

Per [Stripe docs on Separate Charges and Transfers](https://stripe.com/docs/connect/separate-charges-and-transfers):

> Create separate charges and transfers to transfer funds from one payment to
> multiple connected accounts. The charge on your platform account is decoupled
> from the transfers to your connected accounts.

**The pattern:**
1. Create **one** `PaymentIntent` on the platform account (no `transfer_data.destination`)
2. Stripe charges the buyer's card → creates a `charge` on the platform account
3. After `charge.succeeded`, call `stripe.transfers.create()` for each seller:
   ```typescript
   await stripe.transfers.create({
     amount: sellerTotalCents,
     currency: 'usd',
     destination: sellerStripeAccountId,
     source_transaction: chargeId,  // links transfer to this charge
     transfer_group: orderId,       // already set on the PI
   });
   ```

Stripe confirms: *"You can create multiple transfers with the same
source_transaction, as long as the sum of the transfers doesn't exceed the
source charge."*

### Why Not "One PaymentIntent per Seller"

The earlier draft proposed creating one PaymentIntent per seller (each with
`transfer_data.destination`). This approach is **rejected** because:

- Stripe's `PaymentElement` is bound to a single PaymentIntent via its
  `clientSecret`. The `confirmPayment()` API accepts one `clientSecret` — the
  Stripe docs do not document any pattern for confirming multiple PaymentIntents
  from one card entry
- The buyer would need multiple confirmation steps (poor UX)
- Correlating multiple PIs for order creation and error handling is complex
- Stripe's recommended marketplace pattern is: one charge + manual transfers

### Risk Window: Platform Custody of Funds

**This is the key tradeoff of the Separate Charges & Transfers approach.**
With destination charges (current single-seller behavior), funds go directly
to the seller's Stripe account — the platform never touches the money. With
separate charges and transfers, the charge is created on the **platform account
first**, then transfers move funds from the platform balance to each seller.

**Timeline for card payments (the current use case):**

| Event | When | Platform balance impact |
|---|---|---|
| Buyer's card is charged | t=0s | +full cart amount |
| Stripe fires `payment_intent.succeeded` | ~1s | Money is in platform balance (pending) |
| Webhook handler creates transfers | ~2-5s | Transfers allocated, funds earmarked for sellers |
| Funds become available (settlement) | N days later | Each seller gets their portion |

**Risk window = ~seconds to minutes** for card payments. The webhook fires
almost immediately after the charge succeeds, and transfers are created within
the same handler invocation.

**Extended risk scenarios:**

| Scenario | Risk Window |
|---|---|
| Webhook delayed/fails (Stripe retries) | Minutes (Stripe retries every few seconds, then minutes) |
| Transfer API call fails and retry kicks in | Minutes to hours (depends on retry strategy) |
| ACH or other async payment methods | Until `charge.succeeded` fires (hours to days) |

**Stripe docs note:** "The transfer takes on the pending status of the
associated charge: if the funds from the charge become available in N days,
the payment that the destination Stripe account receives from the transfer
also becomes available in N days."

**Important nuance for async methods:** The Stripe docs recommend using
`charge.succeeded` (not `payment_intent.succeeded`) before creating transfers
for async payment methods like ACH, because the charge can fail after the PI
succeeds. For card payments (current use case), `payment_intent.succeeded`
fires only after the charge is confirmed successful, so `source_transaction`
is safe to use.

**Funds segregation (private preview):** Stripe offers a private preview feature
called "funds segregation" that "keeps payment funds in a protected holding
state before you transfer them to connected accounts. This prevents allocated
funds from being used for unrelated platform operations." Without this enabled,
the platform's balance is technically available for platform operations during
the risk window.

### Backward Compatibility

**Single-seller path is NOT changed.** The fix only adds transfer creation for
the multi-seller case (when `transfer_data.destination` is null). This means:

- Single-seller: continues using destination charges (direct routing, no change)
- Multi-seller: platform charge + webhook creates per-seller transfers

## 5. Implementation Plan

### Phase 1: Safety Net (completed)

- [x] Add warning comment to `app/api/create-payment-intent/route.ts`
- [x] Write this design doc at `docs/multiseller-payments-design.md`

### Phase 2: Backend — Webhook Transfer Creation

**File:** `app/api/webhooks/stripe-webhook/route.ts`

In `handlePaymentIntentSucceeded` → `processRealOrder`:

1. Extract `chargeId` from `paymentIntent.latest_charge` or
   `paymentIntent.charges.data[0].id`
2. Parse `shippingBreakdown` from PI metadata to get per-seller shipping costs
3. Determine if this was a destination charge (check
   `paymentIntent.transfer_data.destination`) — if present, **skip** (single-seller
   already handled by Stripe)
4. For each seller group:
   - Calculate `amountToTransfer` = `sellerSubtotal + sellerShippingBuyerPays` (cents)
   - Skip if seller has no `stripeAccountId` (log error, alert admin)
   - Call `stripe.transfers.create()`:
     ```typescript
     await stripe.transfers.create({
       amount: amountToTransfer,
       currency: 'usd',
       destination: sellerStripeAccountId,
       source_transaction: chargeId,
       transfer_group: orderId,
     }, { idempotencyKey: `${orderId}:transfer:${sellerId}` });
     ```
   - Log success/failure
5. If any transfer fails: log + alert but continue processing others
6. Add a new field to the Sanity order: `transferId` (or `transfersCreated: true`)
   so we can track that transfers were attempted

> **Note on async payment methods:** For card payments (current use case),
> `payment_intent.succeeded` fires only after the charge is confirmed
> successful, so `source_transaction` is safe. If ACH or other async methods
> are added, listen for `charge.succeeded` instead (Stripe docs recommend this).
>
> **Note on transfer idempotency:** The `idempotencyKey: ${orderId}:transfer:${sellerId}`
> prevents duplicate transfers if the webhook fires twice for the same PI.
> Stripe returns the existing transfer on the second call.

> **CRITICAL: `source_transaction` is required on every per-seller transfer.**
> Always use `source_transaction: chargeId` (the charge ID from the platform
> charge) when creating transfers. This links each transfer to its source charge,
> ensuring funds are automatically and reliably allocated from the charge to
> the connected account. Without `source_transaction`, transfers become bare
> balance-to-balance operations that can interfere with automatic payouts and
> make reconciliation difficult. The `createTransfer` helper in Phase 3 makes
> `sourceTransaction` a **required** parameter — never optional.

### Phase 3: Backend — `lib/stripe.ts` Helper

Add a `createTransfer` wrapper:
```typescript
export async function createTransfer(params: {
  amountCents: number;
  currency: string;
  destination: string;
  sourceTransaction: string;
  transferGroup: string;
  idempotencyKey?: string;
}) {
  return await stripe.transfers.create({
    amount: params.amountCents,
    currency: params.currency,
    destination: params.destination,
    source_transaction: params.sourceTransaction,
    transfer_group: params.transferGroup,
  }, params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined);
}
```

### Phase 4: Testing Plan (Stripe Test Mode — NON-NEGOTIABLE)

Before this code path is ever used in production:

1. **Set up test connected accounts** in Stripe Dashboard (test mode)
   - Create 2+ test Express accounts
   - Note their test account IDs (e.g., `acct_1...`)

2. **Create test books** assigned to different test sellers

3. **Run full checkout** with multi-seller cart using test card
   `4242 4242 4242 4242`

4. **Verify via Stripe Dashboard (test mode):**
   - Platform charge appears in **Balance → Charges**
   - Transfers appear in **Balance → Transfers** (one per seller)
   - Each connected account sees funds in its **Balance → Balances**

5. **Verify webshop:**
   - Sanity orders created for each seller
   - Emails sent to each seller
   - Order statuses updated to `paid`

### Phase 5: Edge Cases to Handle

| Edge Case | Handling |
|---|---|
| Seller has no `stripeAccountId` | Skip transfer, log error, alert admin |
| Transfer fails (Stripe API error) | Retry with exponential backoff, alert admin |
| Partial failure (some succeed, some fail) | Mark failed seller orders as `payment_partial` |
| Webhook fires twice (idempotency) | Idempotency key prevents duplicate transfers |
| Refund initiated | Reverse transfers via `stripe.transfers.create()` reversal |
| Platform charge has `application_fee_amount` | Not applicable (0% platform fee) |

## 6. Files Affected

| File | Change | Description |
|---|---|---|
| `app/api/create-payment-intent/route.ts` | ✅ Done | Warning comment added |
| `docs/multiseller-payments-design.md` | ✅ Done | This design doc |
| `app/api/webhooks/stripe-webhook/route.ts` | Phase 2 | Add transfer creation in `processRealOrder` |
| `lib/stripe.ts` | Phase 3 | Add `createTransfer()` helper |
| `lib/idempotency.ts` | Phase 3 | May add transfer-specific key helpers |
| `app/checkout/checkout-form.tsx` | No change | Payment UX unchanged |
| `app/checkout/page.tsx` | No change | `clientSecret` handling unchanged |
| `app/success/page.tsx` | No change | Reads single `payment_intent` param |
| `docs/PAYMENTS.md` | Phase 2 | Update to document transfer behavior |

## 7. Open Questions (Before Implementation)

1. **Transfer amount calculation:** Should the transfer include the buyer-paid
   shipping cost (`buyerPays`) or just the book subtotal?
   - Current single-seller behavior (destination charge): seller receives full
     `subtotal + shipping`
   - Proposal: transfer `subtotal + buyerPays` per seller for consistency

2. **Platform shipping subsidy:** The `platformSubsidy` field in shipping
   calculations is a platform business expense — it does NOT get transferred to
   sellers and should NOT be included in transfer amounts.

3. **Test mode verification:** What test connected account IDs and test cards
---

## 8. Phase 4: Success page / per-seller order artifacts (completed)

Two semantically distinct order documents now exist per purchase on purpose:

- **Combined buyer order** — `orderKind: 'buyer'`, status `paid`, full cart,
  buyer `userEmail`, appended to the buyer's `orderHistory`. Created by the
  success page (`POST /api/orders`), the only component holding the exact
  checkout cart snapshot. Feeds buyer order history (`GET /api/orders`) and
  the buyer order detail page (`/orders/[id]`).
- **Per-seller fulfillment orders** — `orderKind: 'seller'`, status `paid`,
  one per seller, cart subset, `transfersCreated`/`transferId`/`transferError`
  patched by the Stripe webhook. Feeds seller views (`/api/orders/seller`) and
  holds the per-seller transfer linkage.

Cross-view filtering (all backward compatible with legacy docs that have no
`orderKind`): buyer history and `POST /api/orders` dedup match only
`(!defined(orderKind) || orderKind == "buyer")`; seller views skip
`orderKind == "buyer"`. Shared ownership authorization lives in
`lib/order-access.ts` (used by GET `/api/orders/[orderId]`,
`/orders/[id]`, and the tracking route).

Existing Sanity data was verified duplicate-free before this phase: 5 orders,
5 distinct paymentIds, all created by the webhook path
(`transfersCreated` present), all single-seller carts — no migration needed.

### Status vocabulary

Both order writers now persist `paid` on confirmed payments (previously both
wrote `pending`). `pending` remains only on legacy orders or abandoned
purchases. The billing page and order-detail page recognize
`paid`/`shipped`/`delivered`/`pending`/`disputed`.

### FOLLOWUP-CART-SNAPSHOT — cart fidelity between checkout, webhook and order records

Observed (Phase 4 planning; still accurate after Phase 5): the PaymentIntent
`metadata` stores `lineItemIds` but **not** a cart snapshot. The webhook
reconstructs the cart from `lineItemIds` → current book prices in Sanity at
webhook time, while the success page uses the cart the buyer actually checked
out with (URL param or `checkout_cart` session storage). If a book price
changes between checkout and webhook delivery, the per-seller fulfillment
orders + transfer amounts (webhook) and the stored **buyer** order cart
(success page, `orderKind: 'buyer'`) can diverge from each other and from what
the buyer actually paid.

This is the one known gap the Phase 5 reconciliation deliberately does not
close: refund/dispute handling reverses transfers based on the amounts Stripe
holds, not on the cart snapshot — so a price drift between checkout and webhook
means the reversal amount is correct *for the transfer that exists*, but the
transfer itself may not match the buyer's original purchase. Picking this up
later affects transfer creation (Phase 1 logic), not just refunds.

Options to resolve (not yet implemented):
1. Store the cart snapshot in PaymentIntent `metadata.cart` at
   `app/api/create-payment-intent` time (watch the 500-char-per-key metadata
   budget; a large cart may exceed limits).
2. Persist the exact cart snapshot in Sanity at checkout, referenced by
   `paymentId`, and have the webhook read that instead of `lineItemIds`.
3. Accept the drift and reconcile transfers against the stored buyer order
   (`orderKind: 'buyer'`) in a periodic audit (current
   `scripts/sync-stripe-to-sanity.ts` base).

Tag for tracking: `FOLLOWUP-CART-SNAPSHOT`.

