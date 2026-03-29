#!/usr/bin/env tsx
import { readClient, writeClient } from '../../studio-m4ktaba/client';
import '../env/load';

type UserRow = {
  _id: string;
  email?: string;
  _createdAt: string;
};

function getCutoffIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function main() {
  const cutoff = getCutoffIso(30);
  const query = `*[
    _type == "user" &&
    _createdAt >= $cutoff &&
    (
      !defined(location) ||
      (
        (!defined(location.street) || string(location.street) == "") &&
        (!defined(location.city) || string(location.city) == "") &&
        (!defined(location.state) || string(location.state) == "") &&
        (!defined(location.zip) || string(location.zip) == "") &&
        (!defined(location.country) || string(location.country) == "")
      )
    )
  ] | order(_createdAt asc){
    _id,
    email,
    _createdAt
  }`;

  const users = (await (readClient as any).fetch(query, {
    cutoff,
  })) as UserRow[];

  console.log(`Cutoff: ${cutoff}`);
  console.log(`Matched users: ${users.length}`);

  if (users.length === 0) {
    console.log('No users matched. Nothing to delete.');
    return;
  }

  for (const [index, user] of users.entries()) {
    console.log(
      `${index + 1}. deleting ${user.email ?? 'no-email'} (${user._id}) created ${user._createdAt}`
    );
    await (writeClient as any).delete(user._id);
  }

  console.log(`Deleted ${users.length} users.`);
}

main().catch(error => {
  console.error('delete-recent-users-no-address failed:', error);
  process.exit(1);
});
