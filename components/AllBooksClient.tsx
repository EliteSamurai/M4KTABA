'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import BookProductCard from './ProductCard';
import { urlFor } from '@/utils/imageUrlBuilder';
import { debounce } from '@/lib/debounce';
import { CategoryNav } from './CategoryNav';

interface AllBooksClientProps {
  initialBooks: unknown[];
  totalBooks: number;
}

export default function AllBooksClient({
  initialBooks,
  totalBooks,
}: AllBooksClientProps) {
  const [books, setBooks] = useState(initialBooks);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState(''); // The query actually applied
  const [selectedCategory, setSelectedCategory] = useState('');
  const [offset, setOffset] = useState(initialBooks.length);
  const [currentTotal, setCurrentTotal] = useState(totalBooks);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search function that calls the API
  const performSearch = useCallback(async (query: string, category: string = selectedCategory) => {
    const trimmedQuery = query.trim();
    setSearching(true);
    
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: '0',
      });
      
      if (trimmedQuery) {
        params.set('q', trimmedQuery);
      }
      
      if (category) {
        params.set('category', category);
      }
      
      const res = await fetch(`/api/get-all-books?${params.toString()}`);
      const data = await res.json();
      
      setBooks(data.books || []);
      setOffset(data.books?.length || 0);
      setCurrentTotal(data.total || 0);
      setActiveQuery(trimmedQuery);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, [selectedCategory]);

  // Debounced search for real-time filtering
  const debouncedSearchRef = useRef(
    debounce((query: string) => {
      performSearch(query);
    }, 400)
  );

  // Trigger debounced search when searchQuery changes
  useEffect(() => {
    debouncedSearchRef.current(searchQuery);
    
    return () => {
      debouncedSearchRef.current.cancel();
    };
  }, [searchQuery]);

  // Handle form submission (immediate search)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    debouncedSearchRef.current.cancel();
    performSearch(searchQuery);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    debouncedSearchRef.current.cancel();
    performSearch('', selectedCategory);
    inputRef.current?.focus();
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    debouncedSearchRef.current.cancel();
    performSearch(searchQuery, categoryId);
  };

  // Load more with current search query and category
  const loadMore = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '10',
        offset: offset.toString(),
      });
      
      if (activeQuery) {
        params.set('q', activeQuery);
      }
      
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      
      const res = await fetch(`/api/get-all-books?${params.toString()}`);
      const data = await res.json();

      // Filter out any books that already exist to prevent duplicates
      setBooks(prev => {
        const existingIds = new Set(prev.map((book: any) => book._id));
        const newBooks = (data.books || []).filter(
          (book: { _id?: string }) => !existingIds.has(book._id)
        );
        return [...prev, ...newBooks];
      });

      setOffset(prev => prev + (data.books?.length || 0));
    } catch (err) {
      console.error('Failed to load more books', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Category Navigation */}
      <CategoryNav 
        selectedCategory={selectedCategory} 
        onCategoryChange={handleCategoryChange} 
      />

      {/* Search Bar */}
      <form
        onSubmit={handleSubmit}
        className='flex w-full items-center space-x-2 sm:w-[400px]'
      >
        <div className='relative flex-1'>
          <Input
            ref={inputRef}
            type='search'
            placeholder='Search books by title...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full pr-8'
            aria-label='Search books'
          />
          {searchQuery && !searching && (
            <button
              type='button'
              onClick={clearSearch}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              aria-label='Clear search'
            >
              <X className='h-4 w-4' />
            </button>
          )}
          {searching && (
            <Loader2 className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground' />
          )}
        </div>
        <Button type='submit' size='icon' disabled={searching}>
          <Search className='h-4 w-4' />
          <span className='sr-only'>Search</span>
        </Button>
      </form>
      
      {/* Search Results Info */}
      {activeQuery && (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <span>
            {currentTotal === 0 
              ? 'No results' 
              : `${currentTotal} result${currentTotal !== 1 ? 's' : ''}`} for "{activeQuery}"
          </span>
          <Button 
            variant='ghost' 
            size='sm' 
            onClick={clearSearch}
            className='h-auto py-1 px-2'
          >
            Clear
          </Button>
        </div>
      )}

      <Separator />

      {/* Books Grid */}
      {books.length === 0 && !loading && !searching ? (
        <EmptyState
          title={activeQuery ? 'No results found' : 'No books available'}
          description={
            activeQuery 
              ? `We couldn't find any books matching "${activeQuery}". Try a different search term.`
              : "There are no books available at the moment. Check back later!"
          }
          secondaryAction={activeQuery ? {
            label: 'Clear search',
            onClick: clearSearch,
          } : undefined}
        />
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
          {books.map((book: any, index) => (
            <BookProductCard
              key={`${book._id}-${index}`}
              id={book._id}
              title={book.title}
              user={book.user || { email: 'unknown@example.com', location: {} }}
              price={book.price}
              image={urlFor(book.image) || '/islamiclibrary.jpg'}
            />
          ))}
          {(loading || searching) &&
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} className='aspect-[3/4] w-full' />
            ))}
        </div>
      )}

      {/* Load More Button */}
      {books.length < currentTotal && !searching && (
        <div className='flex justify-center'>
          <Button onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Loading...
              </>
            ) : (
              `Load More (${books.length} of ${currentTotal})`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
