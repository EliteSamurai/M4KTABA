import '../env/load';
/* eslint-disable no-console */
import { writeClient, readClient } from '@/lib/sanity-clients';

async function fixCollection(type: string) {
  const items: any[] = await (readClient as any).fetch(
    `*[_type == $t][0...1000] | order(_createdAt asc)`,
    { t: type }
  );
  let updates = 0;
  for (const it of items) {
    const p = it?.payload;
    if (typeof p === 'string') continue;
    await (writeClient as any)
      .patch(it._id)
      .set({ payload: JSON.stringify(p ?? null) })
      .commit();
    updates++;
  }
  console.log(`[migrate] ${type}: updated ${updates}/${items.length}`);
}

(async function main() {
  await fixCollection('event_outbox');
  await fixCollection('dlq');
  await fixCollection('stripe_events');
  console.log('[migrate] done');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
