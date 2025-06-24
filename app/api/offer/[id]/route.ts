import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeClient } from "@/studio-m4ktaba/client";
import { groq } from "next-sanity";
import { Resend } from "resend";
import Stripe from "stripe";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});
const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { action, counterAmount } = await req.json();
    const offerId = params.id;

    if (!action) {
      return NextResponse.json(
        { message: "Action is required" },
        { status: 400 }
      );
    }

    // Validate counterAmount if action is counter
    if (action === "counter" && (!counterAmount || counterAmount <= 0)) {
      return NextResponse.json(
        { message: "Valid counter offer amount is required" },
        { status: 400 }
      );
    }

    // Get the offer
    const offer = await writeClient.fetch(
      groq`*[_type == "offer" && _id == $offerId][0]{
        _id,
        book->{_id, title, price},
        buyer->{_id, email, name},
        seller->{_id, email, name},
        amount,
        status
      }`,
      { offerId }
    );

    if (!offer) {
      return NextResponse.json({ message: "Offer not found" }, { status: 404 });
    }

    // Verify seller is responding to their own offer (FIXED LOGIC)
    if (offer.seller._id !== session.user._id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Check if offer is still pending
    if (offer.status !== "pending") {
      return NextResponse.json(
        { message: "This offer has already been processed" },
        { status: 400 }
      );
    }

    let updatedOffer;
    let emailData;

    switch (action) {
      case "accept":
        // Create Stripe checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: offer.book.title,
                },
                unit_amount: Math.round(offer.amount * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
          metadata: {
            offerId: offer._id,
          },
        });

        updatedOffer = await writeClient
          .patch(offerId)
          .set({
            status: "accepted",
            stripeCheckoutId: checkoutSession.id,
            updatedAt: new Date().toISOString(),
          })
          .commit();

        emailData = {
          to: offer.buyer.email,
          subject: "🎉 Your Offer Has Been Accepted!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #16a34a;">Your Offer Has Been Accepted!</h1>
              <p>Great news! The seller has accepted your offer of <strong>$${offer.amount}</strong> for "${offer.book.title}".</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Next Steps:</strong></p>
                <p>Complete your purchase by clicking the button below:</p>
                <a href="${checkoutSession.url}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">Complete Purchase</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
            </div>
          `,
        };
        break;

      case "decline":
        updatedOffer = await writeClient
          .patch(offerId)
          .set({
            status: "declined",
            updatedAt: new Date().toISOString(),
          })
          .commit();

        emailData = {
          to: offer.buyer.email,
          subject: "Offer Update - M4KTABA",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #dc2626;">Offer Declined</h1>
              <p>The seller has declined your offer of <strong>$${offer.amount}</strong> for "${offer.book.title}".</p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p>Don't worry! You can make another offer if you'd like.</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/books/${offer.book._id}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">View Book</a>
              </div>
            </div>
          `,
        };
        break;

      case "counter":
        // Create new counter offer
        const counterOffer = await writeClient.create({
          _type: "offer",
          book: {
            _type: "reference",
            _ref: offer.book._id,
          },
          buyer: {
            _type: "reference",
            _ref: offer.buyer._id,
          },
          seller: {
            _type: "reference",
            _ref: offer.seller._id,
          },
          amount: counterAmount,
          status: "pending",
          isCounterOffer: true,
          parentOffer: {
            _type: "reference",
            _ref: offerId,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Update original offer
        updatedOffer = await writeClient
          .patch(offerId)
          .set({
            status: "countered",
            updatedAt: new Date().toISOString(),
          })
          .commit();

        emailData = {
          to: offer.buyer.email,
          subject: "💰 New Counter Offer Received",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">New Counter Offer Received</h1>
              <p>The seller has made a counter offer of <strong>$${counterAmount}</strong> for "${offer.book.title}".</p>
              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p><strong>Original Offer:</strong> $${offer.amount}</p>
                <p><strong>Counter Offer:</strong> $${counterAmount}</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/offers" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">View & Respond</a>
              </div>
            </div>
          `,
        };
        break;

      default:
        return NextResponse.json(
          { message: "Invalid action" },
          { status: 400 }
        );
    }

    // Send email notification
    if (emailData) {
      try {
        await resend.emails.send({
          from: "M4KTABA <contact@m4ktaba.com>",
          ...emailData,
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Continue even if email fails
      }
    }

    return NextResponse.json({ offer: updatedOffer });
  } catch (error) {
    console.error("Error handling offer response:", error);
    return NextResponse.json(
      { message: "Failed to process offer response" },
      { status: 500 }
    );
  }
}
