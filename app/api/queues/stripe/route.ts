import { NextResponse } from "next/server";
import { stripeEventsUnprocessed } from "@/lib/sanity-system";

export async function GET() {
  const items = await stripeEventsUnprocessed(100);
  return NextResponse.json({ items });
}

export async function POST() {
  // placeholder to match admin fetch shape
  return NextResponse.json({ ok: true });
}
