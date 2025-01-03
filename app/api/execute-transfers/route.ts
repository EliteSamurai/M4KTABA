import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentIntentId, transfers } = await req.json();

    for (const transfer of transfers) {
      await stripe.transfers.create({
        amount: transfer.amount,
        currency: "usd",
        destination: transfer.destination,
        source_transaction: paymentIntentId, // Link to the payment
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
