import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getSanityClients, isSanityConfigured } from '@/lib/sanityClient';
import { listingUpdateSchema } from '@/lib/validation/listingSchema';

/**
 * Bridge a listing-shaped payload onto `book` schema fields (consolidation (a)).
 * `listing` is the legacy/orphaned type; `book` is canonical.
 *   condition  -> selectedCondition     (identical enum: new|like-new|good|fair|poor)
 *   category   -> selectedCategory      (title string -> category reference, resolved by title)
 *   images     -> photos                (asset _ref strings -> image objects; mirrors POST /api/listings create)
 *   isbn / currency are listing-only and intentionally dropped (book has no such fields)
 */
export async function mapListingToBookFields(
  readClient: any,
  data: Record<string, any>
): Promise<Record<string, any>> {
  const bookUpdates: Record<string, any> = {};

  if (data.title !== undefined) bookUpdates.title = data.title;
  if (data.author !== undefined) bookUpdates.author = data.author;
  if (data.description !== undefined) bookUpdates.description = data.description;
  if (data.price !== undefined) bookUpdates.price = data.price;
  if (data.quantity !== undefined) bookUpdates.quantity = data.quantity;
  if (data.language !== undefined) bookUpdates.language = data.language;
  if (data.condition !== undefined) bookUpdates.selectedCondition = data.condition;

  if (data.status !== undefined) {
    // Normalize the legacy uppercase listing status onto book's lowercase enum.
    const STATUS_MAP: Record<string, string> = {
      DRAFT: 'draft',
      PUBLISHED: 'published',
      ARCHIVED: 'hidden',
    };
    bookUpdates.status =
      STATUS_MAP[String(data.status)] ?? String(data.status).toLowerCase();
  }

  if (data.images && Array.isArray(data.images) && data.images.length) {
    bookUpdates.photos = data.images.map((imageRef: string, index: number) => ({
      _type: 'image',
      _key: `photo-${index}-${Date.now()}`,
      asset: {
        _type: 'reference',
        _ref: imageRef,
      },
    }));
  }

  if (data.category !== undefined && data.category) {
    try {
      const existingCategory = await readClient.fetch(
        `*[_type == "category" && title == $categoryTitle][0]`,
        { categoryTitle: data.category }
      );
      if (existingCategory) {
        bookUpdates.selectedCategory = {
          _type: 'reference',
          _ref: existingCategory._id,
        };
      } else {
        console.warn(
          'mapListingToBookFields: category not found, omitting selectedCategory:',
          data.category
        );
      }
    } catch (error) {
      console.warn('mapListingToBookFields: failed to resolve category reference:', error);
    }
  }

  return bookUpdates;
}

export async function GET(
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

        // Fetch book (consolidated from the legacy `listing` type — see plan (a))
    const listing = await readClient.fetch(
      `*[_type == "book" && _id == $id && user._ref == $userId][0]{
        _id,
        _type,
        title,
        author,
        description,
        price,
        quantity,
        selectedCondition,
        status,
        views,
        sales,
        revenue,
        language,
        publishedAt,
        _createdAt,
        _updatedAt,
        "selectedCategory": selectedCategory->{
          _id,
          title
        },
        "photos": photos[]{
          _key,
          asset->{
            _ref,
            url
          }
        }
      }`,
      { id: params.id, userId: session.user._id }
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

    // Bridge the listing-shaped update payload onto `book` schema fields
    // (condition -> selectedCondition, category -> selectedCategory ref,
    //  images -> photos; isbn/currency are listing-only -> dropped).
    const bookUpdates = await mapListingToBookFields(readClient, updateData);

    // Update book in Sanity
    const updatedListing = await writeClient
      .patch(params.id)
      .set({
        ...bookUpdates,
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
