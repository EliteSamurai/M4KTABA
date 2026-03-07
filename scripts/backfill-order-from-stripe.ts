#!/usr/bin/env tsx
/**
 * Create a missing order in Sanity from a Stripe payment intent ID.
 * Use when a customer paid but the order never appeared in Sanity.
 *
 * Usage: npx tsx scripts/backfill-order-from-stripe.ts pi_xxxxxxxxxxxxx
 *
 * Requires: .env.local (or env) with STRIPE_SECRET_KEY, SANITY_PROJECT_ID,
 * SANITY_DATASET, SANITY_WRITE_TOKEN (or SANITY_API_TOKEN).
 */

import { config } from 'dotenv';
import path from 'path';
import { createOrderFromPaymentIntent } from './lib/create-order-from-pi';

config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const piId = process.argv[2];
  if (!piId || !piId.startsWith('pi_')) {
    console.error('Usage: npx tsx scripts/backfill-order-from-stripe.ts pi_xxxxxxxxxxxxx');
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

  console.log('Fetching payment intent:', piId);
  const paymentIntent = await stripe.paymentIntents.retrieve(piId);
  const result = await createOrderFromPaymentIntent(paymentIntent, readClient, writeClient);

  if (result.created) {
    console.log('Order created in Sanity:', result.orderId);
  } else {
    console.error(result.reason);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
