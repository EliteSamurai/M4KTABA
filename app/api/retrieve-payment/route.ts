import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paymentIntentId = searchParams.get("payment_intent");

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment Intent ID is required" },
        { status: 400 }
      );
    }

    // Retrieve PaymentIntent
    const paymentIntent = await (stripe as any).paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: "Payment Intent not found" },
        { status: 404 }
      );
    }

    // Get the latest charge
    const charges = await (stripe as any).charges.list({
      payment_intent: paymentIntentId,
      limit: 1, // We only need the most recent charge
    });

    const receiptUrl = charges.data[0]?.receipt_url || null;

    return NextResponse.json({
      success: true,
      receiptUrl,
      metadata: paymentIntent.metadata, // Include metadata for cart details
    });
  } catch (error) {
    console.error("Error retrieving PaymentIntent:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}
