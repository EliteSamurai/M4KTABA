import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { getSanityClients, isSanityConfigured } from '@/lib/sanityClient';
import { listingPublishSchema } from '@/lib/validation/listingSchema';
import { mapListingToBookFields } from '../route';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check Sanity configuration
    if (!isSanityConfigured()) {
      return NextResponse.json(
        { code: 'CONFIGURATION_ERROR', message: 'Sanity not configured' },
        { status: 500 }
      );
    }

    const { readClient, writeClient } = await getSanityClients();
    if (!readClient || !writeClient) {
      return NextResponse.json(
        {
          code: 'CONFIGURATION_ERROR',
          message: 'Failed to initialize Sanity clients',
        },
        { status: 500 }
      );
    }

        // Check if the book exists and belongs to the seller (consolidated on `book`)
    const existingListing = await readClient.fetch(
      `*[_type == "book" && _id == $id && user._ref == $userId][0]{_id}`,
      { id: params.id, userId: session.user._id }
    );

    if (!existingListing) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Listing not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body for publishing
    const body = await req.json();
    const validationResult = listingPublishSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid listing data for publishing',
          fieldErrors: validationResult.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

        const publishData = validationResult.data;

    // Bridge the listing-shaped publish payload onto `book` schema fields
    // (condition -> selectedCondition, category -> selectedCategory ref,
    //  images -> photos; isbn/currency are listing-only -> dropped).
    const bookFields = await mapListingToBookFields(readClient, publishData);

    // qualityScore is computed for the Slack notification + response only.
    // It is intentionally NOT persisted: the `book` schema has no qualityScore
    // field (that was a legacy `listing` concept). Persisting it would silently
    // store a non-schema field on book documents, so it is dropped from `.set`.
    const qualityScore = calculateQualityScore(bookFields);

    // Publish book in Sanity
    const publishedListing = await writeClient
      .patch(params.id)
      .set({
        ...bookFields,
        status: 'published', // book.status enum is lowercase (legacy listing used 'PUBLISHED')
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .commit();

    // Send Slack notification if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `📚 New listing published: "${publishData.title}" by ${publishData.author} (Quality Score: ${qualityScore}/100)`,
          }),
        });
      } catch (slackError) {
        console.warn('Failed to send Slack notification:', slackError);
      }
    }

    return NextResponse.json({
      id: publishedListing._id,
      message: 'Listing published successfully',
      qualityScore,
    });
  } catch (error) {
    console.error('Error publishing listing:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to publish listing',
      },
      { status: 500 }
    );
  }
}

function calculateQualityScore(book: any): number {
  let score = 0;

  // Basic information (40 points)
  if (book.title && book.title.length > 5) score += 10;
  if (book.author && book.author.length > 2) score += 10;
  if (book.description && book.description.length > 50) score += 10;
  if (book.isbn && book.isbn.length > 0) score += 10; // book has no isbn -> 0 (kept for parity)

  // Images (30 points) — book.photos (image objects) replaces listing.images (strings)
  if (book.photos && book.photos.length >= 1) score += 15;
  if (book.photos && book.photos.length >= 3) score += 15;

  // Pricing and condition (20 points) — book.selectedCondition (identical enum)
  if (book.price && book.price > 0) score += 10;
  if (book.selectedCondition && book.selectedCondition !== '') score += 10;

  // Additional details (10 points) — book.selectedCategory (reference object)
  if (book.selectedCategory) score += 5;
  if (book.language && book.language !== '') score += 5;

  return Math.min(score, 100);
}
