import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { stripe } from '@/lib/stripe';
import { getStripeAccountId } from '@/utils/getStripeId';
import { getOrCreateStripeAccount } from '@/lib/account';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripeAccountId = await getStripeAccountId(session.user._id);
  const accountId = await getOrCreateStripeAccount(session.user._id);
  console.log(accountId);

  if (!stripeAccountId) {
    // No stripe account -> Onboarding
    const accountLink = await (stripe as any).accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  }

  // User has stripe account -> Dashboard
  const loginLink = await (stripe as any).accounts.createLoginLink(
    stripeAccountId
  );

  return NextResponse.json({ url: loginLink.url });
}
