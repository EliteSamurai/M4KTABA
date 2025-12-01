/**
 * Migration script to add missing _key fields to array items in Sanity
 * 
 * This fixes the "Missing keys" error in Sanity Studio for:
 * - user.cart items
 * - user.ratings items
 * 
 * Run with: npx ts-node scripts/fix-missing-keys.ts
 */

import { readClient, writeClient } from '../studio-m4ktaba/client';

async function generateKey(): Promise<string> {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function fixMissingKeys() {
  console.log('🔧 Starting migration to fix missing _key fields...\n');

  try {
    // Fetch all users with cart or ratings
    const users = await (readClient as any).fetch(`
      *[_type == "user" && (defined(cart) || defined(ratings))] {
        _id,
        cart,
        ratings
      }
    `);

    console.log(`📊 Found ${users.length} users with cart or ratings data\n`);

    let usersFixed = 0;
    let itemsFixed = 0;

    for (const user of users) {
      let needsUpdate = false;
      const updates: any = {};

      // Check cart items
      if (user.cart && Array.isArray(user.cart)) {
        const cartWithKeys = await Promise.all(
          user.cart.map(async (item: any) => {
            if (!item._key) {
              itemsFixed++;
              needsUpdate = true;
              return {
                ...item,
                _key: await generateKey(),
              };
            }
            return item;
          })
        );

        if (needsUpdate) {
          updates.cart = cartWithKeys;
        }
      }

      // Check ratings items
      if (user.ratings && Array.isArray(user.ratings)) {
        const ratingsWithKeys = await Promise.all(
          user.ratings.map(async (item: any) => {
            if (!item._key) {
              itemsFixed++;
              needsUpdate = true;
              return {
                ...item,
                _key: await generateKey(),
              };
            }
            return item;
          })
        );

        if (needsUpdate) {
          updates.ratings = ratingsWithKeys;
        }
      }

      // Apply updates if needed
      if (needsUpdate) {
        console.log(`  Fixing user: ${user._id}`);
        await (writeClient as any)
          .patch(user._id)
          .set(updates)
          .commit();
        usersFixed++;
      }
    }

    console.log('\n✅ Migration completed!');
    console.log(`   Users updated: ${usersFixed}`);
    console.log(`   Items fixed: ${itemsFixed}`);

    if (usersFixed === 0) {
      console.log('   No items needed fixing - all good! 🎉');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
fixMissingKeys()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

