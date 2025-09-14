import { readClient } from '@/studio-m4ktaba/client';

export async function getStripeAccountId(userId) {
  return await readClient.fetch(
    `*[_type == "user" && _id == $userId][0].stripeAccountId`,
    { userId }
  );
}
