import { createPaymentIntentWithDestinationCharge } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { CartItem } from "@/types/shipping-types";
import {
  begin,
  commit,
  deriveIdempotencyKey,
  fail,
  makeKey,
} from "@/lib/idempotency";
import { reportError } from "@/lib/sentry";
import { counter, withLatency } from "@/lib/metrics";

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

    // Derive orderId (client should provide when starting checkout) or make a deterministic one
    const orderId =
      (shippingDetails?.orderId as string | undefined) ||
      `${Date.now()}-${session.user._id}`;
    const userId = session.user._id as string;
    const step = "create";
    const headerKey = (req.headers.get("Idempotency-Key") || "").trim();
    const idemKey = headerKey || deriveIdempotencyKey(step, userId, orderId);
    const storeKey = makeKey(["pay", step, userId, orderId]);

    const start = await begin(storeKey);
    if (start && start.status === "committed" && start.result) {
      return NextResponse.json({ clientSecret: start.result.clientSecret });
    }

    // Determine single-seller vs multi-seller
    const sellerIds = Array.from(
      new Set(
        (cart as CartItem[])
          .map((i) => i.user?._id)
          .filter((v): v is string => typeof v === "string" && v.length > 0)
      )
    );
    const sellerStripeAccountId =
      sellerIds.length === 1 ? cart[0]?.user?.stripeAccountId || null : null;

    const lineItemIds = (cart as CartItem[]).map((i) => i.id);

    const pi = await withLatency("/api/create-payment-intent", () =>
      createPaymentIntentWithDestinationCharge({
        amountCents: Math.round(subtotal * 100),
        currency: "usd",
        buyerEmail: session.user.email,
        orderId,
        buyerId: userId,
        sellerStripeAccountId,
        sellerIds,
        lineItemIds,
        idempotencyKey: idemKey,
        metadata: {
          shippingDetails: JSON.stringify(shippingDetails),
        },
      })
    );

    await commit(storeKey, { clientSecret: pi.client_secret });
    counter("checkout_started").inc();
    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating payment intent:", error.message);
      reportError(error, { where: "create-payment-intent" });
      try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?._id as string | undefined;
        const orderId = undefined; // unknown here if failed before derivation
        if (userId && orderId)
          await fail(makeKey(["pay", "create", userId, orderId]));
      } catch {}

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
