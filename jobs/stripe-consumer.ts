import '../scripts/env/load';
/* eslint-disable no-console */
import { setTimeout as sleep } from 'node:timers/promises';
import { retryAsync } from '@/lib/retry';
import {
  incStripeEventAttemptsOrDLQ,
  markStripeEventProcessed,
  stripeEventsUnprocessed,
} from '@/lib/sanity-system';
import { updateOrderFromStripeEvent } from '@/lib/payments';

type StripeEventRow = {
  _id: string;
  payload: any;
  processed_at?: string | null;
  attempts?: number;
};

const MAX_ATTEMPTS = 5;

async function handleStripeEvent(payload: any) {
  const parsed = typeof payload === 'string' ? safeParse(payload) : payload;
  await retryAsync(() => updateOrderFromStripeEvent(parsed), {
    retries: 3,
    factor: 1.8,
    minDelayMs: 250,
    maxDelayMs: 2500,
    jitter: true,
  });
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

async function pollOnce() {
  const items: StripeEventRow[] = await stripeEventsUnprocessed(10);
  for (const it of items) {
    try {
      await retryAsync(() => handleStripeEvent(it.payload), { retries: 3 });
      await markStripeEventProcessed(it._id);
    } catch (err: any) {
      await incStripeEventAttemptsOrDLQ(it._id, String(err?.message || err));
    }
  }
}

let running = true;
process.on('SIGINT', () => (running = false));
process.on('SIGTERM', () => (running = false));

(async function main() {
  console.log('[stripe] consumer started');
  while (running) {
    try {
      await pollOnce();
      await sleep(1500);
    } catch (e) {
      console.error('[stripe] loop error', e);
      await sleep(2000);
    }
  }
  console.log('[stripe] consumer stopped');
})();
