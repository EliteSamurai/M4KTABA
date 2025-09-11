'use client';

import React from 'react';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  user: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  rating: number;
  comment: string;
  date: string;
  helpful?: number;
  verified?: boolean;
}

interface UserReviewsProps {
  reviews: Review[];
  showHeader?: boolean;
  maxReviews?: number;
  variant?: 'card' | 'list' | 'grid';
  className?: string;
}

const mockReviews: Review[] = [
  {
    id: '1',
    user: {
      name: 'Ahmad Al-Rashid',
      avatar: '/avatars/ahmad.jpg',
      verified: true,
    },
    rating: 5,
    comment:
      "Excellent platform! Found rare Islamic books that I couldn't find anywhere else. The seller was very helpful and shipping was fast.",
    date: '2024-01-15',
    helpful: 12,
    verified: true,
  },
  {
    id: '2',
    user: {
      name: 'Fatima Hassan',
      avatar: '/avatars/fatima.jpg',
      verified: true,
    },
    rating: 5,
    comment:
      'Great experience selling my books. The process was simple and I received payment quickly. Highly recommended!',
    date: '2024-01-10',
    helpful: 8,
    verified: true,
  },
  {
    id: '3',
    user: {
      name: 'Omar Khalil',
      verified: false,
    },
    rating: 4,
    comment:
      'Good selection of books and fair prices. The only issue was slow shipping, but the book arrived in perfect condition.',
    date: '2024-01-08',
    helpful: 5,
    verified: false,
  },
  {
    id: '4',
    user: {
      name: 'Aisha Mohammed',
      avatar: '/avatars/aisha.jpg',
      verified: true,
    },
    rating: 5,
    comment:
      'Amazing collection of Islamic literature! The search function works great and I found exactly what I was looking for.',
    date: '2024-01-05',
    helpful: 15,
    verified: true,
  },
];

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({
  rating,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className='flex items-center gap-1'>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClasses[size],
            i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
};

const ReviewCard: React.FC<{ review: Review; variant?: 'card' | 'list' }> = ({
  review,
  variant = 'card',
}) => {
  if (variant === 'list') {
    return (
      <div className='flex gap-4 p-4 border-b last:border-b-0'>
        <Avatar className='w-10 h-10'>
          <AvatarImage src={review.user.avatar} />
          <AvatarFallback>
            {review.user.name
              .split(' ')
              .map(n => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <h4 className='text-sm font-medium'>{review.user.name}</h4>
            {review.user.verified && (
              <CheckCircle className='w-4 h-4 text-green-500' />
            )}
            <StarRating rating={review.rating} size='sm' />
            <span className='text-xs text-muted-foreground'>{review.date}</span>
          </div>
          <p className='text-sm text-muted-foreground'>{review.comment}</p>
          {review.helpful && (
            <div className='flex items-center gap-2 mt-2'>
              <span className='text-xs text-muted-foreground'>
                {review.helpful} people found this helpful
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-3'>
          <Avatar className='w-10 h-10'>
            <AvatarImage src={review.user.avatar} />
            <AvatarFallback>
              {review.user.name
                .split(' ')
                .map(n => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2'>
              <h4 className='text-sm font-medium truncate'>
                {review.user.name}
              </h4>
              {review.user.verified && (
                <CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
              )}
            </div>
            <div className='flex items-center gap-2'>
              <StarRating rating={review.rating} size='sm' />
              <span className='text-xs text-muted-foreground'>
                {review.date}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='flex items-start gap-2'>
          <Quote className='w-4 h-4 text-muted-foreground mt-1 flex-shrink-0' />
          <p className='text-sm text-muted-foreground'>{review.comment}</p>
        </div>
        {review.helpful && (
          <div className='flex items-center gap-2 mt-3'>
            <span className='text-xs text-muted-foreground'>
              {review.helpful} people found this helpful
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function UserReviews({
  reviews = mockReviews,
  showHeader = true,
  maxReviews = 6,
  variant = 'card',
  className,
}: UserReviewsProps) {
  const displayReviews = reviews.slice(0, maxReviews);
  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const verifiedReviews = reviews.filter(review => review.verified).length;

  if (variant === 'grid') {
    return (
      <div className={cn('space-y-6', className)}>
        {showHeader && (
          <div className='text-center'>
            <h3 className='text-2xl font-bold mb-2'>What Our Users Say</h3>
            <div className='flex items-center justify-center gap-4 mb-4'>
              <div className='flex items-center gap-2'>
                <StarRating rating={Math.round(averageRating)} size='lg' />
                <span className='text-lg font-semibold'>
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <span className='text-muted-foreground'>
                Based on {reviews.length} reviews
              </span>
            </div>
            <div className='flex items-center justify-center gap-2'>
              <Badge variant='secondary'>
                {verifiedReviews} Verified Reviews
              </Badge>
            </div>
          </div>
        )}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {displayReviews.map(review => (
            <ReviewCard key={review.id} review={review} variant='card' />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {showHeader && (
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Recent Reviews</h3>
            <div className='flex items-center gap-2'>
              <StarRating rating={Math.round(averageRating)} size='sm' />
              <span className='text-sm text-muted-foreground'>
                {averageRating.toFixed(1)} ({reviews.length})
              </span>
            </div>
          </div>
        )}
        <div className='border rounded-lg'>
          {displayReviews.map(review => (
            <ReviewCard key={review.id} review={review} variant='list' />
          ))}
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div className={cn('space-y-4', className)}>
      {showHeader && (
        <div className='text-center'>
          <h3 className='text-xl font-semibold mb-2'>Customer Reviews</h3>
          <div className='flex items-center justify-center gap-2'>
            <StarRating rating={Math.round(averageRating)} size='md' />
            <span className='text-lg font-semibold'>
              {averageRating.toFixed(1)}
            </span>
            <span className='text-muted-foreground'>
              ({reviews.length} reviews)
            </span>
          </div>
        </div>
      )}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {displayReviews.map(review => (
          <ReviewCard key={review.id} review={review} variant='card' />
        ))}
      </div>
    </div>
  );
}

interface ReviewSummaryProps {
  reviews: Review[];
  className?: string;
}

export function ReviewSummary({
  reviews = mockReviews,
  className,
}: ReviewSummaryProps) {
  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const totalReviews = reviews.length;
  // const verifiedReviews = reviews.filter(review => review.verified).length;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className='text-center'>
        <div className='text-2xl font-bold'>{averageRating.toFixed(1)}</div>
        <StarRating rating={Math.round(averageRating)} size='sm' />
        <div className='text-xs text-muted-foreground'>
          {totalReviews} reviews
        </div>
      </div>
      <div className='flex-1'>
        <div className='space-y-1'>
          {[5, 4, 3, 2, 1].map(rating => {
            const count = reviews.filter(r => r.rating === rating).length;
            const percentage = (count / totalReviews) * 100;
            return (
              <div key={rating} className='flex items-center gap-2 text-xs'>
                <span className='w-2'>{rating}</span>
                <Star className='w-3 h-3 text-yellow-400 fill-current' />
                <div className='flex-1 bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-yellow-400 h-2 rounded-full'
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className='w-6 text-right'>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UserReviews;
