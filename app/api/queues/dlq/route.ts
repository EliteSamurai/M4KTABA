import { NextResponse } from "next/server";
import { readClient } from "@/studio-m4ktaba/client";

export async function GET() {
  const items = await (readClient as any).fetch(
    `*[_type == "dlq"] | order(created_at desc)[0...100]`
  );
  return NextResponse.json({ items });
}
