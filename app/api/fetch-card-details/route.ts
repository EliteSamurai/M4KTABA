import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const { stripeAccountId } = await req.json();

    if (!stripeAccountId) {
      return NextResponse.json(
        { message: "Stripe Account ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the Stripe account
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // Check account requirements
    const { requirements } = account;
    const currentlyDue = requirements?.currently_due ?? [];

    // Handle restricted accounts
    if (currentlyDue?.length > 0) {
      return NextResponse.json({
        status: "needs_attention",
        message: "Additional information is required to lift restrictions.",
        requirements: currentlyDue,
      });
    }

    // Fetch external accounts (e.g., cards)
    const externalAccounts = await stripe.accounts.listExternalAccounts(
      stripeAccountId,
      {
        object: "card",
        limit: 1,
      }
    );

    const card = externalAccounts.data[0] || null;

    return NextResponse.json({ status: "active", card });
  } catch (error: any) {
    console.error("Error fetching account details:", error);

    return NextResponse.json(
      { error: error.message || "Failed to retrieve account details" },
      { status: 500 }
    );
  }
}
