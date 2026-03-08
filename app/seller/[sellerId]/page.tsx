import Image from 'next/image';
import Link from 'next/link';
import { groq } from 'next-sanity';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { readClient } from '@/studio-m4ktaba/client';
import calculateAverageRating from '@/utils/calculateAverageRating';

type Rating = {
  score?: number;
  review?: string;
};

function extractBioText(bio: unknown): string {
  if (!Array.isArray(bio)) return '';

  const chunks: string[] = [];
  for (const block of bio) {
    if (!block || typeof block !== 'object') continue;
    const children = (block as { children?: Array<{ text?: string }> }).children;
    if (!Array.isArray(children)) continue;
    for (const child of children) {
      if (typeof child?.text === 'string' && child.text.trim()) {
        chunks.push(child.text.trim());
      }
    }
  }

  return chunks.join(' ');
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  const { sellerId } = await params;

  const seller = await (readClient as any).fetch(
    groq`*[_type == "user" && _id == $sellerId][0]{
      _id,
      name,
      email,
      bio,
      location,
      ratings[]{
        score,
        review
      },
      "image": coalesce(
        avatar.asset->{
          _ref,
          url
        },
        image.asset->{
          _ref,
          url
        }
      )
    }`,
    { sellerId }
  );

  if (!seller) {
    notFound();
  }

  const listings = await (readClient as any).fetch(
    groq`*[_type == "book" && user._ref == $sellerId && quantity > 0] | order(_createdAt desc)[0...24]{
      _id,
      title,
      price,
      quantity,
      views,
      status,
      "photo": photos[0].asset->{
        url
      }
    }`,
    { sellerId }
  );

  const ratings: Rating[] = Array.isArray(seller.ratings) ? seller.ratings : [];
  const averageRating = Number(calculateAverageRating(ratings) || 0);
  const reviewCount = ratings.length;
  const writtenReviews = ratings.filter((r) => typeof r?.review === 'string' && r.review.trim());
  const bioText = extractBioText(seller.bio);
  const displayName = seller.name || seller.email?.split('@')[0] || 'Seller';
  const locationText = [seller?.location?.city, seller?.location?.state, seller?.location?.country]
    .filter(Boolean)
    .join(', ');

  return (
    <main className='container mx-auto max-w-6xl py-8 md:py-12'>
      <div className='space-y-8'>
        <section className='rounded-xl border bg-card p-6'>
          <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
            <div className='flex items-start gap-4'>
              {seller.image?.url ? (
                <Image
                  src={seller.image.url}
                  alt={`${displayName} profile image`}
                  width={72}
                  height={72}
                  className='h-[72px] w-[72px] rounded-full object-cover'
                />
              ) : (
                <div className='flex h-[72px] w-[72px] items-center justify-center rounded-full bg-muted text-xl font-semibold'>
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className='space-y-2'>
                <h1 className='text-2xl font-bold'>{displayName}</h1>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                  <span>
                    {averageRating.toFixed(1)} ({reviewCount} review
                    {reviewCount === 1 ? '' : 's'})
                  </span>
                </div>
                {locationText ? (
                  <p className='text-sm text-muted-foreground'>Ships from {locationText}</p>
                ) : null}
              </div>
            </div>
          </div>

          {bioText ? (
            <div className='mt-6 border-t pt-4'>
              <h2 className='mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                About this seller
              </h2>
              <p className='text-sm leading-relaxed text-muted-foreground'>{bioText}</p>
            </div>
          ) : null}
        </section>

        <section className='space-y-4'>
          <h2 className='text-xl font-semibold'>Listings from this seller</h2>
          {Array.isArray(listings) && listings.length > 0 ? (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {listings.map((book: any) => (
                <Link
                  key={book._id}
                  href={`/books/${book._id}`}
                  className='overflow-hidden rounded-lg border transition-shadow hover:shadow-md'
                >
                  <div className='relative aspect-[4/3] bg-muted'>
                    {book.photo?.url ? (
                      <Image
                        src={book.photo.url}
                        alt={book.title || 'Book image'}
                        fill
                        className='object-cover'
                      />
                    ) : (
                      <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
                        No image
                      </div>
                    )}
                  </div>
                  <div className='space-y-1 p-3'>
                    <p className='line-clamp-1 text-sm font-medium'>
                      {book.title || 'Untitled'}
                    </p>
                    <p className='text-sm font-semibold'>${Number(book.price || 0).toFixed(2)}</p>
                    <p className='text-xs text-muted-foreground'>
                      {Number(book.views || 0).toLocaleString()} views
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className='rounded-lg border border-dashed p-6 text-sm text-muted-foreground'>
              No active listings yet.
            </div>
          )}
        </section>

        {writtenReviews.length > 0 ? (
          <section className='space-y-4'>
            <h2 className='text-xl font-semibold'>Recent customer reviews</h2>
            <div className='space-y-3'>
              {writtenReviews.slice(0, 5).map((entry, idx) => (
                <div key={`${idx}-${entry.review}`} className='rounded-lg border p-4'>
                  <div className='mb-1 flex items-center gap-1 text-amber-500'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Number(entry.score || 0) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <p className='text-sm text-muted-foreground'>{entry.review}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
