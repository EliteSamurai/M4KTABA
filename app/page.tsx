import Image from 'next/image';
import Link from 'next/link';
import {
  Book,
  Truck,
  BookOpen,
  BadgeDollarSign,
  ArrowRight,
} from 'lucide-react';
import HeroImageDesktop from '@/public/hero-books-desktop.webp';
import HeroImageTablet from '@/public/hero-books-tablet.webp';
import HeroImageMobile from '@/public/hero-books-mobile.webp';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BookProductCard from '@/components/ProductCard';
import { Book as BookType } from '@/types/shipping-types';
import ModalWrapper from '@/components/ModalWrapper';
import { TrustBadges } from '@/components/trust/TrustBadges';
import { UserReviews } from '@/components/trust/UserReviews';

async function fetchLatestBooks() {
  const query = `*[_type == "book" && quantity > 0] | order(_createdAt desc) [0...5] {
    _id,
    title,
    price,
    _createdAt,
    user->{
      _id,
      email,
      location,
      stripeAccountId
    },
    "image": photos[0].asset->url
  }`;

  const endpoint =
    'https://32kxkt38.api.sanity.io/v2025-02-19/data/query/blog-m4ktaba';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    next: { revalidate: 60 }, // Cache for 60 seconds to improve TTFB
  });

  if (!response.ok) {
    throw new Error('Failed to fetch latest books');
  }

  const { result } = await response.json();

  // Sort again on the client side to ensure correct ordering
  return result
    .sort(
      (a: BookType, b: BookType) =>
        new Date(b._createdAt ?? '').getTime() -
        new Date(a._createdAt ?? '').getTime()
    )
    .slice(0, 5);
}

export default async function Home() {
  const latestBooks = await fetchLatestBooks();

  return (
    <div className='min-h-screen'>
      <ModalWrapper />

      {/* Hero Section */}
      <div className='relative flex min-h-[70vh] items-center justify-center overflow-hidden'>
        <picture>
          <source 
            media="(max-width: 768px)" 
            srcSet={HeroImageMobile.src}
            type="image/webp"
            width={768}
            height={576}
          />
          <source 
            media="(max-width: 1200px)" 
            srcSet={HeroImageTablet.src}
            type="image/webp"
            width={1200}
            height={900}
          />
          <Image
            src={HeroImageDesktop}
            alt='Buying & Selling Books - Islamic Arabic Books Marketplace'
            priority
            fill
            sizes="100vw"
            className='absolute top-0 left-0 w-screen h-full object-cover'
            quality={85}
          />
        </picture>

        {/* Content */}
        <div className='relative z-10 mx-auto max-w-4xl px-4 text-center'>
          <h1 className='bg-gradient-to-r from-white to-gray-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl'>
            The Global Marketplace for Arabic-Islamic Books
          </h1>
          <p className='mx-auto mt-6 max-w-2xl text-lg text-gray-300'>
            Buy and sell authentic Islamic literature from sellers worldwide. No platform fees, fair shipping, instant payouts.
          </p>
          <div className='mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center'>
            <Button size='lg' className='hover:bg-primary/90' asChild>
              <Link href='/all'>
                Browse Collection
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </Button>
            <Button size='lg' variant='outline' asChild>
              <Link href='/sell'>Start Selling</Link>
            </Button>
          </div>
          <div className='mt-8'>
            <TrustBadges variant='compact' />
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className='absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent' />
      </div>

      {/* Features Section */}
      <section className='relative z-20 -mt-4 md:-mt-8 px-4 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              {
                title: '100% to Sellers, Zero Fees',
                description:
                  'No platform fees. Sellers keep 100% of the sale price. Only payment processing applies.',
                icon: BadgeDollarSign,
              },
              {
                title: 'Smart Shipping Worldwide',
                description:
                  'Fair distance-based rates starting at $3.99. Free shipping on orders $35+.',
                icon: Truck,
              },
              {
                title: 'Authentic Islamic Literature',
                description:
                  'Browse hundreds of Arabic books on Quran, Hadith, Fiqh, and more from trusted sellers.',
                icon: BookOpen,
              },
              {
                title: 'Sell & Earn Instantly',
                description:
                  'List your books in minutes. Get paid directly via Stripe. Keep 100% of your asking price.',
                icon: Book,
              },
            ].map((feature, index) => (
              <Card key={index} className='border-none shadow-lg '>
                <CardHeader>
                  <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10'>
                    <feature.icon className='h-6 w-6 text-primary' />
                  </div>
                  <CardTitle className='text-xl'>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className='text-base'>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Books Section */}
      <section className='py-16 sm:py-24'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <h2 className='text-3xl font-bold tracking-tight'>
                Latest Books
              </h2>
              <p className='text-muted-foreground'>
                Discover our most recent additions to the collection
              </p>
            </div>
            <Button variant='outline' asChild>
              <Link href='/all'>
                View all
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </Button>
          </div>

          <Separator className='my-8' />

          {latestBooks.length > 0 ? (
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
              {latestBooks.map((book: BookType) => (
                <BookProductCard
                  key={book._id}
                  id={book._id}
                  title={book.title}
                  user={book.user || 'Unknown'}
                  price={book.price || 0}
                  image={book.image || '/placeholder.svg'}
                  loading={false}
                />
              ))}
            </div>
          ) : (
            <div className='flex min-h-[200px] items-center justify-center rounded-lg border border-dashed'>
              <p className='text-center text-muted-foreground'>
                No books found.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Trust & Reviews Section */}
      <section className='py-16 bg-muted/50'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
            <div>
              <h2 className='text-3xl font-bold tracking-tight mb-6'>
                Why Trust M4ktaba?
              </h2>
              <TrustBadges variant='detailed' />
            </div>
            <div>
              <h2 className='text-3xl font-bold tracking-tight mb-6'>
                What Our Users Say
              </h2>
              <UserReviews variant='grid' maxReviews={3} reviews={[]} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
