'use client';

import { useState, Suspense } from 'react';
import { Check, Loader2, PackageCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

const SkeletonLoader = () => (
  <div className='min-h-[60vh] flex items-center justify-center'>
    <Card className='mx-auto max-w-md animate-pulse'>
      <CardHeader>
        <div className='h-6 w-3/4 bg-gray-200 rounded'></div>
        <div className='mt-2 h-4 w-1/2 bg-gray-200 rounded'></div>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-2'>
          <div className='h-4 w-1/2 bg-gray-200 rounded'></div>
          <div className='flex gap-4'>
            <div className='h-10 w-full bg-gray-200 rounded'></div>
            <div className='h-10 w-full bg-gray-200 rounded'></div>
          </div>
        </div>
        <div className='space-y-4 rounded-lg border p-4'>
          <div className='h-4 w-1/2 bg-gray-200 rounded'></div>
          <div className='h-10 w-full bg-gray-200 rounded'></div>
          <div className='h-3 w-3/4 bg-gray-200 rounded'></div>
        </div>
      </CardContent>
      <CardFooter>
        <div className='h-10 w-full bg-gray-200 rounded'></div>
      </CardFooter>
    </Card>
  </div>
);

export function ConfirmShipmentContent() {
  const [hasShipped, setHasShipped] = useState<boolean | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const itemId = searchParams.get('itemId');

  const handleSubmit = async () => {
    if (!hasShipped) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/confirm-shipment?orderId=${orderId}&itemId=${itemId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingNumber }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast({
          title: 'Shipment Confirmed',
          description: 'The shipment has been confirmed successfully.',
        });
      } else {
        throw new Error(data.error || 'Failed to confirm shipment.');
      }
    } catch (error) {
      console.error('Error confirming shipment:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-[60vh] flex items-center justify-center'>
      <Card className='mx-auto max-w-md'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <PackageCheck className='h-5 w-5' />
            Confirm Shipment
          </CardTitle>
          <CardDescription>
            Please confirm if you have shipped the item and provide tracking
            information if available.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label>Have you shipped the item?</Label>
            <div className='flex gap-4'>
              <Button
                variant={hasShipped === true ? 'default' : 'outline'}
                onClick={() => setHasShipped(true)}
                className='flex-1'
              >
                <Check className='mr-2 h-4 w-4' />
                Yes
              </Button>
              <Button
                variant={hasShipped === false ? 'destructive' : 'outline'}
                onClick={() => setHasShipped(false)}
                className='flex-1'
              >
                <X className='mr-2 h-4 w-4' />
                No
              </Button>
            </div>
          </div>

          {hasShipped && (
            <div className='space-y-4 rounded-lg border p-4'>
              <div className='space-y-2'>
                <Label htmlFor='tracking'>Tracking Number (optional)</Label>
                <Input
                  id='tracking'
                  type='text'
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder='Enter tracking number'
                />
                <p className='text-sm text-muted-foreground'>
                  If available, provide a tracking number for the shipment
                </p>
              </div>
            </div>
          )}
        </CardContent>
        {hasShipped && (
          <CardFooter>
            <Button
              className='w-full'
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {isSubmitting ? 'Confirming...' : 'Confirm Shipment'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function ConfirmShipment() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <ConfirmShipmentContent />
    </Suspense>
  );
}
