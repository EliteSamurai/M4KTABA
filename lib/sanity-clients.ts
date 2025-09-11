import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION || "2023-10-01";

const token = process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_TOKEN;

function missing(name: string) {
  return `Missing ${name}. Add it to your .env.local (project root) or export it in your shell. Required: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION, SANITY_WRITE_TOKEN or SANITY_API_TOKEN.`;
}

function invariant(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Only validate during runtime, not during build
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  invariant(projectId, missing("SANITY_PROJECT_ID"));
  invariant(dataset, missing("SANITY_DATASET"));
}

export const readClient = createClient({
  projectId: projectId || "dummy",
  dataset: dataset || "dummy",
  apiVersion,
  useCdn: true,
  perspective: "published",
});

export const writeClient = createClient({
  projectId: projectId || "dummy",
  dataset: dataset || "dummy",
  apiVersion,
  token,
  useCdn: false,
  perspective: "published",
});

export async function assertWritePermissions() {
  if (!token) {
    throw new Error(
      [
        "Sanity write token missing.",
        "Set SANITY_WRITE_TOKEN or SANITY_API_TOKEN in your environment.",
        "Generate a token in https://manage.sanity.io → API → Tokens with Editor/write permissions.",
        `Project: ${projectId || "unknown"}  Dataset: ${dataset || "unknown"}`,
      ].join("\n")
    );
  }
  const probeId = `perm_probe.${Math.random().toString(36).slice(2)}`;
  try {
    await writeClient.create({
      _id: probeId,
      _type: "sanity_perm_probe",
      note: "probe",
    });
    await writeClient.delete(probeId);
  } catch (err: any) {
    const msg =
      err?.response?.body?.error?.description || err?.message || String(err);
    if (err?.statusCode === 401 || err?.statusCode === 403) {
      throw new Error(
        [
          "Sanity write permission check FAILED (401/403).",
          `Project: ${projectId || "unknown"}  Dataset: ${dataset || "unknown"}`,
          `Client message: ${msg}`,
          "Fix: create a token with Editor/write scope and set SANITY_WRITE_TOKEN (or SANITY_API_TOKEN).",
        ].join("\n")
      );
    }
    throw err;
  }
}
