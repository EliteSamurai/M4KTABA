import { stripe } from '@/lib/stripe';

// Onboarding status is slow-changing (a seller doesn't re-verify hourly), so
// cache each account's readiness for CACHE_TTL_MS. This avoids a Stripe API
// call on every seller-profile render.
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cache = new Map<
  string,
  { ready: boolean; at: number }
>();

/**
 * Check whether a seller has completed Stripe Connect onboarding such that
 * they can actually receive payouts. Verifies the real account status
 * (payouts_enabled + charges_enabled), NOT just that a stripeAccountId field
 * is present on the user doc.
 *
 * Safe-false: any error (account missing, unreachable, etc.) returns false so
 * we never show the verification badge for a seller whose payout status is
 * unconfirmed. Cached for 1 hour per account.
 */
export async function isStripePayoutReady(
  accountId: string | null | undefined
): Promise<boolean> {
  if (!accountId) return false;

  const cached = cache.get(accountId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.ready;
  }

  try {
    const account = await (stripe as any).accounts.retrieve(accountId);
    const ready =
      account?.payouts_enabled === true && account?.charges_enabled === true;
    cache.set(accountId, { ready, at: Date.now() });
    return ready;
  } catch {
    // Don't cache failures long — a transient error shouldn't pin a seller as
    // unverified. Short negative-cache only.
    cache.set(accountId, { ready: false, at: Date.now() });
    return false;
  }
}
