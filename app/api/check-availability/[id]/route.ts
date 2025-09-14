import { NextResponse } from 'next/server';
import { readClient } from '@/studio-m4ktaba/client';

type Book = {
  quantity: number;
};

// Dynamic route API
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if Sanity is configured
    if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_DATASET) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Fetch the product from Sanity
    const book: Book | null = await (readClient as any).fetch(
      `*[_type == "book" && _id == $id][0]{
        quantity
      }`,
      { id }
    );

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const isAvailable = book.quantity > 0;

    return NextResponse.json({
      available: isAvailable,
      quantity: book.quantity, // Include quantity
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
