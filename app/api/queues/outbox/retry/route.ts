import { NextResponse } from "next/server";
import { fetchOutboxOldest, markOutboxProcessed } from "@/lib/sanity-system";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id: string | undefined = body?.id;
  let affected = 0;
  if (id) {
    await markOutboxProcessed(id);
    affected = 1;
  } else {
    const batch = await fetchOutboxOldest(50);
    for (const doc of batch) {
      await markOutboxProcessed(doc._id);
      affected++;
    }
  }
  return NextResponse.json({ ok: true, affected });
}
