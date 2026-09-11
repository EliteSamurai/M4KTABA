import { readClient } from '@/studio-m4ktaba/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import BookProductCard from '@/components/ProductCard';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

export const revalidate = 300;

const options = { next: { revalidate: 300 }, cache: 'force-cache' as RequestCache };

const CATEGORY_QUERY = `
*[_type == "category" && slug.current == $slug][0]{
  _id,
  "slug": slug.current,
  title,
  description
}`;

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

const LIMIT = 12;

function orderByFor(sort: string) {
  if (sort === 'price_asc') return 'price asc';
  if (sort === 'price_desc') return 'price desc';
  return '_createdAt desc';
}

// Posts that reference this category via `shopCategories` OR `categories`.
// `references()` matches any reference field pointing at the category _id; on a
// post the only such references are the category links (the author image and
// mainImage asset refs can never equal a category _id), so this is safe.
const RELATED_POSTS_QUERY = `
*[_type == "post" && defined(slug.current) && publishedAt <= now()
  && references($categoryId)] | order(publishedAt desc)[0...4]{
  _id,
  title,
  "slug": slug.current,
  publishedAt
}`;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp: Record<string, string | string[] | undefined> =
    (await searchParams) ?? {};
  const sort = typeof sp.sort === 'string' ? sp.sort : 'newest';
  const page = Math.max(
    1,
    typeof sp.page === 'string' ? parseInt(sp.page, 10) : 1
  );

  // Build-safe: readClient returns [] when Sanity env vars are absent, so an
  // unknown / missing category renders a friendly placeholder, not a crash.
  const category = await (readClient as any).fetch(CATEGORY_QUERY, { slug }, options);
  const resolvedCategory = Array.isArray(category) ? category[0] : category;

  if (!resolvedCategory || !resolvedCategory._id) {
    return (
      <div className='container mx-auto min-h-[40vh] py-16 text-center'>
        <h1 className='text-2xl font-bold'>Category not found</h1>
        <p className='mt-3 text-muted-foreground'>
          The category you’re looking for doesn’t exist or has been removed.
        </p>
        <Button asChild variant='outline' className='mt-6'>
          <Link href='/all'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Browse all books
          </Link>
        </Button>
      </div>
    );
  }

  const orderBy = orderByFor(sort);
  const start = (page - 1) * LIMIT;
  const end = start + LIMIT;
  const queryVars: Record<string, unknown> = { categoryId: resolvedCategory._id };

  // Book listing mirrors app/api/get-all-books/route.ts (filter by the
  // category document _id via selectedCategory._ref).
  const booksQuery = `*[_type == "book" && quantity > 0 && selectedCategory._ref == $categoryId] | order(${orderBy}) [${start}...${end}]{
    _id,
    title,
    "user": user->{_id, email, location},
    price,
    selectedCondition, "image": photos[0].asset._ref
  }`;
  const countQuery = `count(*[_type == "book" && quantity > 0 && selectedCategory._ref == $categoryId])`;

  const [books, total] = await Promise.all([
    (readClient as any).fetch(booksQuery, queryVars, options),
    (readClient as any).fetch(countQuery, queryVars, options),
  ]);

  // Related editorial reading (guarded so a GROQ hiccup never breaks the page).
  let relatedPosts: any[] = [];
  try {
    relatedPosts =
      (await (readClient as any).fetch(RELATED_POSTS_QUERY, queryVars, options)) ?? [];
  } catch (err) {
    console.error(
      'Failed to fetch related posts for category',
      resolvedCategory._id,
      err
    );
  }

  const totalPages = Math.ceil((total || 0) / LIMIT);

  return (
    <div className='container mx-auto min-h-screen py-8 md:py-12'>
      {/* Category header */}
      <div className='mb-8 space-y-4'>
        <nav aria-label='breadcrumb' className='text-sm text-muted-foreground'>
          <Link href='/all' className='underline-offset-4 hover:underline'>
            All categories
          </Link>
          {' / '}
          <span>{resolvedCategory.title}</span>
        </nav>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          {resolvedCategory.title}
        </h1>
        {resolvedCategory.description && (
          <p className='text-muted-foreground max-w-2xl'>
            {resolvedCategory.description}
          </p>
        )}
      </div>

      {/* Sort controls */}
      <div className='mb-6 flex flex-wrap items-center gap-4'>
        {SORTS.map((s) => (
          <Button
            key={s.value}
            size='sm'
            variant={sort === s.value ? 'default' : 'outline'}
            asChild
          >
            <Link
              href={{
                pathname: `/category/${resolvedCategory.slug}`,
                query: { sort: s.value, page: 1 },
              }}
            >
              {s.label}
            </Link>
          </Button>
        ))}
      </div>

      {/* Book grid */}
      {total === 0 ? (
        <div className='py-12 text-center'>
          <ShoppingCart className='mx-auto h-10 w-10 text-muted-foreground/50' />
          <p className='mt-4 text-muted-foreground'>
            There are no books in this category right now. Check back soon!
          </p>
          <Button asChild variant='outline' className='mt-4'>
            <Link href='/all'>See all books</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {(books || []).map((book: any) => (
              <BookProductCard
                key={book._id}
                id={book._id}
                title={book.title}
                user={
                  book.user || {
                    email: 'unknown@example.com',
                    location: {},
                  }
                }
                price={book.price}
                image={book.image}
                condition={book.selectedCondition}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-10 flex flex-wrap justify-center gap-2'>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <Button
                    key={p}
                    size='sm'
                    variant={p === page ? 'default' : 'outline'}
                    asChild
                  >
                    <Link
                      href={{
                        pathname: `/category/${resolvedCategory.slug}`,
                        query: { sort, page: p },
                      }}
                    >
                      {p}
                    </Link>
                  </Button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Related reading: editorial posts about this topic */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className='mt-16 border-t pt-12'>
          <h2 className='text-2xl font-bold tracking-tight mb-2'>
            Related reading
          </h2>
          <p className='mb-6 text-muted-foreground'>
            Blog posts about this topic from the M4KTABA editorial team.
          </p>
          <div className='grid gap-4 md:grid-cols-2'>
            {relatedPosts.map((post: any) => (
              <Card key={post._id} className='transition-shadow hover:shadow-md'>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    <Link
                      href={`/blog/${post.slug}`}
                      className='hover:underline'
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                  {post.publishedAt && (
                    <p className='text-xs text-muted-foreground'>
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
