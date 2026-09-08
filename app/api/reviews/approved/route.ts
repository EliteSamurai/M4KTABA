import { NextResponse } from 'next/server';
import { groq } from 'next-sanity';
import { readClient } from '@/studio-m4ktaba/client';

/**
 * Public, build-safe read endpoint returning the most recent approved reviews
 * (site-wide). Backs the `UserReviews` trust widget on the welcome page, which
 * is a client component and therefore cannot call `readClient` directly (no
 * public Sanity token is exposed to the browser).
 *
 * GET /api/reviews/approved?limit=6
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 6, 1), 12);

  try {
    const reviews = await (readClient as any).fetch(
      groq`*[_type == 'review' && status == 'approved']
            | order(coalesce(publishedAt, _createdAt) desc)[0...$limit]{
              _id,
              score,
              body,
              title,
              "publishedAt": coalesce(publishedAt, _createdAt),
              "reviewerName": coalesce(reviewer->name, reviewer->email, 'Anonymous'),
              "reviewerImage": reviewer->image.asset->url,
              "bookSlug": book->slug.current,
              "bookTitle": book->title
            }`,
      { limit }
    );
    return NextResponse.json(reviews || []);
  } catch {
    return NextResponse.json([]);
  }
}
