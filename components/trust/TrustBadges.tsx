'use client';

import React from 'react';
import { Shield, Lock, Truck, Star, Award, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({
  icon: Icon,
  title,
  description,
  variant = 'default',
  className,
}) => {
  const variantStyles = {
    default: 'bg-gray-50 text-gray-700 border-gray-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    destructive: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        variantStyles[variant],
        className
      )}
    >
      <Icon className='w-5 h-5 flex-shrink-0' />
      <div className='min-w-0'>
        <p className='text-sm font-medium'>{title}</p>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
    </div>
  );
};

interface TrustBadgesProps {
  variant?: 'compact' | 'detailed' | 'grid';
  showAll?: boolean;
  className?: string;
}

const trustData = [
  {
    icon: Shield,
    title: 'SSL Secured',
    description: '256-bit encryption',
    variant: 'success' as const,
  },
  {
    icon: Lock,
    title: 'Secure Payments',
    description: 'Stripe powered',
    variant: 'success' as const,
  },
  {
    icon: Truck,
    title: 'Smart Shipping',
    description: 'Free on $35+ orders',
    variant: 'default' as const,
  },
  {
    icon: Award,
    title: 'Verified Sellers',
    description: 'Identity verified',
    variant: 'success' as const,
  },
  {
    icon: CheckCircle,
    title: 'Money Back',
    description: '30-day guarantee',
    variant: 'success' as const,
  },
];

export function TrustBadges({
  variant = 'compact',
  showAll = false,
  className,
}: TrustBadgesProps) {
  const badgesToShow = showAll ? trustData : trustData.slice(0, 4);

  if (variant === 'grid') {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-3', className)}>
        {badgesToShow.map((badge, index) => (
          <TrustBadge key={index} {...badge} />
        ))}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-4', className)}>
        <h3 className='text-lg font-semibold'>Why Trust M4ktaba?</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {badgesToShow.map((badge, index) => (
            <Card key={index} className='border-0 shadow-sm'>
              <CardContent className='p-4'>
                <TrustBadge {...badge} className='border-0 p-0' />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <div className={cn('flex flex-wrap justify-center gap-2', className)}>
      {badgesToShow.map((badge, index) => (
        <Badge
          key={index}
          variant='secondary'
          className='flex items-center gap-1 text-xs'
        >
          <badge.icon className='w-3 h-3' />
          {badge.title}
        </Badge>
      ))}
    </div>
  );
}

interface SecurityBannerProps {
  className?: string;
}

export function SecurityBanner({ className }: SecurityBannerProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4',
        className
      )}
    >
      <div className='flex items-center gap-3'>
        <div className='flex-shrink-0'>
          <Shield className='w-6 h-6 text-green-600' />
        </div>
        <div className='min-w-0'>
          <h4 className='text-sm font-semibold text-green-800'>
            Your Security is Our Priority
          </h4>
          <p className='text-xs text-green-700'>
            All transactions are protected by 256-bit SSL encryption and secure
            payment processing.
          </p>
        </div>
      </div>
    </div>
  );
}

interface TrustScoreProps {
  score: number;
  maxScore?: number;
  label?: string;
  className?: string;
}

export function TrustScore({
  score,
  maxScore = 5,
  label = 'Trust Score',
  className,
}: TrustScoreProps) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className='flex items-center gap-1'>
        {Array.from({ length: maxScore }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i < score ? 'text-yellow-400 fill-current' : 'text-gray-300'
            )}
          />
        ))}
      </div>
      <div className='min-w-0'>
        <p className='text-sm font-medium'>{label}</p>
        <p className='text-xs text-muted-foreground'>
          {score}/{maxScore} ({percentage}%)
        </p>
      </div>
    </div>
  );
}

export default TrustBadges;
