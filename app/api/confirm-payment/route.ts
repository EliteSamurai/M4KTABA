import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import {
  begin,
  commit,
  deriveIdempotencyKey,
  fail,
  makeKey,
} from "@/lib/idempotency";
import { withLatency } from "@/lib/metrics";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { paymentIntentId, orderId } = await req.json();
  if (!paymentIntentId || !orderId) {
    return NextResponse.json(
      { error: "Missing paymentIntentId or orderId" },
      { status: 400 }
    );
  }

  const userId = session.user._id as string;
  const step = "confirm";
  const headerKey = (req.headers.get("Idempotency-Key") || "").trim();
  const idemKey = headerKey || deriveIdempotencyKey(step, userId, orderId);
  const storeKey = makeKey(["pay", step, userId, orderId]);
  const start = await begin(storeKey);
  if (start && start.status === "committed" && start.result) {
    return NextResponse.json(start.result);
  }

  const pi = await withLatency("/api/confirm-payment", () =>
    stripe.paymentIntents.confirm(
      paymentIntentId,
      {},
      { idempotencyKey: idemKey }
    )
  );
  await commit(storeKey, { status: pi.status });
  return NextResponse.json({ status: pi.status });
}
