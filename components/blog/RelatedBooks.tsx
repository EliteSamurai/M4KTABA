import { readClient } from '@/studio-m4ktaba/client';
import BookProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface RelatedBooksProps {
  categoryId?: string;
  categorySlug?: string;
  categoryTitle?: string;
}

// Same shape the post page used inline. Kept here so the data fetch can be
// deferred behind a <Suspense> boundary — the post + hero no longer wait on
// this second Sanity round-trip. `categoryId` comes from POST_QUERY, so no
// query change is required on the post.
const RELATED_BOOKS_QUERY = `*[_type == "book" && quantity > 0 && selectedCategory._ref == $categoryId][0...6]{
  _id,
  title,
  "user": user->{_id, email, location},
  price,
  "image": photos[0].asset._ref
}`;

const FETCH_OPTIONS = {
  next: { revalidate: 300 },
  cache: 'force-cache' as RequestCache,
};

/**
 * Server component. Renders the "Shop related books" section. Returns `null`
 * when there is no category or no books, matching the previous
 * `{relatedBooks.length > 0 && ...}` guard (zero related books renders nothing).
 */
export default async function RelatedBooks({
  categoryId,
  categorySlug,
  categoryTitle,
}: RelatedBooksProps) {
  if (!categoryId) return null;

  let books: any[] = [];
  try {
    books =
      (await (readClient as any).fetch(
        RELATED_BOOKS_QUERY,
        { categoryId },
        FETCH_OPTIONS,
      )) ?? [];
  } catch (err) {
    console.error('Failed to fetch related books for category', categoryId, err);
  }

  if (!books.length) return null;

  return (
    <section className='mt-16 border-t pt-12'>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-2xl font-bold tracking-tight'>Shop related books</h2>
        {categorySlug && (
          <Button variant='outline' size='sm' asChild>
            <Link href={`/category/${categorySlug}`}>
              View all in {categoryTitle}
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        )}
      </div>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {books.map((book: any) => (
          <BookProductCard
            key={book._id}
            id={book._id}
            title={book.title}
            user={book.user || { email: 'unknown@example.com', location: {} }}
            price={book.price}
            image={book.image}
          />
        ))}
      </div>
    </section>
  );
}
