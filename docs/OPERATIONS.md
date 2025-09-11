# Operations

Dashboards to watch:

- CSR errors (Sentry), API error rate, P95 latency by route, webhook backlog, DLQ size.
- Web Vitals from /api/vitals (ingressed via client emitter in app/vitals-client.tsx)

Alerts:

- Checkout failure rate > 3% for 5m
- Webhook backlog > 50 for 10m
- API latency P95 > 1s for 10m

Runbook:

- Kill switch: set NEXT_PUBLIC_FLAG_CHECKOUT_STATE_MACHINE=false
- Requeue DLQ: use internal queues admin page /internal/queues
- Workers: run `pnpm dev:workers` locally to start outbox/stripe consumers
- Postmortem: capture timeline, impact, root cause, action items
