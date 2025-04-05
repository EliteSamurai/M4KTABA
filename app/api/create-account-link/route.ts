import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { readClient } from "@/studio-m4ktaba/client";

async function getUserById(userId: string) {
  const query = `*[_type == "user" && _id == $userId][0]{
    _id,
    email,
    stripeAccountId
  }`;

  const user = await readClient.fetch(query, { userId });

  if (!user) throw new Error("User not found");

  return user;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    console.log("Fetching user data for userId:", userId);

    // Fetch user from Sanity
    const user = await getUserById(userId);

    if (!user) {
      console.error("User not found for ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.stripeAccountId) {
      console.log("Stripe account not found for user:", userId);

      // Redirect to onboarding URL if no Stripe account ID is found
      const onboardingUrl = await stripe.accountLinks.create({
        account: userId, // Stripe Account ID needed here
        refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/refresh`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`,
        type: "account_onboarding",
      });

      return NextResponse.json({
        status: "needs_onboarding",
        url: onboardingUrl.url,
      });
    }

    console.log(
      "Fetching Stripe account for stripeAccountId:",
      user.stripeAccountId
    );
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    console.log("Stripe account details:", account);

    // Check if the account is onboarded
    if (
      account?.capabilities?.card_payments === "active" &&
      account?.capabilities?.transfers === "active"
    ) {
      // Account is fully onboarded, create login link
      const loginLink = await stripe.accounts.createLoginLink(
        user.stripeAccountId
      );
      console.log("Stripe login link generated:", loginLink.url);
      return NextResponse.json({ url: loginLink.url });
    }

    // If the account isn't fully onboarded, send the onboarding link again
    const onboardingUrl = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      status: "needs_onboarding",
      url: onboardingUrl.url,
    });
  } catch (error) {
    console.error("Error generating Stripe login link:", error);
    return NextResponse.json(
      {
        error: `Failed to generate Stripe login link: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
