# Environment Variables Audit

## Overview

This document provides a comprehensive audit of all environment variables used in the M4ktaba application, categorized by deployment platform and priority level.

## Environment Variables by Category

### 🔴 **Critical (Required for Production)**

#### Authentication & Security

- `NEXTAUTH_SECRET` - NextAuth.js secret for JWT signing
- `NEXTAUTH_URL` - Base URL for NextAuth callbacks
- `GOOGLE_ID` - Google OAuth client ID
- `GOOGLE_SECRET` - Google OAuth client secret
- `SECRET_KEY` - Application secret key (32+ characters)
- `JWT_SECRET` - JWT token secret (32+ characters)

#### Database & Storage

- `SANITY_PROJECT_ID` - Sanity CMS project identifier
- `SANITY_DATASET` - Sanity dataset name
- `SANITY_API_VERSION` - Sanity API version (default: 2023-10-01)
- `SANITY_API_TOKEN` or `SANITY_WRITE_TOKEN` - Sanity API token with write permissions

#### Payment Processing

- `STRIPE_SECRET_KEY` - Stripe secret key for server-side operations
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for client-side

#### Email Services

- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (587 for TLS)
- `SMTP_USER` - SMTP authentication username
- `SMTP_PASS` - SMTP authentication password
- `SUPPORT_EMAIL` - Support contact email address

### 🟡 **Important (Required for Full Functionality)**

#### Application Configuration

- `NEXT_PUBLIC_BASE_URL` - Public base URL for the application
- `NODE_ENV` - Environment mode (development/production/test)

#### External Services

- `EASYPOST_API_KEY` - EasyPost shipping API key
- `RESEND_API_KEY` - Resend email service API key
- `ANTHROPIC_API_KEY` - Anthropic AI API key
- `MAILCHIMP_API_KEY` - Mailchimp marketing API key

#### Feature Flags

- `CHECKOUT_V2_ENABLED` - Enable new checkout flow (true/false)
- `CHECKOUT_V2_PERCENT` - Checkout v2 percentage (0-100)
- `PLATFORM_FEE_BPS` - Platform fee in basis points (default: 0)
- `BUNDLE_BUDGET_BYTES` - Bundle size budget (default: 200000)

### 🟢 **Optional (Enhancement Features)**

#### Analytics & Tracking

- `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` - Facebook Pixel tracking ID
- `NEXT_PUBLIC_DISABLE_VITALS` - Disable Vercel Analytics (true/false)
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking DSN

#### Caching & Performance

- `REDIS_URL` - Redis connection URL for caching and idempotency
- `SC_DISABLE_SPEEDY` - Disable styled-components speedy mode

#### Development & Testing

- `PLAYWRIGHT_BASE_URL` - Base URL for E2E tests (default: http://localhost:3000)
- `CI` - CI environment flag

## Platform-Specific Configuration

### Vercel Deployment

#### Required Environment Variables

```bash
# Authentication
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.vercel.app
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# Database
SANITY_PROJECT_ID=your-sanity-project-id
SANITY_DATASET=your-sanity-dataset
SANITY_API_VERSION=2023-10-01
SANITY_API_TOKEN=your-sanity-token

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SUPPORT_EMAIL=contact@yourdomain.com

# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NODE_ENV=production

# External Services
EASYPOST_API_KEY=your-easypost-key
RESEND_API_KEY=your-resend-key
ANTHROPIC_API_KEY=your-anthropic-key
MAILCHIMP_API_KEY=your-mailchimp-key

# Feature Flags
CHECKOUT_V2_ENABLED=true
CHECKOUT_V2_PERCENT=1
PLATFORM_FEE_BPS=0
BUNDLE_BUDGET_BYTES=200000

# Optional
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your-pixel-id
REDIS_URL=your-redis-url
```

### Fly.io Deployment

#### Main Application

```bash
# All Vercel variables plus:
NODE_ENV=production
```

#### Outbox Worker (fly.outbox.toml)

```bash
# Database
SANITY_PROJECT_ID=your-sanity-project-id
SANITY_DATASET=your-sanity-dataset
SANITY_API_VERSION=2023-10-01
SANITY_API_TOKEN=your-sanity-token

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# External Services
EASYPOST_API_KEY=your-easypost-key
RESEND_API_KEY=your-resend-key
```

#### Stripe Worker (fly.stripe.toml)

```bash
# Same as Outbox Worker
```

## Environment Variable Validation

### Missing Variables Check

The application should validate the presence of critical environment variables at startup:

```typescript
// lib/env-validation.ts
const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_ID',
  'GOOGLE_SECRET',
  'SANITY_PROJECT_ID',
  'SANITY_DATASET',
  'SANITY_API_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SUPPORT_EMAIL',
  'NEXT_PUBLIC_BASE_URL',
  'EASYPOST_API_KEY',
  'RESEND_API_KEY',
  'ANTHROPIC_API_KEY',
  'MAILCHIMP_API_KEY',
];

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
```

## Security Considerations

### Sensitive Variables

These variables contain sensitive information and should be:

- Never committed to version control
- Stored securely in deployment platforms
- Rotated regularly
- Access restricted to authorized personnel

```bash
# High Security Risk
NEXTAUTH_SECRET
GOOGLE_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SANITY_API_TOKEN
SMTP_PASS
ANTHROPIC_API_KEY
MAILCHIMP_API_KEY
EASYPOST_API_KEY
RESEND_API_KEY
```

### Public Variables

These variables are safe to expose in client-side code:

```bash
NEXT_PUBLIC_BASE_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
NEXT_PUBLIC_FACEBOOK_PIXEL_ID
NEXT_PUBLIC_DISABLE_VITALS
```

## Deployment Checklist

### Pre-Deployment

- [ ] All critical environment variables are set
- [ ] Sensitive variables are stored securely
- [ ] Public variables are correctly prefixed with `NEXT_PUBLIC_`
- [ ] Feature flags are configured appropriately
- [ ] External service credentials are valid and active

### Post-Deployment

- [ ] Health check endpoint returns 200
- [ ] Authentication flow works end-to-end
- [ ] Payment processing functions correctly
- [ ] Email notifications are sent successfully
- [ ] External API integrations are working
- [ ] Monitoring and error tracking are active

## Troubleshooting

### Common Issues

1. **Missing SANITY_API_TOKEN**: Check token permissions in Sanity dashboard
2. **Stripe webhook failures**: Verify webhook secret and endpoint URL
3. **Email delivery issues**: Check SMTP credentials and port configuration
4. **Authentication errors**: Verify Google OAuth configuration
5. **Build failures**: Ensure all required variables are present

### Environment Variable Debugging

```bash
# Check if variables are loaded
node -e "console.log(process.env.NEXTAUTH_SECRET ? 'OK' : 'MISSING')"

# Validate specific service
node -e "console.log(process.env.STRIPE_SECRET_KEY ? 'Stripe OK' : 'Stripe MISSING')"
```

## Recommendations

1. **Create a `.env.example` file** with all required variables (without values)
2. **Implement environment validation** at application startup
3. **Use different values** for development, staging, and production
4. **Regularly rotate** sensitive credentials
5. **Monitor environment variable usage** in logs and error tracking
6. **Document any new variables** added during development

## Next Steps

1. Create environment variable templates for each deployment platform
2. Implement validation checks in the application
3. Set up monitoring for missing or invalid environment variables
4. Create deployment scripts that verify environment configuration
5. Document the process for adding new environment variables
