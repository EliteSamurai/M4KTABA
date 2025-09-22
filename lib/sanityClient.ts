import { createClient } from '@sanity/client';

export const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  apiVersion: '2023-10-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: 'published',
});

// Helper function to check if Sanity is configured
export function isSanityConfigured(): boolean {
  return !!(
    process.env.SANITY_PROJECT_ID &&
    process.env.SANITY_DATASET &&
    process.env.SANITY_API_TOKEN
  );
}

// Helper function to get Sanity clients with error handling
export async function getSanityClients() {
  if (!isSanityConfigured()) {
    console.warn('Sanity not configured - missing environment variables');
    return { readClient: null, writeClient: null };
  }

  try {
    return { readClient: sanity, writeClient: sanity };
  } catch (error) {
    console.error('Failed to initialize Sanity clients:', error);
    return { readClient: null, writeClient: null };
  }
}
