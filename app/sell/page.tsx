import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/options';
import Link from 'next/link';
import {
  BookOpen,
  DollarSign,
  Camera,
  CheckCircle,
  Banknote,
  Clock,
  ArrowRight,
} from 'lucide-react';
import SellingProcessWrapper from '@/components/SellingProcessWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const howItWorks = [
  {
    step: 1,
    icon: BookOpen,
    title: 'List your books',
    description: 'Add a title, upload clear photos, set your price and pick a category. Takes under 3 minutes.',
  },
  {
    step: 2,
    icon: Camera,
    title: 'Publish your listings',
    description: 'Review everything, hit publish, and your books appear in front of thousands of Islamic-book buyers.',
  },
  {
    step: 3,
    icon: DollarSign,
    title: 'Get paid instantly',
    description: 'Buyers pay through Stripe. Funds go straight to your bank account, we never hold your money.',
  },
  {
    step: 4,
    icon: CheckCircle,
    title: 'Ship with confidence',
    description: 'Print your shipping label, pack the book, and we track it end-to-end. We’re here if anything comes up.',
  },
];

export default async function SellPage() {
  const session = await getServerSession(authOptions);

  // Logged-in sellers go straight to the listing flow.
  if (session) {
    return (
      <div className='container mx-auto min-h-screen py-8 md:py-12'>
        <div className='space-y-8'>
          <div className='text-center space-y-4'>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
              Sell Your Books
            </h1>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
              List your Arabic-Islamic books in minutes. Zero platform fees, keep 100% of your asking price.
            </p>
          </div>
          <SellingProcessWrapper />
        </div>
      </div>
    );
  }

  // Logged-out visitors see the marketing/info landing page first.
  return (
    <div className='flex min-h-screen flex-col'>
      {/* Hero */}
      <section className='bg-gradient-to-b from-purple-50 to-white dark:from-slate-900/40 dark:to-background'>
        <div className='container mx-auto px-4 py-16 sm:py-24 md:py-28'>
          <div className='mx-auto grid items-center gap-10 lg:grid-cols-2 lg:max-w-6xl'>
            <div className='space-y-6'>
              <div className='inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 px-3 py-1 text-sm font-medium shadow-sm ring-1 ring-purple-200 dark:ring-purple-900/40'>
                <Banknote className='h-4 w-4 text-purple-600' />
                Zero platform fees
              </div>
              <h1 className='text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl'>
                Sell your Islamic books. Keep 100% of the price.
              </h1>
              <p className='text-lg text-slate-600 dark:text-slate-300'>
                M4KTABA connects independent sellers of Arabic-Islamic literature with a global community of readers. No listing fees, no final-value fees, you set the price and keep it. Only Stripe payment processing applies.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 pt-2'>
                <Button size='lg' className='bg-purple-600 text-white hover:bg-purple-700' asChild>
                  <Link href='/signup' className='group'>
                    Start Selling
                    <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5' />
                  </Link>
                </Button>
                <Button size='lg' variant='outline' asChild>
                  <Link href='/all'>Browse buyers market</Link>
                </Button>
              </div>
              <p className='text-xs text-muted-foreground'>
                Already have an account?{' '}
                <Link href='/login?callbackUrl=/sell' className='font-medium text-foreground underline-offset-4 hover:underline'>
                  Sign in to list a book
                </Link>
                .
              </p>
            </div>
            <div className='rounded-xl border bg-white dark:bg-slate-900 p-6 shadow-lg'>
              <div className='flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground'>
                <Clock className='h-4 w-4' />
                Payout timing
              </div>
              <p className='text-sm text-muted-foreground'>
                You receive funds within 2-3 business days after the buyer pays, deposited directly into your bank account via Stripe.
              </p>
              <div className='my-6 border-t border-dashed' />
              <h3 className='text-sm font-semibold text-muted-foreground'>
                What you keep on a $20 book
              </h3>
              <div className='mt-3 space-y-2 text-sm'>
                <div className='flex justify-between'><span>Sale price</span><span>$20.00</span></div>
                <div className='flex justify-between'><span>M4KTABA platform fee</span><span className='text-green-600'>$0.00</span></div>
                <div className='flex justify-between'><span>Stripe processing (2.9% + $0.30)</span><span>-$0.88</span></div>
                <div className='flex justify-between font-semibold'><span>You receive</span><span className='text-purple-700'>$19.12</span></div>
              </div>
              <p className='mt-4 text-xs text-muted-foreground'>
                Compare to marketplaces that take 15-20% + fees. We pass the savings back to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className='py-16 md:py-20'>
        <div className='container mx-auto px-4'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl font-bold tracking-tight'>How it works</h2>
            <p className='text-muted-foreground max-w-xl mx-auto'>
              From library to listing to payout — four simple steps, whether you are selling a single book or your whole collection.
            </p>
          </div>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {howItWorks.map((step) => (
              <Card key={step.step} className='text-center'>
                <CardHeader className='pb-4'>
                  <Badge className='mx-auto mb-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700'>
                    {step.step}
                  </Badge>
                  <div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2'>
                    <step.icon className='w-6 h-6 text-primary' />
                  </div>
                  <CardTitle className='text-lg'>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className='py-16 md:py-20'>
        <div className='container mx-auto px-4 text-center'>
          <h2 className='text-3xl font-bold tracking-tight'>
            Ready to start selling?
          </h2>
          <p className='mx-auto mt-3 max-w-xl text-muted-foreground'>
            Join thousands of sellers already turning their book collections into income. No fees to list, no fees to sell.
          </p>
          <div className='mt-8 flex justify-center'>
            <Button size='lg' className='bg-purple-600 text-white hover:bg-purple-700' asChild>
              <Link href='/signup'>Start Selling — It&apos;s Free</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
