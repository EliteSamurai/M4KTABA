'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import ThumbnailSwitcher from '@/components/ThumbnailSwitcher';
import AddToCartButton from '@/components/AddToCartButton';
import QuantitySelector from '@/components/QuantitySelector';
import { SellerInfo } from '@/components/seller-info';
import EditProductForm from '@/components/EditProductForm';
import calculateAverageRating from '@/utils/calculateAverageRating';
import { urlFor } from '@/utils/imageUrlBuilder';
import Link from 'next/link';
import EditableThumbnailManager from './EditableThumbnailManager';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

interface ProductPageClientProps {
  book: { _id?: string; [key: string]: unknown };
}

export default function ProductPageClient({ book }: ProductPageClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [relatedBooks, setRelatedBooks] = useState<unknown[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  // const [bookViews, setBookViews] = useState((book as any)?.views || 0);
  const { data: session } = useSession();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Move all hooks to the top before any conditional returns
  const [photos, setPhotos] = useState(book?.photos || []);

  useEffect(() => {
    if (Array.isArray(book?.photos) && book.photos.length > 0) {
      setPhotos(book.photos);
    }
  }, [book?.photos]);

  // Check for edit parameter and auto-open edit form
  useEffect(() => {
    const editParam = searchParams.get('edit');

    // If edit=true and user owns this book, auto-open the edit form
    if (
      editParam === 'true' &&
      session?.user?._id === (book as any)?.user?._id
    ) {
      console.log('Auto-opening edit form for book:', book._id);
      setIsEditFormOpen(true);
    }
  }, [searchParams, book._id, (book as any)?.user?._id, session?.user?._id]);

  // Track view when component mounts
  useEffect(() => {
    async function trackView() {
      if (!book?._id || !session?.user?._id) return;

      try {
        const response = await fetch(`/api/books/${book._id}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // if (data.isNewView) {
          //   setBookViews(data.views);
          // }
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    }

    trackView();
  }, [book?._id, session?.user?._id]);

  // Fetch related products
  useEffect(() => {
    async function fetchRelatedBooks() {
      if (!book?._id || !(book as any)?.selectedCategory?._id) {
        setLoadingRelated(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/related-books?bookId=${book._id}&categoryId=${(book as any).selectedCategory._id}`
        );
        if (response.ok) {
          const data = await response.json();
          setRelatedBooks(data.books || []);
        }
      } catch (error) {
        console.error('Error fetching related books:', error);
      } finally {
        setLoadingRelated(false);
      }
    }

    fetchRelatedBooks();
  }, [book?._id, (book as any)?.selectedCategory?._id]);

  if (!book) {
    return (
      <div className='container py-6'>
        <p className='text-muted-foreground'>Product not found.</p>
      </div>
    );
  }

  const {
    user,
    title,
    description,
    selectedCondition,
    price,
    selectedCategory,
    quantity: availableQuantity,
    _id,
  } = book;
  const userRatings = (user as any)?.ratings || [];
  const averageRating = calculateAverageRating(userRatings);
  const isAvailable = (availableQuantity as number) > 0;
  const isOwner = session?.user?._id === (user as any)?._id;

  const handleImageUpdate = async (
    updatedPhotos: { _key?: string; asset?: { _ref?: string } }[]
  ) => {
    setIsUpdating(true);
    try {
      // Use POST for image upload
      const response = await fetch(`/api/upload-image`, {
        method: 'POST',
        body: JSON.stringify({
          bookId: _id,
          photos: updatedPhotos,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update images');
      }

      const data = await response.json();
      if (data.asset) {
        setPhotos(updatedPhotos);
        toast({
          title: 'Success',
          description: 'Images have been updated successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update images. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating images:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditSuccess = () => {
    toast({
      title: 'Success',
      description: 'Product updated successfully!',
    });
  };

  return (
    <div className='container mx-auto space-y-16 py-8 md:py-12'>
      <div className='mx-auto max-w-5xl'>
        <div className='grid gap-8 lg:grid-cols-2'>
          {/* Product Images */}
          <div className='top-24'>
            {isOwner ? (
              <EditableThumbnailManager
                photos={photos as any}
                bookId={book._id || ''}
                onChange={handleImageUpdate}
                isLoading={isUpdating}
              />
            ) : photos && (photos as any).length > 0 ? (
              <ThumbnailSwitcher photos={photos as any} />
            ) : (
              <Card className='aspect-square'>
                <CardContent className='flex h-full items-center justify-center text-muted-foreground'>
                  No images available
                </CardContent>
              </Card>
            )}
          </div>

          {/* Product Info */}
          <div className='space-y-8'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>
                    {(selectedCategory as any)?.title}
                  </Badge>
                  {isAvailable ? (
                    <Badge variant='default' className='bg-green-600'>
                      In Stock
                    </Badge>
                  ) : (
                    <Badge variant='destructive'>Out of Stock</Badge>
                  )}
                </div>
                {isOwner && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsEditFormOpen(true)}
                    className='flex items-center gap-2'
                  >
                    <Edit className='h-4 w-4' />
                    Edit Listing
                  </Button>
                )}
              </div>
              <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
                {(title as string) || 'Untitled Book'}
              </h1>
              <SellerInfo
                image={(user as any)?.image || null}
                email={(user as any)?.email || 'anonymous@example.com'}
                name={(user as any)?.name || null}
                rating={Number(averageRating)}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  {(description as string) || 'No description available.'}
                </p>
                <div className='flex items-center gap-2 text-sm'>
                  <span className='font-medium'>Condition:</span>
                  <span className='text-muted-foreground'>
                    {selectedCondition
                      ? (selectedCondition as string).charAt(0).toUpperCase() +
                        (selectedCondition as string).slice(1)
                      : 'Not specified'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <span className='text-lg font-medium'>Price</span>
                  <span className='text-3xl font-bold'>
                    ${(price as number)?.toFixed(2) || 'N/A'}
                  </span>
                </div>
                <Separator className='mb-4' />
                <div className='space-y-4'>
                  <QuantitySelector
                    bookId={_id as string}
                    onQuantityChange={setQuantity}
                    quantity={quantity}
                  />
                  {!isOwner && (
                    <AddToCartButton
                      bookUser={user as any}
                      bookId={_id as string}
                      quantity={quantity}
                      isAvailable={isAvailable}
                      bookTitle={title as string}
                      bookPrice={price as number}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Product Form */}
      <EditProductForm
        book={book}
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Related Products */}
      <section className='mx-auto max-w-5xl'>
        <h2 className='mb-6 text-2xl font-bold'>Related Products</h2>
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'>
          {loadingRelated ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className='overflow-hidden'>
                <CardContent className='p-0'>
                  <Skeleton className='aspect-[4/5] w-full' />
                  <div className='p-4'>
                    <Skeleton className='mb-2 h-4 w-3/4' />
                    <Skeleton className='h-4 w-1/2' />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : relatedBooks.length > 0 ? (
            relatedBooks.map((relatedBook, i) => (
              <Link
                key={i}
                href={`/all/${(relatedBook as any)._id}`}
                className='transition-transform hover:scale-105'
              >
                <Card className='overflow-hidden'>
                  <CardContent className='p-0'>
                    <div className='aspect-[4/5] overflow-hidden'>
                      <Image
                        src={
                          urlFor((relatedBook as any).photos) ||
                          '/placeholder.jpg'
                        }
                        alt={(relatedBook as any).title || 'Related product'}
                        className='h-full w-full object-cover'
                        width={300}
                        height={400}
                      />
                    </div>
                    <div className='p-4'>
                      <h3 className='mb-2 line-clamp-1 font-medium'>
                        {(relatedBook as any).title}
                      </h3>
                      <p className='font-bold'>
                        ${(relatedBook as any).price?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className='col-span-full py-12 text-center text-muted-foreground'>
              No related products available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
