import crypto from 'crypto';

type IdempotencyStatus = 'pending' | 'committed' | 'failed';

type InMemoryEntry = {
  status: IdempotencyStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
  expiresAt: number; // epoch ms
};

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Lazy in-memory fallback (per server instance)
const memStore: Map<string, InMemoryEntry> = new Map();

// Optional Redis client (Upstash or ioredis-compatible)
let redis: {
  get: (k: string) => Promise<string | null>;
  set: (k: string, v: string, mode: string, ttlSec: number) => Promise<unknown>;
  del: (k: string) => Promise<unknown>;
} | null = null;

async function getRedis() {
  if (redis || !process.env.REDIS_URL) return redis;
  try {
    const { Redis } = await import('ioredis');
    // ioredis supports redis:// URLs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redis = new (Redis as any)(process.env.REDIS_URL);
  } catch {
    redis = null;
  }
  return redis;
}

export function makeKey(parts: (string | number | undefined | null)[]) {
  return parts.filter(Boolean).join(':');
}

export async function begin(key: string, ttlMs: number = DEFAULT_TTL_MS) {
  const r = await getRedis();
  const expiresAt = Date.now() + ttlMs;
  const payload = JSON.stringify({
    status: 'pending' as IdempotencyStatus,
    expiresAt,
  });
  if (r) {
    // NX means only set if not exists; PX sets expiry in ms (use EX seconds for ioredis signature compatibility)
    const ttlSec = Math.ceil(ttlMs / 1000);
    // emulate SET key val NX EX ttl
    const ok = await r.set(key, payload, 'NX', ttlSec);
    if (ok === null) {
      const existing = await r.get(key);
      return existing ? (JSON.parse(existing) as InMemoryEntry) : null;
    }
    return { status: 'pending', expiresAt } as InMemoryEntry;
  }
  const existing = memStore.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing;
  memStore.set(key, { status: 'pending', expiresAt });
  return memStore.get(key)!;
}

export async function commit(
  key: string, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any,
  ttlMs: number = DEFAULT_TTL_MS
) {
  const r = await getRedis();
  const expiresAt = Date.now() + ttlMs;
  const payload = JSON.stringify({
    status: 'committed' as IdempotencyStatus,
    result,
    expiresAt,
  });
  if (r) {
    const ttlSec = Math.ceil(ttlMs / 1000);
    await r.set(key, payload, 'EX', ttlSec);
    return;
  }
  memStore.set(key, { status: 'committed', result, expiresAt });
}

export async function fail(key: string) {
  const r = await getRedis();
  if (r) {
    await r.del(key);
    return;
  }
  memStore.delete(key);
}

// Helper to derive a deterministic idempotency key if header not provided
export function deriveIdempotencyKey(
  step: string,
  userId: string,
  orderId: string
) {
  const raw = `${step}|${userId}|${orderId}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}
