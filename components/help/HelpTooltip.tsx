'use client';

import React, { useState } from 'react';
import { HelpCircle, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'detailed' | 'inline';
  className?: string;
  children?: React.ReactNode;
}

export function HelpTooltip({
  content,
  title,
  position = 'top',
  variant = 'default',
  className,
  children,
}: HelpTooltipProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('inline-flex items-center gap-1', className)}>
        {children}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-4 w-4 p-0 text-muted-foreground hover:text-foreground'
              >
                <HelpCircle className='h-3 w-3' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={position}>
              <p className='text-xs max-w-xs'>{content}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('relative', className)}>
        {children}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='absolute -top-2 -right-2 h-6 w-6 p-0 bg-background border shadow-sm'
              >
                <HelpCircle className='h-3 w-3' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={position} className='max-w-sm p-0'>
              <Card className='border-0 shadow-none'>
                {title && (
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm'>{title}</CardTitle>
                  </CardHeader>
                )}
                <CardContent className='pt-0'>
                  <div className='text-xs text-muted-foreground'>{content}</div>
                </CardContent>
              </Card>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Default variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 w-6 p-0 text-muted-foreground hover:text-foreground'
            >
              <HelpCircle className='h-4 w-4' />
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent side={position}>
          <p className='text-xs max-w-xs'>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  className?: string;
}

export function HelpModal({
  isOpen,
  onClose,
  title,
  content,
  className,
}: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='fixed inset-0 bg-black/50' onClick={onClose} />
      <Card
        className={cn(
          'relative z-10 w-full max-w-md max-h-[80vh] overflow-hidden',
          className
        )}
      >
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <CardTitle className='text-lg'>{title}</CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={onClose}
            className='h-6 w-6 p-0'
          >
            <X className='h-4 w-4' />
          </Button>
        </CardHeader>
        <CardContent className='overflow-y-auto'>{content}</CardContent>
      </Card>
    </div>
  );
}

interface HelpSectionProps {
  title: string;
  items: Array<{
    question: string;
    answer: string;
    expanded?: boolean;
  }>;
  className?: string;
}

export function HelpSection({ title, items, className }: HelpSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className='text-lg font-semibold'>{title}</h3>
      <div className='space-y-2'>
        {items.map((item, index) => (
          <Card key={index} className='border'>
            <CardHeader
              className='cursor-pointer hover:bg-muted/50 transition-colors'
              onClick={() => toggleExpanded(index)}
            >
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-medium'>{item.question}</h4>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    expandedItems.has(index) && 'rotate-90'
                  )}
                />
              </div>
            </CardHeader>
            {expandedItems.has(index) && (
              <CardContent className='pt-0'>
                <p className='text-sm text-muted-foreground'>{item.answer}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

interface ContextualHelpProps {
  context: string;
  className?: string;
}

const helpContent: Record<string, { title: string; content: string }> = {
  signup: {
    title: 'Creating Your Account',
    content:
      "Sign up with your email or Google account. You'll need to complete your profile after signing up to start selling books.",
  },
  profile: {
    title: 'Complete Your Profile',
    content:
      'Add your address and bio to help other users trust you. This information is required to sell books on our platform.',
  },
  selling: {
    title: 'How to Sell Books',
    content:
      "Click 'Start Selling' to list your books. Add photos, descriptions, and set your price. We'll handle payments and shipping.",
  },
  buying: {
    title: 'How to Buy Books',
    content:
      'Browse our collection, add books to cart, and checkout securely. All payments are processed through Stripe.',
  },
  shipping: {
    title: 'Shipping Information',
    content:
      'Fair distance-based shipping starts at $3.99 (domestic). Free shipping on orders $35+ (domestic), $50+ (regional), $75+ (international). Sellers ship within 4 days.',
  },
  payments: {
    title: 'Payment Security',
    content:
      'All payments are processed securely through Stripe. We never store your payment information.',
  },
};

export function ContextualHelp({ context, className }: ContextualHelpProps) {
  const help = helpContent[context];

  if (!help) return null;

  return (
    <div
      className={cn(
        'p-3 bg-blue-50 border border-blue-200 rounded-lg',
        className
      )}
    >
      <div className='flex items-start gap-2'>
        <HelpCircle className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
        <div>
          <h4 className='text-sm font-medium text-blue-900'>{help.title}</h4>
          <p className='text-xs text-blue-700 mt-1'>{help.content}</p>
        </div>
      </div>
    </div>
  );
}

export default HelpTooltip;
