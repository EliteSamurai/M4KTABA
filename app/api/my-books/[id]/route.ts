import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient, writeClient } from '@/studio-m4ktaba/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch specific book
    const book = await (readClient as any).fetch(
      `*[_type == "book" && _id == $id && user._ref == $userId][0] {
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
        sales,
        revenue
      }`,
      { id, userId: session.user._id }
    );

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await req.json();

    // Verify ownership
    const existingBook = await (readClient as any).fetch(
      `*[_type == "book" && _id == $id && user._ref == $userId][0]`,
      { id, userId: session.user._id }
    );

    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      _updatedAt: new Date().toISOString(),
    };

    // Allow updating specific fields
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.author !== undefined) updateData.author = updates.author;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.selectedCondition !== undefined)
      updateData.selectedCondition = updates.selectedCondition;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.category !== undefined) {
      updateData.selectedCategory = {
        _type: 'reference',
        _ref: updates.category,
      };
    }

    // Update the book
    await (writeClient as any).patch(id).set(updateData).commit();

    return NextResponse.json({ message: 'Book updated successfully' });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingBook = await (readClient as any).fetch(
      `*[_type == "book" && _id == $id && user._ref == $userId][0]`,
      { id, userId: session.user._id }
    );

    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Delete the book
    await (writeClient as any).delete(id);

    return NextResponse.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}

