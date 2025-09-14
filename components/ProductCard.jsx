'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Loader2 } from 'lucide-react';

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

export default function BookProductCard({
  id,
  title,
  user,
  price,
  image,
  loading = false,
}) {
  const { addToCart, isInCart } = useCart();

  const imageUrl = urlFor(image);
  const validImageUrl = imageUrl || '/placeholder.jpg';

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
          <div className='relative aspect-[3/4] overflow-hidden'>
            <Image
              src={validImageUrl}
              alt={title}
              fill
              className='object-cover transition-transform duration-300 group-hover:scale-110'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            />
          </div>
          <Badge
            variant='secondary'
            className='absolute right-2 top-2 bg-black/60 text-white backdrop-blur-sm'
          >
            ${price.toFixed(2)}
          </Badge>
        </CardContent>
      </Link>

      <CardHeader className='space-y-2 p-4'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CardTitle className='line-clamp-2 text-lg'>{title}</CardTitle>
            </TooltipTrigger>
            <TooltipContent>
              <p> {title.slice(0, 7) + '...'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <p className='text-sm text-muted-foreground'>
          Sold by {user.email.split('@')[0]}
        </p>
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
