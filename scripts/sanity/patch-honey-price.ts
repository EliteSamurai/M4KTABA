#!/usr/bin/env tsx

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN!,
  useCdn: false,
});

async function patchHoneyPrice() {
  try {
    console.log('🔍 Finding sidr-honey document...');

    const documents = await client.fetch(`
      *[_type == "book" && slug.current == "sidr-honey"][0]
    `);

    if (!documents) {
      console.log('❌ No sidr-honey document found');
      return;
    }

    console.log('📝 Updating price to $59.99...');

    const result = await client
      .patch(documents._id)
      .set({ price: 59.99 })
      .commit();

    console.log('✅ Successfully updated honey price:', result);
  } catch (error) {
    console.error('❌ Failed to update honey price:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  patchHoneyPrice();
}
