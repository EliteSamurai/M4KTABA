import { NextRequest, NextResponse } from 'next/server';

// Ensure this route is dynamic and not statically generated
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mock ISBN lookup data - in production, this would integrate with a real service
const MOCK_BOOKS: Record<string, any> = {
  '978-0-123456-78-9': {
    title: 'The Holy Quran',
    author: 'Various Authors',
    coverUrl: 'https://via.placeholder.com/300x400?text=Quran',
    description: 'The Holy Quran with Arabic text and English translation',
    language: 'Arabic',
    category: 'Quran',
  },
  '978-0-123456-79-6': {
    title: 'Sahih al-Bukhari',
    author: 'Imam al-Bukhari',
    coverUrl: 'https://via.placeholder.com/300x400?text=Hadith',
    description: 'Collection of authentic hadiths compiled by Imam al-Bukhari',
    language: 'Arabic',
    category: 'Hadith',
  },
  '978-0-123456-80-2': {
    title: 'Fiqh al-Sunnah',
    author: 'Sayyid Sabiq',
    coverUrl: 'https://via.placeholder.com/300x400?text=Fiqh',
    description:
      'Comprehensive guide to Islamic jurisprudence based on the Sunnah',
    language: 'Arabic',
    category: 'Fiqh',
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isbn = searchParams.get('isbn');

    if (!isbn) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'ISBN parameter is required' },
        { status: 400 }
      );
    }

    // Clean ISBN (remove hyphens and spaces)
    const cleanIsbn = isbn.replace(/[-\s]/g, '');

    // Check if we have mock data for this ISBN
    const bookData = MOCK_BOOKS[cleanIsbn];

    if (!bookData) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Book not found for this ISBN' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      data: bookData,
    });
  } catch (error) {
    console.error('Error looking up ISBN:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to lookup ISBN',
      },
      { status: 500 }
    );
  }
}
