'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import EditableThumbnailManager from './EditableThumbnailManager';

const editBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  author: z
    .string()
    .min(1, 'Author is required')
    .max(50, 'Author name is too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description is too long'),
  price: z.number().min(0, 'Price must be positive'),
  quantity: z.number().min(0, 'Quantity must be at least 0'),
  selectedCondition: z.string().min(1, 'Condition is required'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['draft', 'published', 'sold_out', 'hidden']),
});

type EditBookFormData = z.infer<typeof editBookSchema>;

interface EditBookFormProps {
  book: {
    _id: string;
    title: string;
    author: string;
    description: string;
    price: number;
    quantity: number;
    selectedCondition: string;
    status: string;
    photos: Array<{
      _key?: string;
      asset?: {
        _ref?: string;
        url?: string;
      };
    }>;
    selectedCategory?: {
      _id: string;
      title: string;
    };
  };
  categories: Array<{
    _id: string;
    title: string;
  }>;
}

export default function EditBookForm({ book, categories }: EditBookFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);

  const form = useForm<EditBookFormData>({
    resolver: zodResolver(editBookSchema),
    defaultValues: {
      title: book.title,
      author: book.author,
      description: book.description,
      price: book.price,
      quantity: book.quantity,
      selectedCondition: book.selectedCondition,
      category: book.selectedCategory?._id || '',
      status: book.status as any,
    },
  });

  const onSubmit = async (data: EditBookFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/my-books/${book._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update book');
      }

      toast({
        title: 'Success!',
        description: 'Your book has been updated successfully.',
      });

      router.push('/dashboard/my-books');
    } catch (error) {
      console.error('Error updating book:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update book',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpdate = async (updatedPhotos: any[]) => {
    setIsUpdatingImages(true);

    try {
      const response = await fetch(`/api/my-books/${book._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photos: updatedPhotos,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update images');
      }

      toast({
        title: 'Success!',
        description: 'Images updated successfully.',
      });
    } catch (error) {
      console.error('Error updating images:', error);
      toast({
        title: 'Error',
        description: 'Failed to update images',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingImages(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header Actions */}
      <div className='flex items-center justify-between'>
        <Button variant='outline' onClick={() => router.back()}>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back
        </Button>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Book Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter book title' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='author'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter author name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Enter book description'
                          className='min-h-[100px]'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='price'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='0.00'
                            {...field}
                            onChange={e =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='quantity'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='1'
                            {...field}
                            onChange={e =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='selectedCondition'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select condition' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='new'>New</SelectItem>
                          <SelectItem value='like-new'>Like New</SelectItem>
                          <SelectItem value='good'>Good</SelectItem>
                          <SelectItem value='fair'>Fair</SelectItem>
                          <SelectItem value='poor'>Poor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select category' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select status' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='draft'>Draft</SelectItem>
                          <SelectItem value='published'>Published</SelectItem>
                          <SelectItem value='sold_out'>Sold Out</SelectItem>
                          <SelectItem value='hidden'>Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      Update Book
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Book Images</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableThumbnailManager
              photos={book.photos}
              bookId={book._id}
              onChange={handleImageUpdate}
              isLoading={isUpdatingImages}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

