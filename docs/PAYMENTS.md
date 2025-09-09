# Payments Architecture

- Destination charges used when a single seller is present: we set `transfer_data.destination` and optional `application_fee_amount` based on `PLATFORM_FEE_BPS`.
- Metadata includes `orderId`, `buyerId`, `sellerIds`, and `lineItemIds`.
- `transfer_group` is set to `orderId`.
- Idempotency: client sends `Idempotency-Key`; server derives if missing using userId+orderId+step and passes to Stripe request.
- Webhooks are deduped via `lib/idempotency` using keys of the form `stripe:webhook:<event.id>`.
- Future: for multi-seller carts, fallback to platform charges and issue transfers per seller in webhook, or split payments.

Env:

- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- PLATFORM_FEE_BPS (optional, default 0)
- REDIS_URL (optional; in-memory fallback if absent)
