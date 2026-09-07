import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { verifyCsrf } from '@/lib/csrf';
import { z } from 'zod';

// Phase 2: proof-of-purchase-gated, deduped reviews written into the `review`
// document (was: unauthenticated PATCH into user.ratings[]).
// NOTE: order/book _ids are Sanity-generated IDs (e.g. "zN9dkQTAaPz6IPeiY1paFE"),
// NOT UUIDs -> orderId must be validated with .min(1), NOT .uuid().
const reviewSchema = z.object({
  score: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
  orderId: z.string().min(1, 'orderId required'),
  bookId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    // (1) CSRF — mirrors app/api/orders/[orderId]/status/route.ts
    const csrf = await verifyCsrf();
    if (csrf) return csrf;

    // (2) Auth — fixes the prior "no auth" hole
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const reviewerId = session.user._id as string;
    const sessionEmail = session.user.email as string;

    const { sellerId } = await params;

    // (3) Body validation (zod)
    let bodyUnknown: unknown;
    try {
      bodyUnknown = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsed = reviewSchema.safeParse(bodyUnknown);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const { score, review, orderId, bookId } = parsed.data;

    // (4) Purchase-gate — buyer must own a DELIVERED order whose cart contains
    //     this seller. (cart[].user is an object at runtime; _id == seller.)
    const qualifying = await (readClient as any).fetch(
      `*[_type == "order"
          && _id == $orderId
          && userEmail == $sessionEmail
          && status == "delivered"
          && (
              $sellerId in cart[].user._ref ||
              $sellerId in cart[].user._id ||
              $sellerId in cart[].user.userId
            )
        ][0]{_id}`,
      { orderId, sessionEmail, sellerId }
    );
    if (!qualifying) {
      return NextResponse.json({ error: 'not_eligible' }, { status: 403 });
    }

    // (5) Dedup — one review per (reviewer, seller)
    const existing = await (writeClient as any).fetch(
      `*[_type == "review" && reviewer._ref == $reviewerId && seller._ref == $sellerId][0]{_id}`,
      { reviewerId, sellerId }
    );
    if (existing) {
      return NextResponse.json(
        { error: 'duplicate', existingId: existing._id },
        { status: 409 }
      );
    }

    // (6) Create the review document (v1 auto-approve; reportedBy empty; timestamps)
    // Resolve bookId (accepts a doc _id OR a product slug) into a strong ref by
    // the resolved document _id; omit the book ref when the doc is absent to
    // avoid "references non-existent document" mutation errors.
    let bookRef: { _type: 'reference'; _ref: string } | undefined;
    if (bookId) {
      const bookDoc = await (readClient as any).fetch(
        `*[_type == "book" && (_id == $bookId || slug.current == $bookId)][0]{_id}`,
        { bookId }
      );
      if (bookDoc?._id) {
        bookRef = { _type: 'reference', _ref: bookDoc._id };
      }
    }
    const now = new Date().toISOString();
    const created = await (writeClient as any).create({
      _type: 'review',
      seller: { _type: 'reference', _ref: sellerId },
      reviewer: { _type: 'reference', _ref: reviewerId },
      ...(orderId ? { order: { _type: 'reference', _ref: orderId } } : {}),
      ...(bookRef ? { book: bookRef } : {}),
      score,
      body: review,
      status: 'approved',
      reportedBy: [],
      createdAt: now,
      publishedAt: now,
    });

    return NextResponse.json(
      { reviewId: created._id, status: 'approved' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      {
        error: 'Error adding review',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
