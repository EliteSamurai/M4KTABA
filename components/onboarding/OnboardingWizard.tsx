'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Users,
  Shield,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
  optional?: boolean;
}

interface OnboardingWizardProps {
  onComplete?: () => void;
  onSkip?: () => void;
  showProgress?: boolean;
  className?: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to M4ktaba',
    description: 'Your journey to discovering Islamic literature starts here',
    icon: BookOpen,
    content: (
      <div className='space-y-4 text-center'>
        <div className='mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center'>
          <BookOpen className='w-8 h-8 text-purple-600' />
        </div>
        <h3 className='text-xl font-semibold'>Welcome to M4ktaba!</h3>
        <p className='text-muted-foreground'>
          We&apos;re excited to have you join our community of book lovers. Let&apos;s get
          you started with a quick tour.
        </p>
        <div className='flex flex-wrap gap-2 justify-center'>
          <Badge variant='secondary'>1000+ Books</Badge>
          <Badge variant='secondary'>Secure Payments</Badge>
          <Badge variant='secondary'>Fast Shipping</Badge>
        </div>
      </div>
    ),
  },
  {
    id: 'discover',
    title: 'Discover Books',
    description: 'Browse our collection of Islamic literature',
    icon: BookOpen,
    content: (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Find Your Next Read</h3>
        <ul className='space-y-2 text-sm text-muted-foreground'>
          <li className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4 text-green-500' />
            Browse by category or search for specific topics
          </li>
          <li className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4 text-green-500' />
            Read detailed descriptions and reviews
          </li>
          <li className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4 text-green-500' />
            Compare prices from different sellers
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'sell',
    title: 'Sell Your Books',
    description: 'Turn your books into cash',
    icon: Users,
    content: (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Start Selling Today</h3>
        <ul className='space-y-2 text-sm text-muted-foreground'>
          <li className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4 text-green-500' />
            List books in minutes with our easy upload process
          </li>
          <li className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4 text-green-500' />
            Set your own prices and manage your inventory
          </li>
          <li className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4 text-green-500' />
            Get paid securely through our platform
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'trust',
    title: 'Safe & Secure',
    description: 'Your security is our priority',
    icon: Shield,
    content: (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Shop with Confidence</h3>
        <div className='grid grid-cols-2 gap-4'>
          <div className='text-center p-3 bg-green-50 rounded-lg'>
            <Shield className='w-6 h-6 text-green-600 mx-auto mb-2' />
            <p className='text-sm font-medium'>Secure Payments</p>
          </div>
          <div className='text-center p-3 bg-blue-50 rounded-lg'>
            <Star className='w-6 h-6 text-blue-600 mx-auto mb-2' />
            <p className='text-sm font-medium'>Verified Sellers</p>
          </div>
        </div>
        <p className='text-sm text-muted-foreground text-center'>
          All transactions are protected by our secure payment system and seller
          verification process.
        </p>
      </div>
    ),
  },
];

export function OnboardingWizard({
  onComplete,
  onSkip,
  showProgress = true,
  className,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setCompletedSteps] = useState<Set<number>>(new Set());
  const router = useRouter();

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      router.push('/');
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.push('/');
    }
  };

  const handleSkipToEnd = () => {
    setCurrentStep(steps.length - 1);
  };

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      <Card>
        <CardHeader className='text-center'>
          <div className='flex items-center justify-center mb-4'>
            <currentStepData.icon className='w-8 h-8 text-purple-600' />
          </div>
          <CardTitle className='text-2xl'>{currentStepData.title}</CardTitle>
          <CardDescription className='text-base'>
            {currentStepData.description}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          {showProgress && (
            <div className='space-y-2'>
              <div className='flex justify-between text-sm text-muted-foreground'>
                <span>
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className='h-2' />
            </div>
          )}

          <div className='min-h-[200px] flex items-center justify-center'>
            {currentStepData.content}
          </div>

          <div className='flex justify-between items-center pt-4'>
            <div className='flex gap-2'>
              {currentStep > 0 && (
                <Button
                  variant='outline'
                  onClick={handlePrevious}
                  className='flex items-center gap-2'
                >
                  <ArrowLeft className='w-4 h-4' />
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button
                  variant='ghost'
                  onClick={handleSkipToEnd}
                  className='text-muted-foreground'
                >
                  Skip to end
                </Button>
              )}
            </div>

            <div className='flex gap-2'>
              {currentStep < steps.length - 1 && (
                <Button variant='outline' onClick={handleSkip}>
                  Skip tour
                </Button>
              )}
              <Button
                onClick={handleNext}
                className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700'
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OnboardingWizard;
