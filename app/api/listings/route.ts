import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { getSanityClients, isSanityConfigured } from '@/lib/sanityClient';
import { listingCreateSchema } from '@/lib/validation/listingSchema';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Session in listings API:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?._id,
      stripeAccountId: session?.user?.stripeAccountId,
    });

    if (!session?.user?._id) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has Stripe account set up
    if (!session?.user?.stripeAccountId) {
      return NextResponse.json(
        {
          code: 'STRIPE_ACCOUNT_REQUIRED',
          message:
            'Please complete your Stripe setup in the Billing section before creating listings.',
        },
        { status: 403 }
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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = listingCreateSchema.safeParse({
      ...body,
      sellerId: session.user._id,
    });

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

    const listingData = validationResult.data;

    // Create listing in Sanity as a book document
    // Map listing fields to book schema fields

    // Find or create category reference
    let categoryRef = null;
    if (listingData.category) {
      try {
        // Try to find existing category
        const existingCategory = await readClient.fetch(
          `*[_type == "category" && title == $categoryTitle][0]`,
          { categoryTitle: listingData.category }
        );

        if (existingCategory) {
          categoryRef = {
            _type: 'reference',
            _ref: existingCategory._id,
          };
        } else {
          // Create new category if it doesn't exist
          const newCategory = await writeClient.create({
            _type: 'category',
            title: listingData.category,
          });
          categoryRef = {
            _type: 'reference',
            _ref: newCategory._id,
          };
        }
      } catch (error) {
        console.warn('Failed to handle category reference:', error);
      }
    }

    // Find user reference
    let userRef = null;
    if (listingData.sellerId) {
      try {
        // Try to find existing user
        const existingUser = await readClient.fetch(
          `*[_type == "user" && _id == $userId][0]`,
          { userId: listingData.sellerId }
        );

        if (existingUser) {
          userRef = {
            _type: 'reference',
            _ref: existingUser._id,
          };
        }
      } catch (error) {
        console.warn('Failed to handle user reference:', error);
      }
    }

    const bookData = {
      _type: 'book',
      title: listingData.title,
      author: listingData.author,
      description: listingData.description,
      selectedCondition: listingData.condition,
      price: listingData.price,
      quantity: listingData.quantity,
      status: 'published', // Explicitly set status to published
      ...(categoryRef && { selectedCategory: categoryRef }),
      ...(userRef && { user: userRef }),
      photos: listingData.images.map((imageRef, index) => ({
        _type: 'image',
        _key: `photo-${index}-${Date.now()}`,
        asset: {
          _type: 'reference',
          _ref: imageRef,
        },
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdListing = await writeClient.create(bookData);

    // Fetch the created book with populated image data to return to client
    const populatedBook = await readClient.fetch(
      `*[_type == "book" && _id == $id][0]{
        _id,
        title,
        author,
        description,
        price,
        quantity,
        selectedCondition,
        "photos": photos[]{
          _key,
          asset->{
            _ref,
            url
          }
        },
        "user": user->{
          _id,
          name,
          email
        },
        "selectedCategory": selectedCategory->{
          _id,
          title
        }
      }`,
      { id: createdListing._id }
    );

    return NextResponse.json(
      {
        id: createdListing._id,
        message: 'Listing created successfully',
        book: populatedBook,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create listing',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    // Get user's listings
    const listings = await readClient.fetch(
      `*[_type == "listing" && sellerId == $sellerId] | order(createdAt desc)`,
      { sellerId: session.user._id }
    );

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch listings',
      },
      { status: 500 }
    );
  }
}
