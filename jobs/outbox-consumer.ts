import "../scripts/env/load";
/* eslint-disable no-console */
import { setTimeout as sleep } from "node:timers/promises";
import { retryAsync } from "@/lib/retry";
import {
  fetchOutboxOldest,
  incOutboxAttemptsOrMoveToDLQ,
  markOutboxProcessed,
} from "@/lib/sanity-system";

type OutboxItem = { _id: string; type: string; payload: any };

const MAX_ATTEMPTS = 5;
const POLL_MS = 1500;

const handlers: Record<string, (payload: any) => Promise<void>> = {
  "email.order_paid": async (_payload) => {
    // TODO: integrate with lib/email; noop for now
    await Promise.resolve();
  },
  "analytics.checkout_succeeded": async (_payload) => {
    await Promise.resolve();
  },
};

async function pollOnce() {
  const items: OutboxItem[] = await fetchOutboxOldest(25);
  for (const it of items) {
    const payload =
      typeof it.payload === "string" ? safeParse(it.payload) : it.payload;
    const handler = handlers[it.type];
    if (!handler) {
      await incOutboxAttemptsOrMoveToDLQ(it._id, `no handler: ${it.type}`);
      continue;
    }
    try {
      await retryAsync(() => handler(payload), {
        retries: 3,
        factor: 1.8,
        minDelayMs: 200,
        maxDelayMs: 2000,
        jitter: true,
      });
      await markOutboxProcessed(it._id);
    } catch (err: any) {
      await incOutboxAttemptsOrMoveToDLQ(it._id, String(err?.message || err));
    }
  }
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

let running = true;
process.on("SIGINT", () => (running = false));
process.on("SIGTERM", () => (running = false));

(async function main() {
  console.log("[outbox] consumer started");
  while (running) {
    try {
      await pollOnce();
      await sleep(POLL_MS);
    } catch (e) {
      console.error("[outbox] loop error", e);
      await sleep(2000);
    }
  }
  console.log("[outbox] consumer stopped");
})();
