'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'review';

interface CheckoutProgressProps {
  currentStep: CheckoutStep;
  className?: string;
}

const steps: Array<{
  id: CheckoutStep;
  label: string;
  number: number;
}> = [
  { id: 'cart', label: 'Cart', number: 1 },
  { id: 'shipping', label: 'Shipping', number: 2 },
  { id: 'payment', label: 'Payment', number: 3 },
  { id: 'review', label: 'Review', number: 4 },
];

export function CheckoutProgress({
  currentStep,
  className,
}: CheckoutProgressProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className={cn('w-full py-6', className)}>
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center justify-between">
          {steps.map((step, stepIdx) => {
            const isCompleted = stepIdx < currentStepIndex;
            const isCurrent = stepIdx === currentStepIndex;
            const isUpcoming = stepIdx > currentStepIndex;

            return (
              <li
                key={step.id}
                className={cn(
                  'relative flex-1',
                  stepIdx !== steps.length - 1 && 'pr-4 sm:pr-8'
                )}
              >
                {/* Progress Line */}
                {stepIdx !== steps.length - 1 && (
                  <div
                    className="absolute top-4 left-0 right-0 h-0.5 -mr-4 sm:-mr-8"
                    aria-hidden="true"
                  >
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        isCompleted ? 'bg-primary' : 'bg-gray-200'
                      )}
                    />
                  </div>
                )}

                {/* Step Content */}
                <div className="relative flex flex-col items-center group">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200',
                      isCompleted &&
                        'bg-primary text-primary-foreground ring-4 ring-primary/20',
                      isCurrent &&
                        'bg-primary text-primary-foreground ring-4 ring-primary/30 scale-110',
                      isUpcoming && 'bg-gray-200 text-gray-500'
                    )}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium transition-colors duration-200',
                      isCompleted && 'text-primary',
                      isCurrent && 'text-primary font-semibold',
                      isUpcoming && 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </span>

                  {/* Screen Reader Status */}
                  {isCurrent && (
                    <span className="sr-only">(Current Step)</span>
                  )}
                  {isCompleted && (
                    <span className="sr-only">(Completed)</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

