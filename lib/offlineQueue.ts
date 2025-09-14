'use client';

// Offline banner + retry queue (flag: offline_queue)
// Queues POST/PUT/DELETE requests while navigator.onLine is false.
// Retries on backonline with FIFO order. Stores queue in memory only.

type QueuedRequest = {
  id: string;
  input: RequestInfo | URL;
  init?: RequestInit;
};

const listeners: Array<(online: boolean) => void> = [];
export function subscribeOnlineStatus(cb: (online: boolean) => void) {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

function notify(online: boolean) {
  listeners.forEach(l => {
    try {
      l(online);
    } catch {}
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => notify(true));
  window.addEventListener('offline', () => notify(false));
}

const queue: QueuedRequest[] = [];

export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

export function enqueueRequest(input: RequestInfo | URL, init?: RequestInit) {
  queue.push({ id: `${Date.now()}-${queue.length}`, input, init });
}

export async function drainQueue() {
  while (queue.length && isOnline()) {
    const item = queue.shift()!;
    try {
      await fetch(item.input, item.init);
    } catch {
      // put back and break to retry later
      queue.unshift(item);
      break;
    }
  }
}

// Wrapper around fetch for mutating requests that enqueues when offline
export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const isMutating = method !== 'GET' && method !== 'HEAD';
  const offline = (() => {
    try {
      if (
        typeof window !== 'undefined' &&
        (window as { navigator?: { onLine?: boolean } }).navigator?.onLine ===
          false
      )
        return true;
      if (
        typeof navigator !== 'undefined' &&
        (navigator as { onLine?: boolean }).onLine === false
      )
        return true;
      if (
        typeof (globalThis as { navigator?: { onLine?: boolean } })
          .navigator !== 'undefined' &&
        (globalThis as unknown as { navigator?: { onLine?: boolean } })
          .navigator?.onLine === false
      )
        return true;
      if (
        typeof (global as { navigator?: { onLine?: boolean } }) !==
          'undefined' &&
        (global as { navigator?: { onLine?: boolean } }).navigator?.onLine ===
          false
      )
        return true;
    } catch {}
    return false;
  })();
  if (isMutating && offline) {
    enqueueRequest(input, init);
    // return a synthetic 202 Accepted-like response
    return Promise.resolve({
      status: 202,
      statusText: 'Queued',
      ok: false,
    } as Response);
  }
  const res = await fetch(input, init);
  if (isMutating && isOnline()) {
    // opportunistically drain after a successful call
    drainQueue().catch(() => {});
  }
  return res;
}
