'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit3 } from 'lucide-react';
import { useState } from 'react';

interface ListingPreviewProps {
  data: {
    title?: string;
    author?: string;
    description?: string;
    price?: number;
    condition?: string;
    language?: string;
    category?: string;
    images?: File[];
  };
  onEdit?: () => void;
  className?: string;
}

const conditionLabels: Record<string, string> = {
  new: 'New',
  'like-new': 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export default function ListingPreview({
  data,
  onEdit,
  className,
}: ListingPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    title = 'Book Title',
    author = 'Author Name',
    description = 'Book description will appear here...',
    price = 0,
    condition = 'good',
    language = 'Arabic',
    category = 'Other',
    images = [],
  } = data;

  const firstImage = images[0];
  const hasImages = images.length > 0;

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-lg leading-tight line-clamp-2'>
              {title}
            </CardTitle>
            <p className='text-sm text-muted-foreground mt-1'>by {author}</p>
          </div>
          {onEdit && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onEdit}
              className='ml-2 shrink-0'
            >
              <Edit3 className='w-4 h-4' />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Image Preview */}
        <div className='aspect-[3/4] bg-muted rounded-lg overflow-hidden'>
          {hasImages ? (
            <Image
              src={URL.createObjectURL(firstImage)}
              alt={title}
              width={300}
              height={400}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
              <div className='text-center'>
                <div className='w-12 h-12 mx-auto mb-2 bg-muted-foreground/20 rounded-full flex items-center justify-center'>
                  <Eye className='w-6 h-6' />
                </div>
                <p className='text-sm'>No image</p>
              </div>
            </div>
          )}
        </div>

        {/* Price and Condition */}
        <div className='flex items-center justify-between'>
          <div className='text-2xl font-bold text-green-600'>
            ${price.toFixed(2)}
          </div>
          <Badge variant='outline'>
            {conditionLabels[condition] || condition}
          </Badge>
        </div>

        {/* Details */}
        <div className='space-y-2 text-sm'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Language:</span>
            <span>{language}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Category:</span>
            <span>{category}</span>
          </div>
          {images.length > 0 && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Photos:</span>
              <span>
                {images.length} image{images.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>Description</span>
            {description.length > 100 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsExpanded(!isExpanded)}
                className='h-auto p-0 text-xs'
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            {isExpanded || description.length <= 100
              ? description
              : `${description.substring(0, 100)}...`}
          </p>
        </div>

        {/* Image Gallery Preview */}
        {images.length > 1 && (
          <div className='space-y-2'>
            <span className='text-sm font-medium'>All Photos</span>
            <div className='grid grid-cols-4 gap-2'>
              {images.slice(0, 4).map((image, index) => (
                <div
                  key={index}
                  className='aspect-square bg-muted rounded overflow-hidden'
                >
                  <Image
                    src={URL.createObjectURL(image)}
                    alt={`${title} ${index + 1}`}
                    width={80}
                    height={80}
                    className='w-full h-full object-cover'
                  />
                </div>
              ))}
              {images.length > 4 && (
                <div className='aspect-square bg-muted rounded flex items-center justify-center text-xs text-muted-foreground'>
                  +{images.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
