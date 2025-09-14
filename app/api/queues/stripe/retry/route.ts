import { NextResponse } from 'next/server';
import {
  markStripeEventProcessed,
  stripeEventsUnprocessed,
} from '@/lib/sanity-system';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id: string | undefined = body?.id;
  let affected = 0;
  if (id) {
    await markStripeEventProcessed(id);
    affected = 1;
  } else {
    const items = await stripeEventsUnprocessed(50);
    for (const it of items) {
      await markStripeEventProcessed(it._id);
      affected++;
    }
  }
  return NextResponse.json({ ok: true, affected });
}
