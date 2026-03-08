#!/usr/bin/env tsx

import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION || '2023-10-01';
const token = process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_TOKEN;

if (!projectId || !dataset || !token) {
  throw new Error(
    'Missing SANITY_PROJECT_ID / SANITY_DATASET / SANITY_WRITE_TOKEN (or SANITY_API_TOKEN)'
  );
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
  perspective: 'raw',
});

async function main() {
  const usersWithNullImage = (await client.fetch(
    `*[_type == "user" && image == null]{ _id }`
  )) as Array<{ _id: string }>;

  if (!usersWithNullImage.length) {
    console.log('No users with null image field found.');
    return;
  }

  console.log(`Found ${usersWithNullImage.length} user(s) with image == null.`);

  for (const user of usersWithNullImage) {
    await client.patch(user._id).unset(['image']).commit();
    console.log(`Unset null image on user ${user._id}`);
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error('Failed to clean null user images:', error);
  process.exit(1);
});
