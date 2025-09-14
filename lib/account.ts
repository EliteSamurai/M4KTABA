import { readClient, writeClient } from "@/studio-m4ktaba/client";
import { stripe } from "@/lib/stripe";

export async function getOrCreateStripeAccount(userId: string) {
    console.log("userId", userId);
    
  try {
    // Fetch user based on userId from session
    const user = await (readClient as any).fetch(
      `*[_type == "user" && _id == $userId][0]`,
      { userId }
    );

    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      throw new Error("User not found");
    }

    if (user.stripeAccountId) {
      return user.stripeAccountId;
    }

    // If no stripeAccountId, create a new Stripe account
    const account = await (stripe as any).accounts.create({
      type: "express",
      country: "US",
      business_type: "individual",
      business_profile: {
        name: "Seller on M4KTABA",
        product_description: "Selling Islamic books via M4KTABA",
        url: "https://www.m4ktaba.com",
        mcc: "5942", // You may need to update the MCC code if necessary
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Store the stripe account ID for the user
    await (writeClient as any)
      .patch(userId)
      .set({ stripeAccountId: account.id })
      .commit();

    return account.id;
  } catch (error) {
    console.error("Error while creating or fetching Stripe account:", error);
    throw new Error(
      "There was an issue with Stripe account creation or retrieval."
    );
  }
}
