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

const query = `*[
  _type == "user" &&
  (!defined(profileComplete) || profileComplete != true) &&
  defined(location.street) && string(location.street) != "" &&
  defined(location.city) && string(location.city) != "" &&
  defined(location.state) && string(location.state) != "" &&
  defined(location.zip) && string(location.zip) != "" &&
  defined(location.country) && string(location.country) != ""
]{
  _id,
  email,
  profileComplete
}`;

async function main() {
  const users = (await client.fetch(query)) as Array<{
    _id: string;
    email?: string;
    profileComplete?: boolean | null;
  }>;

  if (users.length === 0) {
    console.log('No users require profileComplete backfill.');
    return;
  }

  console.log(`Found ${users.length} user(s) to backfill profileComplete.`);
  for (const user of users) {
    await client.patch(user._id).set({ profileComplete: true }).commit();
    console.log(
      `Updated ${user._id} (${user.email ?? 'no-email'}) profileComplete: true`
    );
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error('Failed to backfill profileComplete:', error);
  process.exit(1);
});
