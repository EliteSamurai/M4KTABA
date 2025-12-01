import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { BookOpen, DollarSign, Camera, CheckCircle } from 'lucide-react';
import SellingProcessWrapper from '@/components/SellingProcessWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: BookOpen,
    title: 'Easy Listing',
    description: 'Simple step-by-step process to list your books',
  },
  {
    icon: DollarSign,
    title: 'No Platform Fees',
    description:
      'Keep 100% of your sale price - we only charge payment processing',
  },
  {
    icon: Camera,
    title: 'Photo Upload',
    description: "Add multiple photos to showcase your book's condition",
  },
  {
    icon: CheckCircle,
    title: 'Quality Control',
    description: 'Review everything before publishing your listing',
  },
];

export default async function SellPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className='container mx-auto min-h-screen py-8 md:py-12'>
      <div className='space-y-8'>
        {/* Header */}
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
            Sell Your Books
          </h1>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            List your Arabic-Islamic books in minutes. Zero platform fees - keep 100% of your asking price.
            Get paid instantly via Stripe to your bank account.
          </p>
        </div>

        {/* Features */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {features.map((feature, index) => (
            <Card key={index} className='text-center'>
              <CardHeader className='pb-4'>
                <div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2'>
                  <feature.icon className='w-6 h-6 text-primary' />
                </div>
                <CardTitle className='text-lg'>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selling Process */}
        <SellingProcessWrapper />
      </div>
    </div>
  );
}
