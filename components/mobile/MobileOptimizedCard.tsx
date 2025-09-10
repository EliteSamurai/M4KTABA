'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileOptimizedCardProps {
  title: string;
  description?: string;
  price?: number;
  image?: string;
  badge?: string;
  onAction?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  className?: string;
  variant?: 'product' | 'info' | 'action';
}

export function MobileOptimizedCard({
  title,
  description,
  price,
  image,
  badge,
  onAction,
  onFavorite,
  onShare,
  onMore,
  className,
  variant = 'product',
}: MobileOptimizedCardProps) {
  const isProduct = variant === 'product';
  const isAction = variant === 'action';

  return (
    <Card
      className={cn(
        'w-full transition-all duration-200 active:scale-95',
        isProduct && 'hover:shadow-md',
        className
      )}
    >
      <CardHeader className={cn('pb-2', isProduct && 'p-4')}>
        <div className='flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <h3
              className={cn(
                'font-semibold truncate',
                isProduct ? 'text-base' : 'text-lg'
              )}
            >
              {title}
            </h3>
            {description && (
              <p
                className={cn(
                  'text-muted-foreground mt-1',
                  isProduct ? 'text-sm line-clamp-2' : 'text-base'
                )}
              >
                {description}
              </p>
            )}
          </div>
          <div className='flex items-center gap-1 ml-2'>
            {badge && (
              <Badge variant='secondary' className='text-xs'>
                {badge}
              </Badge>
            )}
            {isProduct && onMore && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onMore}
                className='h-8 w-8 p-0'
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isProduct && image && (
        <div className='px-4 pb-2'>
          <div className='relative aspect-square w-full overflow-hidden rounded-lg bg-muted'>
            <img
              src={image}
              alt={title}
              className='h-full w-full object-cover'
            />
          </div>
        </div>
      )}

      <CardContent className={cn(isProduct ? 'p-4 pt-0' : 'p-4')}>
        {isProduct && price !== undefined && (
          <div className='flex items-center justify-between mb-3'>
            <span className='text-lg font-bold text-green-600'>
              ${price.toFixed(2)}
            </span>
            <div className='flex items-center gap-2'>
              {onFavorite && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onFavorite}
                  className='h-8 w-8 p-0'
                >
                  <Heart className='h-4 w-4' />
                </Button>
              )}
              {onShare && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onShare}
                  className='h-8 w-8 p-0'
                >
                  <Share2 className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>
        )}

        {onAction && (
          <Button
            onClick={onAction}
            className={cn('w-full', isAction && 'h-12 text-base')}
            size={isAction ? 'lg' : 'default'}
          >
            {isAction ? title : 'View Details'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface MobileProductGridProps {
  products: Array<{
    id: string;
    title: string;
    description?: string;
    price: number;
    image?: string;
    badge?: string;
  }>;
  onProductClick?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  className?: string;
}

export function MobileProductGrid({
  products,
  onProductClick,
  onFavorite,
  onShare,
  className,
}: MobileProductGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3',
        'sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
        className
      )}
    >
      {products.map(product => (
        <MobileOptimizedCard
          key={product.id}
          title={product.title}
          description={product.description}
          price={product.price}
          image={product.image}
          badge={product.badge}
          onAction={() => onProductClick?.(product.id)}
          onFavorite={() => onFavorite?.(product.id)}
          onShare={() => onShare?.(product.id)}
          variant='product'
        />
      ))}
    </div>
  );
}

interface MobileActionCardProps {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function MobileActionCard({
  title,
  description,
  action,
  onAction,
  icon: Icon,
  className,
}: MobileActionCardProps) {
  return (
    <Card
      className={cn(
        'w-full transition-all duration-200 active:scale-95 text-center',
        className
      )}
    >
      <CardContent className='p-6'>
        {Icon && (
          <div className='flex justify-center mb-4'>
            <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
              <Icon className='w-6 h-6 text-purple-600' />
            </div>
          </div>
        )}
        <h3 className='text-lg font-semibold mb-2'>{title}</h3>
        <p className='text-muted-foreground mb-4'>{description}</p>
        <Button onClick={onAction} className='w-full h-12 text-base' size='lg'>
          {action}
        </Button>
      </CardContent>
    </Card>
  );
}

interface MobileSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function MobileSection({
  title,
  subtitle,
  children,
  action,
  className,
}: MobileSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold'>{title}</h2>
          {subtitle && (
            <p className='text-sm text-muted-foreground'>{subtitle}</p>
          )}
        </div>
        {action && (
          <Button variant='outline' size='sm' onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

export default MobileOptimizedCard;
