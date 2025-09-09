import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeAccount } from "@/lib/account";
import { verifyCsrf } from "@/lib/csrf";

export async function POST(req: Request) {
  const csrf = verifyCsrf(req);
  if (csrf) return csrf;

  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user._id as string;

  const accountId = await getOrCreateStripeAccount(userId);
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}/billing?onboarding=refresh`,
    return_url: `${base}/billing?onboarding=success`,
    type: "account_onboarding",
  });
  return NextResponse.json({ url: link.url });
}
