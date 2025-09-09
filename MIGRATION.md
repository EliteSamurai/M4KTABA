# Migration Notes

Env additions:

- REDIS_URL (optional; enables cross-instance idempotency)
- PLATFORM_FEE_BPS (optional; integer basis points, default 0)
- STRIPE_WEBHOOK_SECRET (required for webhook verification)
- CHECKOUT_V2_ENABLED (true/false)
- CHECKOUT_V2_PERCENT (0-100)
- BUNDLE_BUDGET_BYTES (optional, default 200000)
- SANITY_PROJECT_ID (required)
- SANITY_DATASET (required)
- SANITY_API_VERSION (optional, default 2023-10-01)
- SANITY_API_TOKEN or SANITY_WRITE_TOKEN (write-capable; Editor role or custom with create/update/delete)

Rollout steps:

1. Set env vars in your deployment.
2. Deploy server; verify /api/health returns 200.
3. Rotate Stripe webhook to point at /api/webhooks/stripe-webhook and set STRIPE_WEBHOOK_SECRET.
4. Test single-seller checkout end-to-end; verify destination charges with application fee in Stripe dashboard.
5. Confirm CSRF by attempting POST without header (expect 403) and with header (expect 200).
6. Configure CI secrets if needed (Stripe test keys) for E2E.
7. For Sanity writes: generate a token in manage.sanity.io → API → Tokens with Editor permissions and set SANITY_WRITE_TOKEN or SANITY_API_TOKEN. CORS does not apply to server-side writes.
