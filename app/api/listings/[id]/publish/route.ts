import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { getSanityClients, isSanityConfigured } from '@/lib/sanityClient';
import { listingPublishSchema } from '@/lib/validation/listingSchema';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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

    // Check if listing exists and belongs to user
    const existingListing = await readClient.fetch(
      `*[_type == "listing" && _id == $id && sellerId == $sellerId][0]`,
      { id: params.id, sellerId: session.user.id }
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

    // Calculate quality score based on listing completeness
    const qualityScore = calculateQualityScore(publishData);

    // Publish listing in Sanity
    const publishedListing = await writeClient
      .patch(params.id)
      .set({
        ...publishData,
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        qualityScore,
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

function calculateQualityScore(listing: any): number {
  let score = 0;

  // Basic information (40 points)
  if (listing.title && listing.title.length > 5) score += 10;
  if (listing.author && listing.author.length > 2) score += 10;
  if (listing.description && listing.description.length > 50) score += 10;
  if (listing.isbn && listing.isbn.length > 0) score += 10;

  // Images (30 points)
  if (listing.images && listing.images.length >= 1) score += 15;
  if (listing.images && listing.images.length >= 3) score += 15;

  // Pricing and condition (20 points)
  if (listing.price && listing.price > 0) score += 10;
  if (listing.condition && listing.condition !== '') score += 10;

  // Additional details (10 points)
  if (listing.language && listing.language !== '') score += 5;
  if (listing.category && listing.category !== '') score += 5;

  return Math.min(score, 100);
}
