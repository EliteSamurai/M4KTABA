import '../env/load';
/* eslint-disable no-console */
import { writeClient, assertWritePermissions } from '@/lib/sanity-clients';

async function main() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Do not seed in production');
  await assertWritePermissions();
  const now = new Date().toISOString();
  await (writeClient as any).create({
    _type: 'event_outbox',
    type: 'email.order_paid',
    payload: JSON.stringify({ orderId: 'o_test_1' }),
    created_at: now,
    attempts: 0,
  });
  await (writeClient as any).create({
    _type: 'event_outbox',
    type: 'analytics.checkout_succeeded',
    payload: JSON.stringify({ orderId: 'o_test_2' }),
    created_at: now,
    attempts: 0,
  });
  await (writeClient as any).create({
    _type: 'stripe_events',
    event_id: 'evt_test_1',
    payload: JSON.stringify({ type: 'payment_intent.succeeded' }),
    intent_id: 'pi_test_1',
    created_at: now,
    attempts: 0,
  });
  await (writeClient as any).create({
    _type: 'dlq',
    queue: 'outbox',
    payload: JSON.stringify({ orderId: 'o_test_dlq' }),
    reason: 'seed',
    created_at: now,
    attempts: 1,
  });
  console.log('Seeded queues docs');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
