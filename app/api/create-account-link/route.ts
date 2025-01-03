import { NextResponse, NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { client } from "@/studio-m4ktaba/client";

async function getUserById(userId: string) {
  const query = `*[_type == "user" && _id == $userId][0]{
      _id,
      email,
      stripeAccountId
    }`;

  try {
    const user = await client.fetch(query, { userId });

    if (!user) {
      console.error(`User with ID ${userId} not found`);
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user data");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      console.error("No userId provided in request body");
      return NextResponse.json(
        { error: "Missing userId in request body" },
        { status: 400 }
      );
    }

    // Fetch the user details
    const user = await getUserById(userId);
    if (!user || !user.stripeAccountId) {
      return NextResponse.json(
        { error: "User or Stripe Account ID not found" },
        { status: 400 }
      );
    }

    // Generate a Stripe dashboard link
    const loginLink = await stripe.accounts.createLoginLink(
      user.stripeAccountId
    );

    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    console.error("Error creating account dashboard link:", error);
    return NextResponse.json(
      { error: "Failed to create account dashboard link" },
      { status: 500 }
    );
  }
}
