'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import StarRating from '@/components/StarRating';

/**
 * Visual seller attribution used on every product card and product detail page.
 *
 * - `first_party`  → "Direct from M4KTABA" (M4KTABA Originals / first-party stock)
 * - `marketplace` → "Sold by {seller}" with seller name linked to the public
 *                    seller profile, plus an inline average rating.
 *
 * For marketplace items, pass the seller document (`sellerId`, `email`,
 * `name`, `image`, `rating`, `reviewCount`). For first-party items, pass
 * `sellerType="first_party"`.
 */
export interface SellerBadgeProps {
  /** The book's seller type. Defaults to "marketplace" when omitted. */
  sellerType?: 'marketplace' | 'first_party';
  /** First-party label override (defaults to "Direct from M4KTABA"). */
  firstPartyLabel?: string;
  sellerId?: string | null;
  sellerName?: string | null;
  sellerEmail?: string | null;
  /** Average rating 0–5 (marketplace only). */
  rating?: number;
  reviewCount?: number;
  /** Show the star rating on marketplace items. */
  showRating?: boolean;
  /**
   * Attribution text override. `undefined` -> "Sold by {name}" (default,
   * backwards compatible). `null` -> omit text (rating-only, e.g. the seller
   * profile header). A string -> use verbatim.
   */
  label?: string | null;
  className?: string;
}

const getDisplaySellerName = (name?: string | null, email?: string | null) =>
  name || (email ? email.split('@')[0] : 'Seller');

export function SellerBadge({
  sellerType = 'marketplace',
  firstPartyLabel = 'Direct from M4KTABA',
  sellerId,
  sellerName,
  sellerEmail,
  rating,
  reviewCount,
  showRating = false,
  label,
  className,
}: SellerBadgeProps) {
  if (sellerType === 'first_party') {
    return (
      <Badge
        variant='secondary'
        className={cn(
          'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200',
          className
        )}
      >
        {firstPartyLabel}
      </Badge>
    );
  }

  const displayName = getDisplaySellerName(sellerName, sellerEmail);
  const hasRating = typeof rating === 'number' && rating > 0;
  const labelText = label === undefined ? `Sold by ${displayName}` : label;

  const sellerLink = (
    <span className='inline-flex items-center gap-1.5 text-sm font-medium'>
      {sellerId ? (
        <Link
          href={`/seller/${sellerId}`}
          className='text-foreground/80 hover:text-foreground underline-offset-2 hover:underline'
        >
          {labelText}
        </Link>
      ) : (
        <span className='text-foreground/80'>{labelText}</span>
      )}
      {showRating && hasRating && (
        <StarRating
          rating={rating}
          reviewCount={reviewCount}
          size='sm'
          showCount
          className='text-xs'
        />
      )}
    </span>
  );

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {sellerLink}
    </span>
  );
}

export default SellerBadge;
