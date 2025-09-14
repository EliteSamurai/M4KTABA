'use client';

import { useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HoneyImageGalleryProps {
  images: StaticImageData[];
}

export default function HoneyImageGallery({ images }: HoneyImageGalleryProps) {
  const [mainImage, setMainImage] = useState(images[0] || null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Filter thumbnails to exclude the main image
  const thumbnails = images.filter(img => img !== mainImage);

  const handleThumbnailClick = (selectedImage: StaticImageData) => {
    setMainImage(selectedImage);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!mainImage) {
    return (
      <div className='aspect-square bg-gray-100 rounded-lg flex items-center justify-center'>
        <span className='text-gray-500'>No image available</span>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Main Image */}
      <div className='relative aspect-square overflow-hidden rounded-lg bg-gray-100 group'>
        <Image
          src={mainImage}
          alt='Honey product'
          fill
          className={cn(
            'object-cover transition-transform duration-300',
            isZoomed ? 'scale-150' : 'group-hover:scale-105'
          )}
          style={{
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
          }}
          onMouseMove={handleMouseMove}
          priority
        />

        {/* Zoom Button */}
        <Button
          variant='secondary'
          size='sm'
          className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={toggleZoom}
        >
          {isZoomed ? (
            <Minimize2 className='h-4 w-4' />
          ) : (
            <Maximize2 className='h-4 w-4' />
          )}
        </Button>
      </div>

      {/* Thumbnails */}
      {thumbnails.length > 0 && (
        <div className='grid grid-cols-4 gap-2'>
          {thumbnails.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(image)}
              className='relative aspect-square overflow-hidden rounded-md border-2 border-transparent hover:border-gray-300 transition-colors'
            >
              <Image
                src={image}
                alt={`Honey product view ${index + 2}`}
                fill
                className='object-cover'
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
