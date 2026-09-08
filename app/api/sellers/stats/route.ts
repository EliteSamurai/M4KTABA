import { NextResponse } from 'next/server';
import { groq } from 'next-sanity';
import { readClient } from '@/studio-m4ktaba/client';

/**
 * Public, build-safe read endpoint returning the aggregate approved-review
 * stats (avg score + count) for one or more sellers.
 *
 * Client product cards have no direct Sanity read token, so they resolve their
 * seller rating through here. Only `status == 'approved'` reviews are counted,
 * so the response is safe to expose anonymously.
 *
 * GET /api/sellers/stats?ids=<sellerId>[,sellerId,...]
 * -> { [sellerId]: { rating, reviewCount } }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get('ids') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!ids.length) return NextResponse.json({});

  try {
    const rows = await (readClient as any).fetch(
      groq`*[_type == 'review'
              && status == 'approved'
              && seller._ref in $ids]{
           "sellerId": seller._ref,
           "score": score
         }`,
      { ids }
    );

    const grouped: Record<string, number[]> = {};
    for (const row of rows || []) {
      const key = row.sellerId;
      if (!key) continue;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(Number(row.score));
    }

    const out: Record<string, { rating: number; reviewCount: number }> = {};
    for (const [sellerId, scores] of Object.entries(grouped)) {
      out[sellerId] = {
        rating: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        reviewCount: scores.length,
      };
    }
    return NextResponse.json(out);
  } catch {
    // Build-safe: never break the page render if Sanity is unavailable.
    return NextResponse.json({});
  }
}
