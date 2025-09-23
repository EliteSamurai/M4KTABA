import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION || '2023-10-01';

const token = process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_TOKEN;

function missing(name: string) {
  return `Missing ${name}. Add it to your .env.local (project root) or export it in your shell. Required: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION, SANITY_WRITE_TOKEN or SANITY_API_TOKEN.`;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Only validate during runtime, not during build
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
  invariant(projectId, missing('SANITY_PROJECT_ID'));
  invariant(dataset, missing('SANITY_DATASET'));
}

// Create build-safe clients
function createBuildSafeClient() {
  if (!projectId || !dataset || projectId === 'dummy' || dataset === 'dummy' || process.env.NODE_ENV === 'development') {
    // Return mock client during build time or when env vars are missing
    return {
      fetch: async () => [],
      create: async () => ({ _id: 'mock' }),
      delete: async () => ({ _id: 'mock' }),
    } as unknown as Partial<ReturnType<typeof createClient>>;
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
    perspective: 'published',
  });
}

function createBuildSafeWriteClient() {
  if (!projectId || !dataset || projectId === 'dummy' || dataset === 'dummy' || process.env.NODE_ENV === 'development') {
    // Return mock client during build time or when env vars are missing
    return {
      fetch: async () => [],
      create: async () => ({ _id: 'mock' }),
      delete: async () => ({ _id: 'mock' }),
    } as unknown as Partial<ReturnType<typeof createClient>>;
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: 'published',
  });
}

export const readClient = createBuildSafeClient();
export const writeClient = createBuildSafeWriteClient();

export async function assertWritePermissions() {
  if (!token) {
    throw new Error(
      [
        'Sanity write token missing.',
        'Set SANITY_WRITE_TOKEN or SANITY_API_TOKEN in your environment.',
        'Generate a token in https://manage.sanity.io → API → Tokens with Editor/write permissions.',
        `Project: ${projectId || 'unknown'}  Dataset: ${dataset || 'unknown'}`,
      ].join('\n')
    );
  }
  const probeId = `perm_probe.${Math.random().toString(36).slice(2)}`;
  try {
    await (writeClient as any).create({
      _id: probeId,
      _type: 'sanity_perm_probe',
      note: 'probe',
    });
    await (writeClient as any).delete(probeId);
  } catch (err: unknown) {
    const msg =
      (err as any)?.response?.body?.error?.description ||
      (err as any)?.message ||
      String(err);
    if ((err as any)?.statusCode === 401 || (err as any)?.statusCode === 403) {
      throw new Error(
        [
          'Sanity write permission check FAILED (401/403).',
          `Project: ${projectId || 'unknown'}  Dataset: ${dataset || 'unknown'}`,
          `Client message: ${msg}`,
          'Fix: create a token with Editor/write scope and set SANITY_WRITE_TOKEN (or SANITY_API_TOKEN).',
        ].join('\n')
      );
    }
    throw err;
  }
}
