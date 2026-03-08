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

function makeKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureObjectKey<T extends Record<string, any>>(
  value: T,
  prefix: string
): { value: T; changed: boolean } {
  if (typeof value._key === 'string' && value._key.trim().length > 0) {
    return { value, changed: false };
  }
  return {
    value: { ...value, _key: makeKey(prefix) },
    changed: true,
  };
}

function ensureKeyedObjectArray(
  items: unknown,
  prefix: string
): { value: unknown; changed: boolean } {
  if (!Array.isArray(items)) return { value: items, changed: false };

  let changed = false;
  const next = items.map((item, idx) => {
    if (!item || typeof item !== 'object') return item;
    const keyed = ensureObjectKey(item as Record<string, any>, `${prefix}-${idx}`);
    if (keyed.changed) changed = true;
    return keyed.value;
  });
  return { value: next, changed };
}

function ensurePortableTextKeys(
  bio: unknown
): { value: unknown; changed: boolean } {
  if (!Array.isArray(bio)) return { value: bio, changed: false };

  let changed = false;
  const blocks = bio.map((rawBlock, blockIdx) => {
    if (!rawBlock || typeof rawBlock !== 'object') return rawBlock;
    const blockKeyed = ensureObjectKey(
      rawBlock as Record<string, any>,
      `bio-block-${blockIdx}`
    );
    let block = blockKeyed.value;
    if (blockKeyed.changed) changed = true;

    const childrenResult = ensureKeyedObjectArray(
      (block as any).children,
      `bio-child-${blockIdx}`
    );
    if (childrenResult.changed) {
      block = { ...block, children: childrenResult.value };
      changed = true;
    }

    const markDefsResult = ensureKeyedObjectArray(
      (block as any).markDefs,
      `bio-mark-${blockIdx}`
    );
    if (markDefsResult.changed) {
      block = { ...block, markDefs: markDefsResult.value };
      changed = true;
    }

    return block;
  });

  return { value: blocks, changed };
}

async function main() {
  const users = (await client.fetch(
    `*[_type == "user"]{
      _id,
      bio,
      ratings,
      cart,
      orderHistory
    }`
  )) as Array<Record<string, any>>;

  let patchedDocs = 0;

  for (const user of users) {
    const setPayload: Record<string, unknown> = {};
    let docChanged = false;

    const bioResult = ensurePortableTextKeys(user.bio);
    if (bioResult.changed) {
      setPayload.bio = bioResult.value;
      docChanged = true;
    }

    const ratingsResult = ensureKeyedObjectArray(user.ratings, 'ratings');
    if (ratingsResult.changed) {
      setPayload.ratings = ratingsResult.value;
      docChanged = true;
    }

    const cartResult = ensureKeyedObjectArray(user.cart, 'cart');
    if (cartResult.changed) {
      setPayload.cart = cartResult.value;
      docChanged = true;
    }

    const orderHistoryResult = ensureKeyedObjectArray(
      user.orderHistory,
      'order-history'
    );
    if (orderHistoryResult.changed) {
      setPayload.orderHistory = orderHistoryResult.value;
      docChanged = true;
    }

    if (!docChanged) continue;

    await client.patch(user._id).set(setPayload).commit();
    patchedDocs += 1;
    console.log(`Patched missing keys for user ${user._id}`);
  }

  console.log(`Done. Updated ${patchedDocs} user document(s).`);
}

main().catch((error) => {
  console.error('Failed to fix missing user keys:', error);
  process.exit(1);
});
