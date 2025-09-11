'use client';

import React from 'react';
import { CheckCircle, X, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SuccessToastProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    external?: boolean;
  };
  onClose?: () => void;
  variant?: 'default' | 'success' | 'info' | 'warning';
  className?: string;
  autoClose?: boolean;
  duration?: number;
}

export function SuccessToast({
  title,
  description,
  action,
  onClose,
  variant = 'success',
  className,
  autoClose = true,
  duration = 5000,
}: SuccessToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const variantStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  const iconStyles = {
    default: 'text-gray-600',
    success: 'text-green-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
  };

  if (!isVisible) return null;

  return (
    <Card
      className={cn(
        'w-full max-w-sm shadow-lg border-l-4 border-l-green-500',
        variantStyles[variant],
        className
      )}
    >
      <CardContent className='p-4'>
        <div className='flex items-start gap-3'>
          <CheckCircle
            className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconStyles[variant])}
          />
          <div className='flex-1 min-w-0'>
            <h4 className='text-sm font-semibold text-gray-900'>{title}</h4>
            {description && (
              <p className='text-sm text-gray-600 mt-1'>{description}</p>
            )}
            {action && (
              <div className='mt-3'>
                <Button
                  size='sm'
                  onClick={action.onClick}
                  className='h-8 text-xs'
                  variant={variant === 'success' ? 'default' : 'outline'}
                >
                  {action.label}
                  {action.external ? (
                    <ExternalLink className='ml-1 h-3 w-3' />
                  ) : (
                    <ArrowRight className='ml-1 h-3 w-3' />
                  )}
                </Button>
              </div>
            )}
          </div>
          {onClose && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='h-6 w-6 p-0 text-gray-400 hover:text-gray-600'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
    external?: boolean;
  }>;
  className?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  description,
  actions,
  className,
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='fixed inset-0 bg-black/50' onClick={onClose} />
      <Card className={cn('relative z-10 w-full max-w-md', className)}>
        <CardContent className='p-6 text-center'>
          <div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4'>
            <CheckCircle className='w-8 h-8 text-green-600' />
          </div>
          <h3 className='text-xl font-semibold text-gray-900 mb-2'>{title}</h3>
          {description && <p className='text-gray-600 mb-6'>{description}</p>}
          {actions && actions.length > 0 && (
            <div className='flex flex-col gap-2'>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant || 'default'}
                  className='w-full'
                >
                  {action.label}
                  {action.external && <ExternalLink className='ml-2 h-4 w-4' />}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ProgressToastProps {
  title: string;
  description?: string;
  progress: number;
  onComplete?: () => void;
  className?: string;
}

export function ProgressToast({
  title,
  description,
  progress,
  onComplete,
  className,
}: ProgressToastProps) {
  React.useEffect(() => {
    if (progress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <Card
      className={cn(
        'w-full max-w-sm shadow-lg border-l-4 border-l-blue-500 bg-blue-50 border-blue-200',
        className
      )}
    >
      <CardContent className='p-4'>
        <div className='flex items-start gap-3'>
          <div className='w-5 h-5 mt-0.5 flex-shrink-0'>
            {progress >= 100 ? (
              <CheckCircle className='w-5 h-5 text-green-600' />
            ) : (
              <div className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <h4 className='text-sm font-semibold text-gray-900'>{title}</h4>
            {description && (
              <p className='text-sm text-gray-600 mt-1'>{description}</p>
            )}
            <div className='mt-3'>
              <div className='flex justify-between text-xs text-gray-600 mb-1'>
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AchievementToastProps {
  title: string;
  description: string;
  achievement: string;
  onClose?: () => void;
  className?: string;
}

export function AchievementToast({
  title,
  description,
  achievement,
  onClose,
  className,
}: AchievementToastProps) {
  return (
    <Card
      className={cn(
        'w-full max-w-sm shadow-lg border-l-4 border-l-yellow-500 bg-yellow-50 border-yellow-200',
        className
      )}
    >
      <CardContent className='p-4'>
        <div className='flex items-start gap-3'>
          <div className='w-5 h-5 mt-0.5 flex-shrink-0'>
            <div className='w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center'>
              <span className='text-xs font-bold text-yellow-600'>🏆</span>
            </div>
          </div>
          <div className='flex-1 min-w-0'>
            <h4 className='text-sm font-semibold text-gray-900'>{title}</h4>
            <p className='text-sm text-gray-600 mt-1'>{description}</p>
            <div className='mt-2'>
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                {achievement}
              </span>
            </div>
          </div>
          {onClose && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='h-6 w-6 p-0 text-gray-400 hover:text-gray-600'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SuccessToast;
