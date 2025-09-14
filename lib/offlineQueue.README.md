# Offline Queue (flag: offline_queue)

Purpose: Provide a safe wrapper for mutating fetches that queues requests when offline and retries when back online. Exposes a small subscription API to render an offline banner.

Usage:

- isOnline(): boolean
- subscribeOnlineStatus(cb): unsubscribe
- safeFetch(input, init): Promise<Response> — returns 202 (Queued) when offline
- drainQueue(): Promise<void>

Constraints:

- Queue is in-memory; if persistence is required, back it with IndexedDB.
- Only queue mutating methods (POST/PUT/PATCH/DELETE). GETs pass through.
- Use `useFlag("offline_queue")` to conditionally enable UI.
