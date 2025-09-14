'use client';

import {
  Truck,
  Clock,
  HelpCircle,
  Package,
  AlertCircle,
  DollarSign,
  Mail,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineDot,
  TimelineSeparator,
  TimelineConnector,
} from '@/components/ui/timeline';
import { useSupport } from '@/contexts/support-context';

const ShippingInfo = () => {
  const { openSupport } = useSupport();

  const shippingSteps = [
    {
      title: 'Order Placed',
      description: 'Seller is immediately notified of your purchase',
      icon: Package,
    },
    {
      title: 'Preparation',
      description: 'Seller packages your book(s) securely',
      icon: Package,
    },
    {
      title: 'Shipping',
      description: 'Order must be shipped within 4 days of purchase',
      icon: Truck,
    },
    {
      title: 'Tracking',
      description: "You'll receive tracking information via email",
      icon: Clock,
    },
  ];

  const faqs = [
    {
      question: 'How long does shipping take?',
      answer:
        "Shipping times vary depending on the seller's location and shipping method. You will receive an estimated delivery date when the seller provides tracking information.",
      icon: Clock,
    },
    {
      question: "What if the seller doesn't ship my order?",
      answer:
        'If the seller fails to ship within 4 days, please contact our support team. We will follow up with the seller or issue a refund if necessary.',
      icon: AlertCircle,
    },
    {
      question: 'Who covers the shipping cost?',
      answer:
        'Shipping costs are set by each seller and will be displayed at checkout. The total price you see includes shipping.',
      icon: DollarSign,
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50/50 to-white py-12'>
      <div className='container mx-auto max-w-4xl px-4'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <div className='mb-4 flex justify-center'>
            <div className='rounded-full bg-primary/10 p-3'>
              <Truck className='h-6 w-6 text-primary' />
            </div>
          </div>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            Shipping Information
          </h1>
          <p className='mt-4 text-lg text-muted-foreground'>
            Learn how shipping works at M4KTABA.
          </p>
        </div>

        {/* Process Timeline */}
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              Our streamlined shipping process ensures a smooth experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline>
              {shippingSteps.map((step, index) => (
                <TimelineItem key={index}>
                  <TimelineSeparator>
                    <TimelineDot>
                      <step.icon className='h-4 w-4' />
                    </TimelineDot>
                    {index < shippingSteps.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <h3 className='font-semibold'>{step.title}</h3>
                    <p className='text-sm text-muted-foreground'>
                      {step.description}
                    </p>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <HelpCircle className='h-5 w-5' />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type='single' collapsible>
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className='text-left'>
                    <div className='flex items-center gap-2'>
                      <faq.icon className='h-4 w-4 text-muted-foreground' />
                      {faq.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className='text-muted-foreground'>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Support Card */}
        <Card className='mt-8 border-primary/10 bg-primary/5'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Mail className='h-5 w-5' />
              Need More Help?
            </CardTitle>
            <CardDescription>
              Our support team is here to assist you with any questions about
              shipping.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant='secondary' onClick={openSupport}>
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShippingInfo;
