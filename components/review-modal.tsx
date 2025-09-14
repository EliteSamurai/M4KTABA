'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string | null;
  rating: number | null;
  setRating: (value: number | null) => void;
  reviewText: string;
  setReviewText: (value: string) => void;
  onSubmit: () => Promise<void>;
}

export function ReviewModal({
  isOpen,
  onClose,
  rating,
  setRating,
  reviewText,
  setReviewText,
  onSubmit,
}: ReviewModalProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit();
      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback!',
      });
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            Share your experience with this seller. Your feedback helps others
            make informed decisions.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='flex items-center justify-center space-x-1'>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type='button'
                className='focus:outline-none'
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(null)}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    (
                      hoveredRating !== null
                        ? star <= hoveredRating
                        : star <= (rating || 0)
                    )
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
                <span className='sr-only'>Rate {star} stars</span>
              </button>
            ))}
          </div>
          <div className='grid gap-2'>
            <Textarea
              placeholder='Write your review here...'
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              className='min-h-[100px] resize-none'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
