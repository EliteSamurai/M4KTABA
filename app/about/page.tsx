import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Book, ShieldCheck, Users, Store, ArrowRight } from 'lucide-react';
import IslamicBooks from '@/public/books.jpg'; // TODO: Convert to WebP

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function About() {
  return (
    <>
      <Head>
        <title>About M4KTABA - Buy & Sell Arabic-Islamic Books Online</title>
        <meta
          name='description'
          content='M4KTABA is the ultimate online marketplace for Arabic-Islamic books. Buy, sell, and discover rare Islamic literature easily.'
        />
      </Head>

      <main className='min-h-screen'>
        {/* Hero Section */}
        <div className='relative'>
          <div className='absolute inset-0 z-0'>
            <Image
              src={IslamicBooks || '/placeholder.svg'}
              alt='Islamic Books Collection'
              className='object-cover object-center brightness-[0.25]'
              priority
              fill
            />
          </div>
          <div className='relative z-10 mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8'>
            <h1 className='bg-gradient-to-r from-white to-gray-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl lg:text-6xl'>
              About M4KTABA
            </h1>
            <p className='mx-auto mt-6 max-w-2xl text-lg font-medium text-gray-300'>
              Your trusted marketplace for Arabic-Islamic literature, connecting
              scholars, collectors, and knowledge seekers worldwide.
            </p>
          </div>
          <div className='absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent' />
        </div>

        {/* Main Content */}
        <div className='mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8'>
          {/* Mission Statement */}
          <div className='prose prose-gray mx-auto max-w-3xl dark:prose-invert'>
            <p className='lead text-xl text-muted-foreground'>
              Welcome to <strong>M4KTABA</strong>, the dedicated marketplace for
              <strong> Arabic-Islamic books</strong>. Our platform connects
              sellers and buyers, making it easier than ever to find rare and
              valuable Islamic literature from around the world.
            </p>
          </div>

          <Separator className='my-16' />

          {/* Features Grid */}
          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: 'Specialized Collection',
                description:
                  'Focused exclusively on Arabic and Islamic literature, ensuring quality and authenticity.',
                icon: Book,
              },
              {
                title: 'Secure Transactions',
                description:
                  'Safe and protected buying & selling process with buyer protection.',
                icon: ShieldCheck,
              },

              {
                title: 'Community First',
                description:
                  'A growing community of scholars, collectors, and knowledge seekers.',
                icon: Users,
              },
              {
                title: 'Seller Support',
                description:
                  'Comprehensive support for independent sellers and bookstores.',
                icon: Store,
              },
            ].map((feature, index) => (
              <Card key={index} className='transition-all hover:shadow-lg'>
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

          {/* CTA Sections */}
          <div className='mt-16 grid gap-8 sm:grid-cols-2'>
            {/* Seller CTA */}
            <Card className='relative overflow-hidden'>
              <CardHeader>
                <CardTitle className='text-2xl'>Start Selling Today</CardTitle>
                <CardDescription>
                  List your Islamic books and reach thousands of interested
                  buyers worldwide.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size='lg' className='mt-4 bg-purple-600'>
                  <Link href='/sell'>
                    Start Selling
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Join CTA */}
            <Card className='relative overflow-hidden'>
              <CardHeader>
                <CardTitle className='text-2xl'>Join Our Community</CardTitle>
                <CardDescription>
                  Connect with fellow scholars, collectors, and enthusiasts of
                  Islamic literature.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size='lg' className='mt-4' variant='secondary'>
                  <Link href='/signup'>
                    Join Now
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
