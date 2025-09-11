# 🚀 M4ktaba Production Deployment Guide

## Prerequisites

- [ ] GitHub PR merged to main
- [ ] Vercel account with project created
- [ ] Fly.io account with app created
- [ ] Sanity project configured
- [ ] Stripe account with live keys

## 1. Vercel Configuration

### Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Copy and paste these variables (replace placeholder values):

```bash
# Authentication & Security
NEXTAUTH_SECRET=your-production-secret-32-chars-min
NEXTAUTH_URL=https://your-domain.vercel.app
GOOGLE_ID=your-google-oauth-client-id
GOOGLE_SECRET=your-google-oauth-client-secret

# Database & Storage
SANITY_PROJECT_ID=your-sanity-project-id
SANITY_DATASET=your-sanity-dataset
SANITY_API_VERSION=2023-10-01
SANITY_API_TOKEN=your-sanity-api-token

# Payment Processing (Production)
STRIPE_SECRET_KEY=sk_live_your-live-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-live-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-live-publishable-key

# Email Services
SMTP_HOST=your-production-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SUPPORT_EMAIL=contact@yourdomain.com
RESEND_API_KEY=your-resend-api-key
MAILCHIMP_API_KEY=your-mailchimp-api-key

# Application Configuration
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NODE_ENV=production

# External Services
EASYPOST_API_KEY=your-easypost-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Feature Flags
CHECKOUT_V2_ENABLED=true
CHECKOUT_V2_PERCENT=1
PLATFORM_FEE_BPS=0
BUNDLE_BUDGET_BYTES=200000

# Optional Features
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your-facebook-pixel-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
REDIS_URL=your-redis-url
```

### Domain Configuration

- **Custom Domain**: Add your domain in Vercel → Domains
- **Build Settings**: Confirm Next.js 15 detected
- **Image Optimization**: Ensure enabled

## 2. Fly.io Configuration

### Environment Variables

Use Fly CLI or dashboard to set secrets:

```bash
# Set each variable individually
fly secrets set NEXTAUTH_SECRET=your-production-secret-32-chars-min
fly secrets set NEXTAUTH_URL=https://your-domain.fly.dev
fly secrets set GOOGLE_ID=your-google-oauth-client-id
fly secrets set GOOGLE_SECRET=your-google-oauth-client-secret
fly secrets set SANITY_PROJECT_ID=your-sanity-project-id
fly secrets set SANITY_DATASET=your-sanity-dataset
fly secrets set SANITY_API_VERSION=2023-10-01
fly secrets set SANITY_API_TOKEN=your-sanity-api-token
fly secrets set STRIPE_SECRET_KEY=sk_live_your-live-stripe-secret-key
fly secrets set STRIPE_WEBHOOK_SECRET=whsec_your-live-webhook-secret
fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-live-publishable-key
fly secrets set SMTP_HOST=your-production-smtp-host
fly secrets set SMTP_PORT=587
fly secrets set SMTP_USER=your-smtp-username
fly secrets set SMTP_PASS=your-smtp-password
fly secrets set SUPPORT_EMAIL=contact@yourdomain.com
fly secrets set RESEND_API_KEY=your-resend-api-key
fly secrets set MAILCHIMP_API_KEY=your-mailchimp-api-key
fly secrets set NEXT_PUBLIC_BASE_URL=https://your-domain.fly.dev
fly secrets set NODE_ENV=production
fly secrets set EASYPOST_API_KEY=your-easypost-api-key
fly secrets set ANTHROPIC_API_KEY=your-anthropic-api-key
fly secrets set CHECKOUT_V2_ENABLED=true
fly secrets set CHECKOUT_V2_PERCENT=1
fly secrets set PLATFORM_FEE_BPS=0
fly secrets set BUNDLE_BUDGET_BYTES=200000
fly secrets set NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your-facebook-pixel-id
fly secrets set NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
fly secrets set REDIS_URL=your-redis-url
```

## 3. Sanity Configuration

### Project Setup

1. **Dataset**: Confirm production dataset exists
2. **API Tokens**:
   - **Read Token**: For web app (scopes: read)
   - **Write Token**: For workers (scopes: write/mutate)

### CORS Configuration

Add these domains to Sanity CORS settings:

```
https://yourdomain.com
https://*.vercel.app
https://your-app-name.fly.dev
```

### Webhooks

Create webhook for content changes:

- **Endpoint**: `https://your-domain.vercel.app/api/sanity/webhook`
- **Events**: Create, Update, Delete
- **Secret**: Set a secure webhook secret
- **Include Drafts**: Based on your app's needs

## 4. Stripe Configuration

### Webhooks

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `customer.created`
   - `customer.updated`
4. Copy webhook signing secret to Vercel env

### Production Settings

- **Branding**: Update seller-facing emails/URLs
- **Payment Methods**: Enable required payment methods
- **Webhooks**: Test webhook delivery

## 5. Environment Validation

Run validation script to check configuration:

```bash
# Validate environment variables
pnpm validate:env:strict

# Check specific platforms
pnpm validate:env --platform=vercel
pnpm validate:env --platform=fly
```

## 6. Deployment Commands

### Deploy Workers to Fly.io

```bash
# Deploy from main branch
fly deploy --remote-only

# Check deployment status
fly status
fly logs
```

### Vercel Deployment

- Automatic after PR merge
- Check Vercel dashboard for deployment status
- Monitor build logs for any issues

## 7. Production Smoke Tests

### Authentication Flow

- [ ] User signup (email + social)
- [ ] Email verification
- [ ] Login/logout
- [ ] Password reset

### Catalog & Shopping

- [ ] Browse categories (English + Arabic)
- [ ] Search functionality
- [ ] Product detail pages
- [ ] Add to cart
- [ ] Update quantities
- [ ] Checkout process
- [ ] Payment completion

### Seller Features

- [ ] Seller onboarding
- [ ] Dashboard access
- [ ] Book listing creation
- [ ] Order management

### Internationalization

- [ ] Language switching
- [ ] RTL layout (Arabic)
- [ ] Form validation in both languages

### Webhooks & Integrations

- [ ] Sanity content changes trigger revalidation
- [ ] Stripe webhooks are received
- [ ] Email notifications sent

## 8. Monitoring Setup

### Sentry Configuration

- [ ] Test error reporting (client + server)
- [ ] Verify DSN configuration
- [ ] Check error tracking in Sentry dashboard

### Health Checks

- [ ] Sanity connection
- [ ] Stripe API connectivity
- [ ] Redis connection
- [ ] Email service status

### Logs Monitoring

- [ ] Vercel function logs
- [ ] Fly.io worker logs
- [ ] Error rate monitoring

## 9. Rollback Procedures

### Vercel Rollback

```bash
# Promote previous deployment
vercel --prod --force
```

### Fly.io Rollback

```bash
# List releases
fly releases

# Rollback to previous release
fly releases rollback <release-id>
```

## 10. Post-Launch Checklist

- [ ] All smoke tests passing
- [ ] Monitoring alerts configured
- [ ] Error tracking active
- [ ] Performance metrics baseline established
- [ ] Security scanning scheduled
- [ ] Backup procedures documented
- [ ] Team access configured
- [ ] Documentation updated

## 🎯 Success Criteria

- ✅ Zero critical errors in production
- ✅ All user flows working end-to-end
- ✅ Performance metrics within acceptable ranges
- ✅ Security scans clean
- ✅ Monitoring and alerting active
- ✅ Team can confidently manage the platform

---

**Need Help?** Check the troubleshooting section in the main README or contact the development team.
