import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient, writeClient } from '@/studio-m4ktaba/client';

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
    const { imageKey } = await req.json();

    if (!imageKey) {
      return NextResponse.json(
        { error: 'Image key is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const book = await (readClient as any).fetch(
      `*[_type == "book" && _id == $id && user._ref == $userId][0]{
        _id,
        photos
      }`,
      { id, userId: session.user._id }
    );

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Find the image with the specified key
    const imageIndex = book.photos.findIndex(
      (photo: any) => photo._key === imageKey
    );

    if (imageIndex === -1) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Move the selected image to the front (index 0)
    const reorderedPhotos = [...book.photos];
    const [selectedImage] = reorderedPhotos.splice(imageIndex, 1);
    reorderedPhotos.unshift(selectedImage);

    // Update the book with reordered photos and mark that main image was set
    await (writeClient as any)
      .patch(id)
      .set({
        photos: reorderedPhotos,
        isMainImageSet: true,
        _updatedAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      message: 'Main image updated successfully',
      photos: reorderedPhotos,
    });
  } catch (error) {
    console.error('Error updating main image:', error);
    return NextResponse.json(
      { error: 'Failed to update main image' },
      { status: 500 }
    );
  }
}

