'use client';

import { useEffect, useState } from 'react';

export interface SellerStats {
  rating: number;
  reviewCount: number;
}

type StatsMap = Record<string, SellerStats>;

// Module-level cache + subscriber set so every mounted ProductCard on a page
// shares a single batched request instead of hammering /api per card.
const cache: StatsMap = {};
const subscribers = new Set<() => void>();
let pending: string[] | null = null;

function notify() {
  subscribers.forEach((cb) => cb());
}

async function flush() {
  const ids = (pending ?? []).filter((id) => !(id in cache));
  pending = null;
  if (!ids.length) return;
  try {
    const res = await fetch(
      `/api/sellers/stats?ids=${encodeURIComponent(ids.join(','))}`
    );
    const map = (await res.json()) as Record<
      string,
      { rating: number; reviewCount: number }
    >;
    for (const [id, stats] of Object.entries(map)) {
      cache[id] = {
        rating: Number(stats.rating) || 0,
        reviewCount: Number(stats.reviewCount) || 0,
      };
    }
    for (const id of ids) {
      if (!(id in cache)) cache[id] = { rating: 0, reviewCount: 0 };
    }
  } catch {
    for (const id of ids) cache[id] = { rating: 0, reviewCount: 0 };
  }
  notify();
}

function schedule(id: string) {
  if (!pending) {
    pending = [id];
    queueMicrotask(flush);
  } else if (!pending.includes(id)) {
    pending.push(id);
  }
}

/**
 * Aggregate approved-review stats for a seller, fetched once per page (batched
 * across all mounted product cards) and cached for the session. Returns
 * `undefined` until the value resolves, so callers can degrade gracefully
 * (seller link shown, stars withheld until data lands).
 */
export function useSellerStats(sellerId?: string | null): SellerStats | undefined {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!sellerId) return;
    const emit = () => setTick((t) => t + 1);
    subscribers.add(emit);
    if (!(sellerId in cache)) schedule(sellerId);
    return () => {
      subscribers.delete(emit);
    };
  }, [sellerId]);

  if (!sellerId) return undefined;
  return cache[sellerId];
}
