#!/usr/bin/env tsx
/**
 * Sync Stripe → Sanity: find successful Stripe payments and create any missing orders in Sanity.
 * Run manually or on a schedule (e.g. daily cron) so orders never fall through the cracks.
 *
 * Usage:
 *   npx tsx scripts/sync-stripe-to-sanity.ts           # last 7 days
 *   npx tsx scripts/sync-stripe-to-sanity.ts 3         # last 3 days
 *
 * Requires: .env.local (or env) with STRIPE_SECRET_KEY, SANITY_PROJECT_ID,
 * SANITY_DATASET, SANITY_WRITE_TOKEN (or SANITY_API_TOKEN).
 */

import { config } from 'dotenv';
import path from 'path';
import { createOrderFromPaymentIntent } from './lib/create-order-from-pi';

config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(process.cwd(), '.env') });

const DEFAULT_DAYS = 7;

async function main() {
  const daysArg = process.argv[2];
  const days = daysArg ? parseInt(daysArg, 10) : DEFAULT_DAYS;
  if (!Number.isFinite(days) || days < 1 || days > 90) {
    console.error('Usage: npx tsx scripts/sync-stripe-to-sanity.ts [days]');
    console.error('  days: 1–90, default 7 (sync payments from the last N days)');
    process.exit(1);
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

  if (!stripeKey || !projectId || !dataset || !token) {
    console.error('Missing env: STRIPE_SECRET_KEY, SANITY_PROJECT_ID, SANITY_DATASET, SANITY_WRITE_TOKEN (or SANITY_API_TOKEN)');
    process.exit(1);
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });
  const { createClient } = await import('@sanity/client');

  const writeClient = createClient({
    projectId,
    dataset,
    token,
    useCdn: false,
    apiVersion: '2023-10-01',
  });

  const readClient = createClient({
    projectId,
    dataset,
    useCdn: false,
    apiVersion: '2023-10-01',
  });

  const since = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  console.log(`Syncing Stripe → Sanity (payments since ${days} days ago, created >= ${new Date(since * 1000).toISOString()})...`);

  let hasMore = true;
  let cursor: string | undefined;
  let created = 0;
  let skipped = 0;
  let failed = 0;

  while (hasMore) {
    const list = await stripe.paymentIntents.list({
      created: { gte: since },
      limit: 100,
      ...(cursor ? { starting_after: cursor } : {}),
    });

    for (const pi of list.data) {
      if (pi.status !== 'succeeded') continue;

      try {
        const result = await createOrderFromPaymentIntent(
          pi,
          readClient as unknown as Parameters<typeof createOrderFromPaymentIntent>[1],
          writeClient as unknown as Parameters<typeof createOrderFromPaymentIntent>[2]
        );
        if (result.created) {
          created++;
          console.log(`  Created order for ${pi.id} → ${result.orderId}`);
        } else {
          skipped++;
          if (result.reason !== 'Order already exists') {
            console.log(`  Skip ${pi.id}: ${result.reason}`);
          }
        }
      } catch (err) {
        failed++;
        console.error(`  Error processing ${pi.id}:`, err);
      }
    }

    hasMore = list.has_more;
    if (list.data.length > 0) {
      cursor = list.data[list.data.length - 1].id;
    }
  }

  console.log(`Done. Created: ${created}, skipped (already in Sanity or no cart): ${skipped}, errors: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
