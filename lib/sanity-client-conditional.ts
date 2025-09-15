// Conditional Sanity client import utility
// This prevents build failures when Sanity environment variables are missing

let readClient: any = null;
let writeClient: any = null;

export function getSanityClients() {
  // Only initialize if not already done and environment variables are available
  if (!readClient && !writeClient && process.env.SANITY_PROJECT_ID && process.env.SANITY_DATASET) {
    try {
      const { readClient: rc, writeClient: wc } = require('@/studio-m4ktaba/client');
      readClient = rc;
      writeClient = wc;
    } catch (error) {
      console.warn('Sanity client not available - missing environment variables');
    }
  }
  
  return { readClient, writeClient };
}

export function isSanityConfigured(): boolean {
  return !!(process.env.SANITY_PROJECT_ID && process.env.SANITY_DATASET);
}
