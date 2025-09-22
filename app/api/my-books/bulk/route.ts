import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient, writeClient } from '@/studio-m4ktaba/client';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookIds, action } = await req.json();

    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json(
        { error: 'Book IDs are required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Verify ownership of all books
    const books = await (readClient as any).fetch(
      `*[_type == "book" && _id in $bookIds && user._ref == $userId]`,
      { bookIds, userId: session.user._id }
    );

    if (books.length !== bookIds.length) {
      return NextResponse.json(
        { error: 'Some books not found or not owned by user' },
        { status: 403 }
      );
    }

    // Prepare update data based on action
    let updateData: any = {
      _updatedAt: new Date().toISOString(),
    };

    switch (action) {
      case 'publish':
        updateData.status = 'published';
        break;
      case 'hide':
        updateData.status = 'hidden';
        break;
      case 'draft':
        updateData.status = 'draft';
        break;
      case 'sold_out':
        updateData.status = 'sold_out';
        break;
      case 'delete':
        // Handle deletion separately
        const deletePromises = bookIds.map((id: string) =>
          (writeClient as any).delete(id)
        );
        await Promise.all(deletePromises);

        return NextResponse.json({
          message: `${bookIds.length} books deleted successfully`,
        });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update all books
    const updatePromises = bookIds.map((id: string) =>
      (writeClient as any).patch(id).set(updateData).commit()
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: `${bookIds.length} books updated successfully`,
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

