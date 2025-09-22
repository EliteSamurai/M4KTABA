'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  Camera,
  DollarSign,
  BookOpen,
  CheckCircle,
  X,
  ArrowRight,
} from 'lucide-react';

interface Tip {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'photos' | 'pricing' | 'description' | 'general';
}

const tips: Tip[] = [
  {
    id: 'photo-quality',
    title: 'Take Great Photos',
    description:
      'Use good lighting and take clear photos of the front cover, back cover, and any damage. Good photos attract more buyers.',
    icon: Camera,
    category: 'photos',
  },
  {
    id: 'price-competitively',
    title: 'Price Competitively',
    description:
      'Check similar listings and price your book competitively. Consider the condition and rarity of your book.',
    icon: DollarSign,
    category: 'pricing',
  },
  {
    id: 'detailed-description',
    title: 'Write a Detailed Description',
    description:
      "Include information about the book's condition, any highlights or notes, and why someone would want to buy it.",
    icon: BookOpen,
    category: 'description',
  },
  {
    id: 'honest-condition',
    title: 'Be Honest About Condition',
    description:
      'Accurately describe any wear, damage, or markings. Buyers appreciate honesty and it prevents returns.',
    icon: CheckCircle,
    category: 'general',
  },
];

interface FirstTimeSellerTipsProps {
  onDismiss: () => void;
  className?: string;
}

export default function FirstTimeSellerTips({
  onDismiss,
  className,
}: FirstTimeSellerTipsProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);

  useEffect(() => {
    // Check if tips have been dismissed before
    const dismissed = localStorage.getItem('m4ktaba:dismissed-tips');
    if (dismissed) {
      try {
        setDismissedTips(JSON.parse(dismissed));
      } catch (error) {
        console.error('Error parsing dismissed tips:', error);
      }
    }
  }, []);

  const handleDismissTip = (tipId: string) => {
    const newDismissed = [...dismissedTips, tipId];
    setDismissedTips(newDismissed);
    localStorage.setItem(
      'm4ktaba:dismissed-tips',
      JSON.stringify(newDismissed)
    );

    // Move to next tip or dismiss all
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    } else {
      onDismiss();
    }
  };

  const handleDismissAll = () => {
    const allTipIds = tips.map(tip => tip.id);
    setDismissedTips(allTipIds);
    localStorage.setItem('m4ktaba:dismissed-tips', JSON.stringify(allTipIds));
    onDismiss();
  };

  const handleNext = () => {
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    } else {
      onDismiss();
    }
  };

  const handlePrevious = () => {
    if (currentTipIndex > 0) {
      setCurrentTipIndex(currentTipIndex - 1);
    }
  };

  const currentTip = tips[currentTipIndex];
  const progress = ((currentTipIndex + 1) / tips.length) * 100;

  if (dismissedTips.length >= tips.length) {
    return null;
  }

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Lightbulb className='w-5 h-5 text-primary' />
            First-Time Seller Tips
          </CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleDismissAll}
            className='h-8 w-8 p-0'
            aria-label='Dismiss All'
          >
            <X className='w-4 h-4' />
          </Button>
        </div>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <span>
            Tip {currentTipIndex + 1} of {tips.length}
          </span>
          <Badge variant='outline' className='text-xs'>
            {currentTip.category}
          </Badge>
        </div>
        <div className='w-full bg-muted rounded-full h-2'>
          <div
            className='bg-primary h-2 rounded-full transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='flex items-start gap-4'>
          <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0'>
            <currentTip.icon className='w-6 h-6 text-primary' />
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='font-semibold mb-2'>{currentTip.title}</h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              {currentTip.description}
            </p>
          </div>
        </div>

        <Alert>
          <AlertDescription className='text-xs'>
            <div className='space-y-1'>
              <p className='font-medium'>Pro Tip:</p>
              <p>
                {currentTip.category === 'photos' &&
                  'Good photos can increase your chances of selling by 40%!'}
                {currentTip.category === 'pricing' &&
                  'Books priced within 10% of market value sell 3x faster.'}
                {currentTip.category === 'description' &&
                  'Detailed descriptions reduce buyer questions by 60%.'}
                {currentTip.category === 'general' &&
                  'Honest descriptions lead to better reviews and repeat buyers.'}
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className='flex justify-between'>
          <Button
            variant='outline'
            size='sm'
            onClick={handlePrevious}
            disabled={currentTipIndex === 0}
          >
            Previous
          </Button>

          <div className='flex gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleDismissTip(currentTip.id)}
            >
              Skip
            </Button>
            <Button size='sm' onClick={handleNext}>
              {currentTipIndex === tips.length - 1 ? 'Got it!' : 'Next'}
              <ArrowRight className='w-4 h-4 ml-2' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
