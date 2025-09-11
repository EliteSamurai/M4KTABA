import { NextResponse } from "next/server";
import { fetchOutboxOldest } from "@/lib/sanity-system";

export async function GET() {
  const items = await fetchOutboxOldest(100);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const { id } = await req.json();
  // no-op bump; consumer respects attempts internally using helpers
  return NextResponse.json({ ok: true });
}
