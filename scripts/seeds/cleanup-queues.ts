import "../env/load";
/* eslint-disable no-console */
import {
  readClient,
  writeClient,
  assertWritePermissions,
} from "@/lib/sanity-clients";
/* eslint-disable no-console */

async function preflight() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Do not cleanup in production");
  await assertWritePermissions();
}

async function main() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Do not cleanup in production");
  const ids: string[] = await readClient.fetch(
    `array::compact((*[ _type in ["event_outbox","dlq","stripe_events"]]._id))`
  );
  for (const id of ids) {
    await writeClient.delete(id);
  }
  console.log(`Deleted ${ids.length} docs from queues types`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
