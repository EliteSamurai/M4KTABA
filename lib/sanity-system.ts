import { readClient, writeClient } from "@/lib/sanity-clients";

export type EventOutbox = {
  _id: string;
  type: string;
  payload: unknown;
  created_at: string;
  processed_at?: string | null;
  attempts?: number;
  key?: string | null;
  orderId?: string | null;
};

export type DlqDoc = {
  _id: string;
  queue: string;
  payload: unknown;
  reason?: string;
  created_at: string;
  attempts?: number;
  last_error?: string;
};

export type StripeEventDoc = {
  _id: string;
  event_id: string;
  payload: unknown;
  intent_id?: string | null;
  created_at: string;
  processed_at?: string | null;
  attempts?: number;
};

export async function fetchOutboxOldest(limit = 50): Promise<EventOutbox[]> {
  return readClient.fetch(
    `*[_type == "event_outbox" && !defined(processed_at)] | order(created_at asc)[0...$limit]`,
    { limit }
  );
}

export async function markOutboxProcessed(id: string) {
  await writeClient
    .patch(id)
    .set({ processed_at: new Date().toISOString(), attempts: 1 })
    .commit();
}

export async function enqueueOutbox(
  type: string,
  payload: unknown,
  key?: string
) {
  if (key) {
    const existing = await readClient.fetch(
      `*[_type == "event_outbox" && key == $key][0]`,
      { key }
    );
    if (existing) return existing._id as string;
  }
  const doc = await writeClient.create({
    _type: "event_outbox",
    type,
    payload:
      typeof payload === "string" ? payload : JSON.stringify(payload ?? null),
    key: key || null,
    created_at: new Date().toISOString(),
    attempts: 0,
  });
  return doc._id as string;
}

export async function incOutboxAttemptsOrMoveToDLQ(id: string, reason: string) {
  const doc = await readClient.fetch(
    `*[_type == "event_outbox" && _id == $id][0]`,
    { id }
  );
  const attempts = (doc?.attempts || 0) + 1;
  if (attempts >= 5) {
    await writeClient.create({
      _type: "dlq",
      queue: "outbox",
      payload:
        typeof doc?.payload === "string"
          ? doc?.payload
          : JSON.stringify(doc?.payload ?? null),
      reason,
      created_at: new Date().toISOString(),
      attempts,
    });
    await writeClient.delete(id);
  } else {
    await writeClient.patch(id).set({ attempts }).commit();
  }
}

export async function dlqList(limit = 100): Promise<DlqDoc[]> {
  return readClient.fetch(
    `*[_type == "dlq"] | order(created_at desc)[0...$limit]`,
    { limit }
  );
}

export async function dlqRequeue(id: string) {
  const item = await readClient.fetch(`*[_type == "dlq" && _id == $id][0]`, {
    id,
  });
  if (item) {
    await writeClient.create({
      _type: "event_outbox",
      type: item.queue || "unknown",
      payload:
        typeof item.payload === "string"
          ? item.payload
          : JSON.stringify(item.payload ?? null),
      created_at: new Date().toISOString(),
      attempts: 0,
    });
    await writeClient.delete(id);
  }
}

export async function dlqPurge(id: string) {
  await writeClient.delete(id);
}

export async function stripeEventsUnprocessed(
  limit = 100
): Promise<StripeEventDoc[]> {
  return readClient.fetch(
    `*[_type == "stripe_events" && !defined(processed_at)] | order(created_at asc)[0...$limit]`,
    { limit }
  );
}

export async function markStripeEventProcessed(id: string) {
  await writeClient
    .patch(id)
    .set({ processed_at: new Date().toISOString(), attempts: 1 })
    .commit();
}

export async function incStripeEventAttemptsOrDLQ(id: string, reason: string) {
  const doc = await readClient.fetch(
    `*[_type == "stripe_events" && _id == $id][0]`,
    { id }
  );
  const attempts = (doc?.attempts || 0) + 1;
  if (attempts >= 5) {
    await writeClient.create({
      _type: "dlq",
      queue: "stripe_events",
      payload:
        typeof doc?.payload === "string"
          ? doc?.payload
          : JSON.stringify(doc?.payload ?? null),
      reason,
      created_at: new Date().toISOString(),
      attempts,
    });
    await writeClient.delete(id);
  } else {
    await writeClient.patch(id).set({ attempts }).commit();
  }
}
