'use client';

import { useState, useEffect, useRef } from 'react';
import { readClient } from '@/studio-m4ktaba/client';
import AddToCartButton from '@/components/AddToCartButton';
import QuantitySelector from '@/components/QuantitySelector';
import ThumbnailSwitcher from '@/components/ThumbnailSwitcher';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import mainHoneyImage from '@/public/IMG_1457.jpg';
import honey1 from '@/public/IMG_1478.jpg';
import honey2 from '@/public/IMG_1469.jpg';
import honey3 from '@/public/IMG_1459.jpg';

export default function HoneyProductPage() {
  const [quantity, setQuantity] = useState(1);
  const [honeyOwner, setHoneyOwner] = useState(null);
  const hasFetched = useRef(false);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  useEffect(() => {
    if (hasFetched.current) return;

    async function fetchHoneyOwner() {
      const data = await (readClient as any).fetch(
        `*[_type == "user" && _id == "MH7kyac4DmuRU6j51iL0It"][0]`
      );
      setHoneyOwner(data);
      hasFetched.current = true;
    }

    fetchHoneyOwner();
  }, []);

  return (
    <div className='container mx-auto py-12 md:py-20'>
      <div className='mx-auto max-w-5xl'>
        <div className='grid gap-8 lg:grid-cols-2'>
          {/* Product Images */}
          <div className='top-24'>
            <ThumbnailSwitcher
              photos={[mainHoneyImage, honey1, honey2, honey3] as any}
            />
          </div>

          {/* Product Info */}
          <div className='space-y-8'>
            <div>
              <div className='mb-2 flex items-center gap-2'>
                <Badge>Premium</Badge>
                <Badge variant='secondary'>Limited Stock</Badge>
              </div>
              <h1 className='mb-2 text-3xl font-bold tracking-tight md:text-4xl'>
                Raw Sidr Honey
              </h1>
              <p className='text-muted-foreground'>Sold by M4KTABA</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>Natural honey from Yemen</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 text-sm'>
                <p>
                  Raw Sidr Honey is a special honey from Yemen, made from the
                  flowers of the rare Sidr tree. It is 100% natural and packed
                  with health benefits. This honey is known for helping boost
                  energy, strengthen the immune system, and soothe sore throats.
                </p>
                <p>
                  Its rich, sweet flavor makes it perfect for tea, toast, or
                  even by itself. Sidr honey is one of the rarest honeys in the
                  world because it comes from a tree that blooms only a few
                  weeks each year. Many people call it "liquid gold" because of
                  its unique taste and benefits.
                </p>
                <div className='pt-2'>
                  <strong>Size:</strong> 226g
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <span className='text-lg font-medium'>Price</span>
                  <span className='text-3xl font-bold'>$29.99</span>
                </div>
                <Separator className='mb-4' />
                <div className='space-y-4'>
                  <QuantitySelector
                    bookId='honey-001'
                    onQuantityChange={handleQuantityChange}
                    quantity={quantity}
                  />
                  <AddToCartButton
                    bookUser={
                      honeyOwner || {
                        _id: '',
                        email: '',
                        name: '',
                        stripeAccountId: '',
                      }
                    }
                    quantity={quantity}
                    bookId='honey-001'
                    isAvailable={true}
                    bookTitle='Raw Sidr Honey'
                    bookPrice={47.99}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
