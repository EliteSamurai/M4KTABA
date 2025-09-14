import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeClient } from '@/studio-m4ktaba/client';
import { groq } from 'next-sanity';
import { Resend } from 'resend';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { bookId, sellerId, amount } = await req.json();

    // Validate input
    if (!bookId || !sellerId || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!session.user._id) {
      return NextResponse.json(
        { message: 'User ID not found in session' },
        { status: 400 }
      );
    }

    // Check existing offers for this book by this buyer
    const existingOffers = await (writeClient as any).fetch(
      groq`*[_type == "offer" && book._ref == $bookId && buyer._ref == $buyerId] {
        _id,
        status,
        isCounterOffer,
        _createdAt
      } | order(_createdAt desc)`,
      {
        bookId,
        buyerId: session.user._id,
      }
    );

    // Check if user has a pending offer
    const pendingOffer = existingOffers.find(
      (offer: { status: string }) => offer.status === 'pending'
    );
    if (pendingOffer) {
      return NextResponse.json(
        { message: 'You already have a pending offer for this book' },
        { status: 400 }
      );
    }

    // Check total number of offers (max 2 total offers allowed)
    if (existingOffers.length >= 2) {
      return NextResponse.json(
        {
          message:
            'You have reached the maximum number of offers for this book (2 total offers).',
        },
        { status: 400 }
      );
    }

    // If user has 1 declined offer, they can make 1 more offer
    const declinedOffers = existingOffers.filter(
      (offer: { status: string }) => offer.status === 'declined'
    );
    if (declinedOffers.length >= 1 && existingOffers.length >= 2) {
      return NextResponse.json(
        {
          message:
            'You have reached the maximum number of offers for this book.',
        },
        { status: 400 }
      );
    }

    // Create the offer
    const offer = await (writeClient as any).create({
      _type: 'offer',
      book: {
        _type: 'reference',
        _ref: bookId,
      },
      buyer: {
        _type: 'reference',
        _ref: session.user._id,
      },
      seller: {
        _type: 'reference',
        _ref: sellerId,
      },
      amount,
      status: 'pending',
      isCounterOffer: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Get seller and book details for email
    const [seller, book] = await Promise.all([
      (writeClient as any).fetch(
        groq`*[_type == "user" && _id == $sellerId][0]{ email, name }`,
        { sellerId }
      ),
      (writeClient as any).fetch(
        groq`*[_type == "book" && _id == $bookId][0]{ title }`,
        { bookId }
      ),
    ]);

    // Send email notification to seller
    if (seller?.email) {
      try {
        await resend.emails.send({
          from: 'M4KTABA <contact@m4ktaba.com>',
          to: seller.email,
          subject: '📚 New Offer Received - M4KTABA',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">New Offer Received!</h1>
              <p>You have received a new offer of <strong>$${amount}</strong> for your book "${book?.title}".</p>
              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p><strong>Book:</strong> ${book?.title}</p>
                <p><strong>Offer Amount:</strong> $${amount}</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/offers" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">View & Respond</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">You can accept, decline, or make a counter offer.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { message: 'Failed to create offer' },
      { status: 500 }
    );
  }
}
