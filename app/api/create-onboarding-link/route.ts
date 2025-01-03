import Stripe from "stripe";
import { client } from "@/studio-m4ktaba/client"; // Adjust to your Sanity client path
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

// Function to save Stripe Account ID to Sanity
async function saveStripeAccountId(userId: string, stripeAccountId: string) {
  try {
    await client.patch(userId).set({ stripeAccountId }).commit();
    console.log(`Stripe Account ID saved: ${stripeAccountId}`);
  } catch (error) {
    console.error("Error saving Stripe Account ID to Sanity:", error);
    throw new Error("Failed to save Stripe Account ID to database");
  }
}

// Function to fetch Stripe Account ID from Sanity
async function fetchStripeAccountIdFromDatabase(
  userId: string
): Promise<string | null> {
  const user = await client.fetch(`*[_type == "user" && _id == $userId][0]`, {
    userId,
  });
  return user?.stripeAccountId || null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    // Fetch existing Stripe account ID from your database
    let accountId = await fetchStripeAccountIdFromDatabase(userId);
    if (!accountId) {
      const forwarded = req.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

      // Create a new Stripe Express account
      const account = await stripe.accounts.create({
        type: "express", // Use 'express' instead of 'custom' or 'standard'
        country: "US",
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        
        business_profile: {
          product_description: "Platform for selling books",
        },
      });

      // Save the new account ID to your database
      await saveStripeAccountId(userId, account.id);
      accountId = account.id;
    }

    // Generate an onboarding link for the user to complete onboarding
    const onboardingUrl = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      status: "needs_onboarding",
      url: onboardingUrl.url,
    });
  } catch (error: any) {
    console.error("Error creating Stripe account:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
