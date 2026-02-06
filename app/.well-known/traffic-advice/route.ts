import { NextResponse } from 'next/server';

/**
 * Handle Chrome's Privacy Sandbox traffic-advice requests
 * This is a Chrome feature for privacy-preserving ad measurement
 * Returning 404 is acceptable, but we can also return an empty response
 */
export async function GET() {
  // Return empty JSON response to satisfy Chrome's request
  // This prevents 404 errors in logs
  return NextResponse.json({}, { status: 200 });
}
