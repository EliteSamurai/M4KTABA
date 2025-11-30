/**
 * Migration Script: Fix Incomplete User Profiles
 * 
 * This script identifies users with incomplete profiles (empty or null location)
 * and marks them as profileComplete: false so they'll be redirected to complete
 * their profile on next login.
 * 
 * Run with: npx tsx scripts/fix-incomplete-profiles.ts
 */

import { readClient, writeClient } from '../studio-m4ktaba/client';

async function fixIncompleteProfiles() {
  console.log('🔍 Finding users with incomplete profiles...\n');

  try {
    // Find all users with incomplete or missing location data
    const usersWithIncompleteProfiles = await (readClient as any).fetch(
      `*[_type == "user" && (
        !defined(location) || 
        location == null ||
        !defined(location.street) ||
        !defined(location.city) ||
        !defined(location.state) ||
        !defined(location.zip) ||
        !defined(location.country) ||
        location.street == "" ||
        location.city == "" ||
        location.state == "" ||
        location.zip == "" ||
        location.country == ""
      )]{
        _id,
        email,
        location,
        profileComplete
      }`
    );

    console.log(`Found ${usersWithIncompleteProfiles.length} users with incomplete profiles\n`);

    if (usersWithIncompleteProfiles.length === 0) {
      console.log('✅ All users have complete profiles!');
      return;
    }

    // Update each user
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of usersWithIncompleteProfiles) {
      try {
        console.log(`Processing: ${user.email}`);
        console.log(`  Location: ${JSON.stringify(user.location)}`);
        
        // Set profileComplete to false and location to null if it's incomplete
        await (writeClient as any)
          .patch(user._id)
          .set({
            profileComplete: false,
            location: user.location && Object.keys(user.location).length > 0 
              ? user.location 
              : null
          })
          .commit();

        console.log(`  ✅ Updated\n`);
        updated++;
      } catch (error) {
        console.error(`  ❌ Error updating ${user.email}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log('\n✨ Migration complete!');
    console.log('\n📝 Note: Users will be redirected to complete their profile on next login.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixIncompleteProfiles()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

