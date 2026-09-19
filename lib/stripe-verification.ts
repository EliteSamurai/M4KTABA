import { stripe } from '@/lib/stripe';

/**
 * Check whether a seller has completed Stripe Connect onboarding such that
 * they can actually receive payouts. Verifies the real account status
 * (payouts_enabled + charges_enabled), NOT just that a stripeAccountId field
 * is present on the user doc.
 *
 * Safe-false: any error (account missing, unreachable, etc.) returns false so
 * we never show the verification badge for a seller whose payout status is
 * unconfirmed.
 */
export async function isStripePayoutReady(
  accountId: string | null | undefined
): Promise<boolean> {
  if (!accountId) return false;
  try {
    const account = await (stripe as any).accounts.retrieve(accountId);
    return (
      account?.payouts_enabled === true && account?.charges_enabled === true
    );
  } catch {
    return false;
  }
}
