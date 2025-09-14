import Head from 'next/head';
import { ScrollText, Mail } from 'lucide-react';
import Link from 'next/link';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function TermsPage() {
  const terms = [
    {
      title: 'User Agreement',
      content:
        'By accessing M4KTABA, you confirm that you are at least 18 years old or have parental permission to use our website.',
    },
    {
      title: 'Selling & Buying Books',
      content:
        'Sellers are responsible for ensuring that their books are accurately described. Buyers must review all details before purchasing. M4KTABA does not handle transactions directly.',
    },
    {
      title: 'Content Policy',
      content:
        'Any content uploaded must be lawful and respect Islamic values. We reserve the right to remove inappropriate listings.',
    },
    {
      title: 'Privacy & Data Protection',
      content:
        'We value your privacy. Personal data is used solely for platform functionality and never shared without consent.',
    },
    {
      title: 'Liability Disclaimer',
      content:
        'M4KTABA is a marketplace and does not guarantee book quality or transactions. Users engage at their own risk.',
    },
    {
      title: 'Amendments',
      content:
        'We reserve the right to modify these terms at any time. Continued use of the platform implies acceptance of updates.',
    },
  ];

  return (
    <>
      <Head>
        <title>Terms & Conditions | M4KTABA</title>
        <meta
          name='description'
          content='Read the terms and conditions for using M4KTABA, the marketplace for buying and selling Arabic-Islamic books.'
        />
      </Head>

      <main className='min-h-screen bg-gradient-to-b from-gray-50/50 to-white'>
        {/* Header Section */}
        <div className='border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60'>
          <div className='container py-8 mx-auto'>
            <div className='mx-auto max-w-4xl text-center'>
              <div className='mb-4 flex justify-center'>
                <div className='rounded-full bg-primary/10 p-3'>
                  <ScrollText className='h-6 w-6 text-primary' />
                </div>
              </div>
              <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
                Terms & Conditions
              </h1>
              <p className='mt-4 text-lg text-muted-foreground'>
                Please read these terms carefully before using M4KTABA.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='container py-8 mx-auto'>
          <div className='mx-auto max-w-4xl space-y-8'>
            {/* Introduction Card */}
            <Card>
              <CardHeader>
                <CardTitle>Welcome to M4KTABA!</CardTitle>
                <CardDescription>
                  By using our platform, you agree to the following terms and
                  conditions.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Terms Accordion */}
            <Accordion type='single' collapsible className='w-full'>
              {terms.map((term, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className='text-lg font-semibold'>
                    {index + 1}. {term.title}
                  </AccordionTrigger>
                  <AccordionContent className='text-muted-foreground'>
                    {term.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Contact Card */}
            <Card className='border-primary/10 bg-primary/5'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Mail className='h-5 w-5' />
                  Need Help?
                </CardTitle>
                <CardDescription>
                  If you have any questions about these terms, please don't
                  hesitate to contact us.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant='secondary'>
                  <Link href='mailto:support@m4ktaba.com'>Contact Support</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Last Updated */}
            <p className='text-center text-sm text-muted-foreground'>
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
