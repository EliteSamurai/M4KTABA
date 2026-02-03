/**
 * Script: Delete Incomplete User Profiles
 * 
 * This script deletes user accounts that:
 * - Have incomplete profiles (profileComplete !== true)
 * - Were created on or after November 6, 2025
 * 
 * Run with: npx tsx scripts/delete-incomplete-profiles.ts
 * 
 * WARNING: This will permanently delete user accounts. Use with caution.
 */

import './env/load';
import { readClient, writeClient } from '../studio-m4ktaba/client';

async function deleteIncompleteProfiles() {
  console.log('🔍 Finding incomplete user profiles created after November 6, 2025...\n');

  // November 6, 2025 at 00:00:00 UTC
  const cutoffDate = '2025-11-06T00:00:00Z';
  
  try {
    // Find all users with incomplete profiles created on or after Nov 6, 2025
    const incompleteUsers = await (readClient as any).fetch(
      `*[_type == "user" && 
        (profileComplete != true || !defined(profileComplete)) &&
        _createdAt >= $cutoffDate
      ] | order(_createdAt asc) {
        _id,
        email,
        profileComplete,
        _createdAt
      }`,
      { cutoffDate }
    );

    console.log(`Found ${incompleteUsers.length} users with incomplete profiles created after ${cutoffDate}\n`);

    if (incompleteUsers.length === 0) {
      console.log('✅ No users to delete!');
      return;
    }

    // Show preview of users to be deleted
    console.log('📋 Users to be deleted:');
    incompleteUsers.forEach((user: any, index: number) => {
      console.log(`  ${index + 1}. ${user.email || 'No email'} (ID: ${user._id}) - Created: ${user._createdAt}`);
    });
    console.log('');

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete the above user accounts.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete each user
    let deleted = 0;
    let errors = 0;

    for (const user of incompleteUsers) {
      try {
        console.log(`Deleting: ${user.email || 'No email'} (${user._id})...`);
        
        await (writeClient as any).delete(user._id);

        console.log(`  ✅ Deleted\n`);
        deleted++;
      } catch (error) {
        console.error(`  ❌ Error deleting ${user.email || user._id}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Deleted: ${deleted}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`  📝 Total processed: ${incompleteUsers.length}`);
    console.log('\n✨ Deletion complete!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
deleteIncompleteProfiles()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
