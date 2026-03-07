# Orders and Sanity Studio

## Where orders are created

1. **Success page (main path)**  
   After payment, the customer is sent to `/success`. That page calls `POST /api/orders` and creates an order in Sanity (same project/dataset as the app).

2. **Stripe webhook (backup)**  
   On `payment_intent.succeeded`, the webhook looks for an existing order with that `paymentId`. If the success page already saved it, the webhook only sends emails. If **no order is found** after a short wait, the webhook now creates the order using:
   - `userEmail` and `shippingDetails` from payment intent metadata
   - Cart built from `lineItemIds` (books fetched from Sanity)

So if the success page fails (e.g. user closed the tab, or a past bug), the webhook should still create the order.

## Why an order might not appear in Sanity

1. **Dataset mismatch**  
   The **Studio** uses (in `studio-m4ktaba/sanity.cli.ts` and `sanity.config.ts`):
   - `projectId: '32kxkt38'`
   - `dataset: 'blog-m4ktaba'`

   The **Next.js app** (and API routes) use:
   - `SANITY_PROJECT_ID`
   - `SANITY_DATASET`

   from the environment (e.g. Vercel). If `SANITY_PROJECT_ID` or `SANITY_DATASET` on Vercel differ from the Studio config, orders are written to a different project/dataset and will **not** show in the Studio.

   **Check:** In Vercel → Project → Settings → Environment Variables, ensure:
   - `SANITY_PROJECT_ID` = `32kxkt38`
   - `SANITY_DATASET` = `blog-m4ktaba`

2. **Order never saved**  
   Before the webhook fallback was added, a failed success-page save meant no order was created. For **new** payments, the webhook now creates the order when the success page didn’t. For an **already missed** order, use the backfill script below.

## Syncing Stripe → Sanity

To make sure every successful Stripe payment has a matching order in Sanity, run the sync script periodically (e.g. daily):

```bash
npx tsx scripts/sync-stripe-to-sanity.ts        # last 7 days (default)
npx tsx scripts/sync-stripe-to-sanity.ts 3      # last 3 days
npx tsx scripts/sync-stripe-to-sanity.ts 30     # last 30 days
```

The script lists successful payment intents from Stripe in that window, then for each one creates an order in Sanity if it doesn’t already exist (same logic as the webhook fallback). Safe to run multiple times; existing orders are skipped.

**Optional: run on a schedule**

- **Vercel Cron:** Add a cron job that calls an API route which runs this logic (or shell out to the script with the right env).
- **Local cron:** e.g. `0 2 * * * cd /path/to/m4ktaba && npx tsx scripts/sync-stripe-to-sanity.ts 7` (daily at 2am).

Requires: `STRIPE_SECRET_KEY`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_WRITE_TOKEN` (or `SANITY_API_TOKEN`).

## Recovering a single missing order (backfill)

If one customer paid but the order is missing in Sanity, create it from that payment:

1. In Stripe Dashboard, find the payment and copy the **Payment intent ID** (e.g. `pi_xxx`).
2. From the project root, with env loaded (e.g. from `.env.local`):
   ```bash
   npx tsx scripts/backfill-order-from-stripe.ts pi_xxxxxxxxxxxxx
   ```
3. The script fetches the payment intent, builds the cart from metadata (or `lineItemIds`), and creates the order in Sanity.

Same env as above.
