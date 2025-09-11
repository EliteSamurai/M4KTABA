import { NextResponse } from "next/server";
import { dlqList } from "@/lib/sanity-system";
import { writeClient } from "@/lib/sanity-clients";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id: string | undefined = body?.id;
  let affected = 0;
  if (id) {
    const items = await dlqList(1);
    const item = items.find((x) => x._id === id);
    if (item) {
      await writeClient.create({
        _type: "event_outbox",
        type: item.queue || "unknown",
        payload: item.payload,
        created_at: new Date().toISOString(),
        attempts: 0,
      });
      await writeClient.delete(id);
      affected = 1;
    }
  } else {
    const items = await dlqList(100);
    for (const item of items) {
      await writeClient.create({
        _type: "event_outbox",
        type: item.queue || "unknown",
        payload: item.payload,
        created_at: new Date().toISOString(),
        attempts: 0,
      });
      await writeClient.delete(item._id);
      affected++;
    }
  }
  return NextResponse.json({ ok: true, affected });
}
