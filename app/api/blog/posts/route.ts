import { NextRequest, NextResponse } from 'next/server';
import {
  getSanityClients,
  isSanityConfigured,
} from '@/lib/sanity-client-conditional';

const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current) && publishedAt <= now()
]|order(publishedAt desc){
  _id,
  title,
  slug,
  publishedAt,
  mainImage,
  categories[]->{
    title,
    _id
  }
}`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '6');
    const offset = (page - 1) * limit;

    // Check if Sanity is configured and client is available
    if (!isSanityConfigured()) {
      return NextResponse.json({ posts: [], hasMore: false });
    }

    const { readClient } = await getSanityClients();
    if (!readClient) {
      return NextResponse.json({ posts: [], hasMore: false });
    }

    const allPosts = await readClient.fetch(
      POSTS_QUERY,
      {},
      { next: { revalidate: 30 } }
    );

    const posts = allPosts.slice(offset, offset + limit);
    const hasMore = offset + limit < allPosts.length;

    return NextResponse.json({
      posts,
      hasMore,
      total: allPosts.length,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
