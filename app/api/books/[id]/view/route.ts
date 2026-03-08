import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient, writeClient } from '@/studio-m4ktaba/client';

/** GET: return current view count (uses writeClient to bypass CDN cache so count is fresh) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await (writeClient as any).fetch(
      `*[_type == "book" && _id == $id][0]{ views }`,
      { id }
    );
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json({ views: book.views ?? 0 });
  } catch (error) {
    console.error('Error fetching view count:', error);
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Fetch the book to check if it exists and get current view data
    const book = await (readClient as any).fetch(
      `*[_type == "book" && _id == $id][0]{
        _id,
        views,
        viewedBy
      }`,
      { id }
    );

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // If user is logged in, check if they've already viewed this book
    if (session?.user?._id) {
      const hasViewed = book.viewedBy?.includes(session.user._id) || false;

      if (!hasViewed) {
        // Add user to viewedBy array and increment views
        const updatedViewedBy = [...(book.viewedBy || []), session.user._id];

        await (writeClient as any)
          .patch(id)
          .set({
            views: (book.views || 0) + 1,
            viewedBy: updatedViewedBy,
            _updatedAt: new Date().toISOString(),
          })
          .commit();

        return NextResponse.json({
          success: true,
          views: (book.views || 0) + 1,
          isNewView: true,
        });
      } else {
        // User has already viewed this book
        return NextResponse.json({
          success: true,
          views: book.views || 0,
          isNewView: false,
        });
      }
    } else {
      // For anonymous users, we don't track views to ensure uniqueness
      return NextResponse.json({
        success: true,
        views: book.views || 0,
        isNewView: false,
        message: 'Anonymous users cannot increment view count',
      });
    }
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}

