# 🚨 Critical Environment Variables

## Must-Have for Production

### Authentication (Critical)

```bash
NEXTAUTH_SECRET=your-32-char-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app
GOOGLE_ID=your-google-oauth-client-id
GOOGLE_SECRET=your-google-oauth-client-secret
```

### Sanity (Critical)

```bash
SANITY_PROJECT_ID=your-sanity-project-id
SANITY_DATASET=production
SANITY_API_TOKEN=your-sanity-api-token
```

### Stripe (Critical)

```bash
STRIPE_SECRET_KEY=sk_live_your-live-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-live-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-live-publishable-key
```

### Application (Critical)

```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NODE_ENV=production
```

## Fly.io Workers Only

```bash
REDIS_URL=redis://your-redis-url
SANITY_WRITE_TOKEN=your-sanity-write-token
```

## Quick Validation Commands

```bash
# Check all platforms
pnpm validate:production

# Check Vercel only
pnpm validate:vercel

# Check Fly.io only
pnpm validate:fly
```

## 🚨 Common Issues

1. **NEXTAUTH_SECRET**: Must be 32+ characters, use: `openssl rand -base64 32`
2. **Stripe Keys**: Must use `sk_live_` and `pk_live_` for production
3. **URLs**: Must use `https://` for production
4. **Sanity Dataset**: Must exist in your Sanity project
5. **Redis URL**: Required for Fly.io workers

## 🔗 Quick Links

- [Vercel Environment Variables](https://vercel.com/dashboard/project/settings/environment-variables)
- [Fly.io Secrets](https://fly.io/dashboard/apps/your-app/secrets)
- [Sanity API Tokens](https://sanity.io/manage/project/your-project/api)
- [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
