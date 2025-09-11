# Security

- CSRF: A token is attached via middleware to GET page requests. Mutating routes validate `x-csrf-token` against the cookie token in production.
- CSP: Ensure Stripe endpoints are allowed; aim to remove `unsafe-inline` for scripts where possible.
- Connect onboarding: initiated server-side via `/api/connect/account-link`; no `client_id` in client bundle.
