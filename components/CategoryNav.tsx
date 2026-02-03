'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Category {
  _id: string;
  title: string;
}

interface CategoryNavProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryNav({ selectedCategory, onCategoryChange }: CategoryNavProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/get-categories');
        const data = await res.json();
        // Handle both array and object responses
        const categoriesArray = Array.isArray(data) ? data : data.categories || [];
        setCategories(categoriesArray);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className='h-9 w-20 shrink-0 rounded-full' />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className='space-y-2'>
      <p className='text-sm font-medium text-muted-foreground'>Categories</p>
      <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide'>
        {/* All Books option */}
        <Button
          variant={selectedCategory === '' ? 'default' : 'outline'}
          size='sm'
          onClick={() => onCategoryChange('')}
          className={cn(
            'shrink-0 rounded-full transition-all',
            selectedCategory === '' && 'bg-primary text-primary-foreground'
          )}
        >
          All
        </Button>

        {/* Category options */}
        {categories.map((category) => (
          <Button
            key={category._id}
            variant={selectedCategory === category._id ? 'default' : 'outline'}
            size='sm'
            onClick={() => onCategoryChange(category._id)}
            className={cn(
              'shrink-0 rounded-full transition-all whitespace-nowrap',
              selectedCategory === category._id && 'bg-primary text-primary-foreground'
            )}
          >
            {category.title}
          </Button>
        ))}
      </div>
    </div>
  );
}
