import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { CartItem } from "@/types/shipping-types";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  try {
    const { cart, shippingDetails } = await req.json();
    // console.log(cart, shippingDetails);

    if (!cart || cart.length === 0) {
      throw new Error("Cart is empty. Please add items before checkout.");
    }

    // Calculate subtotal
    const subtotal = cart.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );

    if (subtotal <= 0) {
      throw new Error("Invalid cart total. Please check your items.");
    }

    if (
      !shippingDetails ||
      !shippingDetails.name ||
      !shippingDetails.street1 ||
      !shippingDetails.city ||
      !shippingDetails.state ||
      !shippingDetails.zip ||
      !shippingDetails.country
    ) {
      return NextResponse.json(
        { error: "Invalid or incomplete shipping details." },
        { status: 400 }
      );
    }

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No buyer email found in session" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(subtotal * 100),
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },

      metadata: {
        shippingDetails: JSON.stringify(shippingDetails),
        userEmail: session.user.email,
      },
      receipt_email: session.user.email,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating payment intent:", error.message);

      // Handle Stripe-specific error types
      if ("type" in error && error.type === "StripeInvalidRequestError") {
        return NextResponse.json(
          { error: "Invalid request to Stripe. Please contact support." },
          { status: 400 }
        );
      } else if (
        "type" in error &&
        error.type === "StripeAuthenticationError"
      ) {
        return NextResponse.json(
          {
            error: "Authentication with Stripe failed. Please try again later.",
          },
          { status: 500 }
        );
      }

      // Generic error handling
      return NextResponse.json(
        { error: error.message || "Internal server error." },
        { status: 500 }
      );
    } else {
      // If the error is not an instance of Error (e.g., it could be a string or something else)
      console.error("An unknown error occurred:", error);
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
}
