'use client';

import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { HTMLAttributes } from 'react';

interface StarRatingProps extends HTMLAttributes<HTMLElement> {
  /** Average rating 0–5. */
  rating: number;
  /** Number of reviews to display next to the stars. */
  reviewCount?: number;
  /** Show the count + "review(s)" text. */
  showCount?: boolean;
  /** Size variant for the stars. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional link wrapping the whole rating (e.g. to the seller profile). */
  href?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StarRating({
  rating,
  reviewCount,
  showCount = false,
  size = 'sm',
  href,
  className,
  ...rest
}: StarRatingProps & React.AriaAttributes) {
  const safe = Math.min(Math.max(rating ?? 0, 0), 5);
  const fullStars = Math.floor(safe);
  const hasHalfStar = safe - fullStars >= 0.5;

  const stars = (
    <span className='inline-flex items-center gap-0.5' role='img' aria-hidden='true'>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < fullStars) {
          return (
            <Star
              key={i}
              className={cn(
                'text-yellow-400 fill-current',
                sizeClasses[size]
              )}
            />
          );
        }
        if (i === fullStars && hasHalfStar) {
          return (
            <StarHalf
              key={i}
              className={cn(
                'text-yellow-400 fill-current',
                sizeClasses[size]
              )}
            />
          );
        }
        return (
          <Star
            key={i}
            className={cn('text-muted-foreground/40', sizeClasses[size])}
          />
        );
      })}
    </span>
  );

  const content = (
    <>
      {stars}
      {showCount && typeof reviewCount === 'number' && (
        <span
          className={cn(
            'text-muted-foreground',
            size === 'lg' ? 'text-sm' : 'text-xs ml-1.5'
          )}
        >
          ({reviewCount})
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'inline-flex items-center gap-1 rounded-xs no-underline hover:opacity-80',
          className
        )}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      {...rest}
    >
      {content}
    </span>
  );
}

export default StarRating;
