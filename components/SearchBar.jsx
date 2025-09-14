'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { slugify } from '@/utils/slugify';

const searchSchema = z.object({
  title: z
    .string()
    .min(7, 'Title must be at least 7 characters')
    .max(100, 'Title must be less than 100 characters'),
  author: z
    .string()
    .min(3, 'Author must be at least 3 characters')
    .max(100, 'Author must be less than 100 characters'),
});

export default function SearchBar() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      title: '',
      author: '',
    },
  });

  async function onSubmit(data) {
    setIsSubmitting(true);
    const slug = `${slugify(data.title)} by ${slugify(data.author)}`;
    router.push(`/sell/${slug}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='group relative space-y-4 md:space-y-0'
      >
        <div className='relative flex flex-col gap-4 md:flex-row md:items-center md:gap-6'>
          <div className='flex-1 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <Input
                      placeholder='Book title'
                      className='h-12 rounded-full px-6 text-base transition-colors'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='ml-4 mt-1.5' />
                </FormItem>
              )}
            />

            <span className='hidden text-sm font-medium text-muted-foreground md:block'>
              by
            </span>

            <FormField
              control={form.control}
              name='author'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <Input
                      placeholder="Author's name"
                      className='h-12 rounded-full px-6 text-base transition-colors'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='ml-4 mt-1.5' />
                </FormItem>
              )}
            />
          </div>

          <Button
            type='submit'
            size='lg'
            className='relative h-12 w-full rounded-full md:w-auto'
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Searching
              </>
            ) : (
              <>
                <Search className='mr-2 h-4 w-4' />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Show validation summary on mobile */}
        <div className='mt-4 md:hidden'>
          {form.formState.errors.title && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.title.message}
            </p>
          )}
          {form.formState.errors.author && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.author.message}
            </p>
          )}
        </div>
      </form>
    </Form>
  );
}
