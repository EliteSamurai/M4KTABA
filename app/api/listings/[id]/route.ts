import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getSanityClients, isSanityConfigured } from '@/lib/sanityClient';
import { listingUpdateSchema } from '@/lib/validation/listingSchema';

export async function GET(
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

    const { readClient } = await getSanityClients();
    if (!readClient) {
      return NextResponse.json(
        {
          code: 'CONFIGURATION_ERROR',
          message: 'Failed to initialize Sanity client',
        },
        { status: 500 }
      );
    }

    // Fetch listing
    const listing = await readClient.fetch(
      `*[_type == "listing" && _id == $id && sellerId == $sellerId][0]`,
      { id: params.id, sellerId: session.user.id }
    );

    if (!listing) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch listing',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = listingUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid listing data',
          fieldErrors: validationResult.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const updateData = validationResult.data;

    // Update listing in Sanity
    const updatedListing = await writeClient
      .patch(params.id)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      id: updatedListing._id,
      message: 'Listing updated successfully',
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update listing',
      },
      { status: 500 }
    );
  }
}
