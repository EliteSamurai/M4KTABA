import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

type IncomingPhoto = {
  _key?: string;
  _type?: string;
  asset?: { _ref?: string; _type?: string; url?: string };
};

function normalizePhoto(
  photo: IncomingPhoto,
  index: number
): { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string } } | null {
  const ref = photo?.asset?._ref;
  if (!ref || typeof ref !== 'string') return null;
  return {
    _type: 'image',
    _key: photo._key || `photo-${index}-${Date.now()}`,
    asset: {
      _type: 'reference',
      _ref: ref,
    },
  };
}

export async function POST(req: Request) {
  try {
    let file: File | null = null;
    let bookId: string | null = null;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData request (file upload)
      const formData = await req.formData();
      file = formData.get('file') as File;
      bookId = formData.get('bookId') as string;

      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded.' },
          { status: 400 }
        );
      }

      if (!bookId) {
        return NextResponse.json(
          { error: 'Book ID is required.' },
          { status: 400 }
        );
      }

      // Convert file to buffer for Next.js 15 compatibility
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload the file as an asset to the media store
      const asset = await (writeClient as any).assets.upload('image', buffer, {
        filename: file.name,
        contentType: file.type,
      });

      return NextResponse.json({ asset });
    } else {
      // Handle JSON request (updating photos array)
      const { bookId, photos } = await req.json();
      const session = await getServerSession(authOptions);

      if (!bookId) {
        return NextResponse.json(
          { error: 'Book ID is required.' },
          { status: 400 }
        );
      }

      if (!photos || !Array.isArray(photos)) {
        return NextResponse.json(
          { error: 'Photos array is required.' },
          { status: 400 }
        );
      }

      if (!session?.user?._id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Verify ownership before allowing photo updates
      const ownedBook = await (readClient as any).fetch(
        `*[_type == "book" && _id == $bookId && user._ref == $userId][0]{ _id }`,
        { bookId, userId: session.user._id }
      );
      if (!ownedBook) {
        return NextResponse.json(
          { error: 'Book not found or not owned by current user.' },
          { status: 403 }
        );
      }

      // Ensure photos have _key property
      const normalizedPhotos = photos
        .map((photo: IncomingPhoto, index: number) => normalizePhoto(photo, index))
        .filter(Boolean);

      if (normalizedPhotos.length === 0) {
        return NextResponse.json(
          { error: 'At least one valid photo with asset._ref is required.' },
          { status: 400 }
        );
      }

      // Update the book's photos in Sanity
      const result = await (writeClient as any)
        .patch(bookId)
        .set({ photos: normalizedPhotos })
        .commit();

      return NextResponse.json({ success: true, result });
    }
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
  }
}
