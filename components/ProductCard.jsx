'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { urlFor } from '@/utils/imageUrlBuilder';
import { calculateShipping, getShippingBadge } from '@/lib/shipping-smart';

export default function BookProductCard({
  id,
  title,
  user,
  price,
  image,
  loading = false,
}) {
  const { addToCart, isInCart } = useCart();
  const { data: session } = useSession();
  
  // Calculate shipping estimate
  // Pass raw country codes - shipping calculator will normalize them
  const sellerCountry = user?.location?.country || 'US';
  const buyerCountry = session?.user?.location?.country || 'US';
  const shippingInfo = calculateShipping(sellerCountry, buyerCountry, 1);
  const badge = getShippingBadge(shippingInfo.tier);

  // Validate and get image URL
  const imageUrl = urlFor(image);
  // Use existing placeholder image, or fallback to a valid image
  // Accept both http/https URLs and local paths starting with /
  const validImageUrl = imageUrl && typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))
    ? imageUrl 
    : '/islamiclibrary.jpg'; // Use existing image as placeholder

  //   const builder = imageUrlBuilder(client);

  // function urlFor(source) {
  //   return builder.image(source);
  // }

  if (loading) {
    return (
      <Card className='group h-full overflow-hidden'>
        <CardContent className='p-0'>
          <Skeleton className='aspect-[3/4] w-full' />
        </CardContent>
        <CardHeader className='space-y-2'>
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
        </CardHeader>
        <CardFooter>
          <Skeleton className='h-10 w-full' />
        </CardFooter>
      </Card>
    );
  }

  const isBookInCart = isInCart(id);

  return (
    <Card className='group h-full overflow-hidden transition-all hover:shadow-lg flex flex-col'>
      <Link href={`/all/${id}`} className='block'>
        <CardContent className='relative p-0 flex-grow'>
          <div className='relative aspect-[3/4] overflow-hidden bg-muted'>
            <Image
              src={validImageUrl}
              alt={title || 'Book cover'}
              fill
              className='object-cover transition-transform duration-300 group-hover:scale-110'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
              unoptimized={validImageUrl.startsWith('/') && !validImageUrl.startsWith('/_next')}
              onError={() => {
                // Next.js Image handles errors internally, but we can log for debugging
                console.warn('Image failed to load:', validImageUrl);
              }}
            />
          </div>
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            <Badge
              variant='secondary'
              className='bg-black/60 text-white backdrop-blur-sm'
            >
              ${(price || 0).toFixed(2)}
            </Badge>
            {shippingInfo.buyerPays > 0 && (
              <Badge
                variant='outline'
                className='bg-white/90 text-xs backdrop-blur-sm'
              >
                {badge.emoji} +${(shippingInfo.buyerPays || 0).toFixed(2)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Link>

      <CardHeader className='space-y-2 p-4'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CardTitle className='line-clamp-2 text-lg'>{title}</CardTitle>
            </TooltipTrigger>
            <TooltipContent>
              <p>{title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="space-y-1">
          <p className='text-sm text-muted-foreground'>
            Sold by {user?.email ? user.email.split('@')[0] : 'Unknown Seller'}
            {user?.location?.country && (
              <span className='ml-1 text-xs'>({user.location.country.toUpperCase()})</span>
            )}
          </p>
          {shippingInfo.buyerPays > 0 && (
            <p className='text-xs text-muted-foreground flex items-center gap-1'>
              <span>{badge.emoji}</span>
              <span>{badge.label} shipping: ${shippingInfo.buyerPays.toFixed(2)}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-muted-foreground">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      {shippingInfo.carrier} - Estimated {shippingInfo.estimatedDays.min}-{shippingInfo.estimatedDays.max} days
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
          )}
          {shippingInfo.buyerPays === 0 && (
            <p className='text-xs text-green-600 font-medium'>
              ✓ Free shipping available
            </p>
          )}
        </div>
      </CardHeader>

      <CardFooter className='p-4 pt-0 mt-auto'>
        <Button
          className='relative w-full'
          size='lg'
          variant={isBookInCart ? 'secondary' : 'default'}
          onClick={e => {
            e.preventDefault();
            if (!isBookInCart) {
              addToCart({ id, title, price, quantity: 1, user });
            }
          }}
          disabled={isBookInCart}
        >
          {isBookInCart ? (
            <>
              <ShoppingCart className='mr-2 h-4 w-4' />
              In Cart
            </>
          ) : (
            <>
              <ShoppingCart className='mr-2 h-4 w-4' />
              Add to Cart
            </>
          )}
          {loading && (
            <Loader2 className='absolute right-4 h-4 w-4 animate-spin' />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
