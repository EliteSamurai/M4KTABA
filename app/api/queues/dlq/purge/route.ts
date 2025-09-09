import { NextResponse } from "next/server";
import { dlqList } from "@/lib/sanity-system";
import { writeClient } from "@/lib/sanity-clients";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id: string | undefined = body?.id;
  let affected = 0;
  if (id) {
    await writeClient.delete(id);
    affected = 1;
  } else {
    const items = await dlqList(100);
    for (const item of items) {
      await writeClient.delete(item._id);
      affected++;
    }
  }
  return NextResponse.json({ ok: true, affected });
}
