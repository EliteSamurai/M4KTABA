import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch books for the current user
    const books = await (readClient as any).fetch(
      `*[_type == "book" && user._ref == $userId] | order(_createdAt desc) {
        _id,
        title,
        author,
        description,
        price,
        quantity,
        selectedCondition,
        status,
        _createdAt,
        _updatedAt,
        "photos": photos[]{
          _key,
          asset->{
            _ref,
            url
          }
        },
        "selectedCategory": selectedCategory->{
          _id,
          title
        },
        views,
        viewedBy,
        sales,
        revenue
      }`,
      { userId: session.user._id }
    );

    // Calculate stats
    const stats = {
      totalBooks: books.length,
      publishedBooks: books.filter((book: any) => book.status === 'published')
        .length,
      draftBooks: books.filter((book: any) => book.status === 'draft').length,
      totalViews: books.reduce(
        (sum: number, book: any) => sum + (book.views || 0),
        0
      ),
      totalSales: books.reduce(
        (sum: number, book: any) => sum + (book.sales || 0),
        0
      ),
      totalRevenue: books.reduce(
        (sum: number, book: any) => sum + (book.revenue || 0),
        0
      ),
    };

    return NextResponse.json({
      books,
      stats,
    });
  } catch (error) {
    console.error('Error fetching user books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
