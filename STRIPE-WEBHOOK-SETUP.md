# Stripe Webhook Setup Guide

## 🚀 Quick Setup for Testing

### Option 1: Using Stripe CLI (Recommended for Development)

1. **Install Stripe CLI**

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe**

   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost**

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe-webhook
   ```

4. **Copy the webhook secret** from the CLI output and add to your `.env.local`:

   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
   ```

5. **Test the webhook**
   ```bash
   # Test with a real payment event
   stripe trigger payment_intent.succeeded
   ```

### Option 2: Using ngrok (Alternative for Development)

1. **Install ngrok**

   ```bash
   # macOS
   brew install ngrok

   # Or download from: https://ngrok.com/download
   ```

2. **Start your Next.js app**

   ```bash
   pnpm dev
   ```

3. **In another terminal, expose your local server**

   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Configure webhook in Stripe Dashboard**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Set URL to: `https://abc123.ngrok.io/api/webhooks/stripe-webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret

6. **Add webhook secret to `.env.local`**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
   ```

## 🧪 Testing Your Webhook

### Test 1: Direct Webhook Test

```bash
curl -X POST http://localhost:3000/api/test-webhook
```

### Test 2: Email Test

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "template": "buyer"}'
```

### Test 3: Real Payment Test

1. Make a test purchase on your site
2. Check your terminal logs for webhook activity
3. Look for these log messages:
   ```
   🔔 Stripe webhook received
   ✅ Webhook signature verified successfully
   🔔 Event type: payment_intent.succeeded
   📧 sendEmail called with: { to: '...', subject: '...', hasHtml: true }
   ```

## 🔧 Environment Variables Required

Add these to your `.env.local`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# SMTP Configuration (for emails)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# Other required variables
NEXTAUTH_SECRET=your-secret-jwt-token
NEXTAUTH_URL=http://localhost:3000
SANITY_PROJECT_ID=your-sanity-project-id
SANITY_DATASET=your-sanity-dataset
SANITY_API_TOKEN=your-sanity-api-token
```

## 🐛 Troubleshooting

### Webhook Not Receiving Events

1. Check if webhook URL is accessible: `curl https://your-webhook-url/api/webhooks/stripe-webhook`
2. Verify webhook secret is correct
3. Check Stripe Dashboard for webhook delivery attempts and errors

### Signature Verification Failed

1. Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
2. Make sure you're using the webhook secret, not the API key
3. Check that the webhook endpoint URL matches exactly

### Emails Not Sending

1. Test SMTP configuration with the test endpoint
2. Check SMTP credentials and host settings
3. Look for SMTP connection errors in logs

### Webhook Timeout

1. Ensure your webhook handler completes within 30 seconds
2. Check for any blocking operations in your code
3. Consider moving heavy operations to background jobs

## 📊 Monitoring Webhook Health

### Stripe Dashboard

- Go to https://dashboard.stripe.com/webhooks
- Click on your webhook endpoint
- View delivery attempts, success rates, and error logs

### Application Logs

Look for these log patterns:

- `🔔 Stripe webhook received` - Webhook endpoint hit
- `✅ Webhook signature verified successfully` - Signature valid
- `📧 sendEmail called with:` - Email sending started
- `✅ Email sent successfully:` - Email sent successfully

## 🚀 Production Setup

For production, you'll need:

1. A publicly accessible domain
2. HTTPS enabled
3. Webhook endpoint configured in Stripe Dashboard
4. Proper error handling and retry logic
5. Monitoring and alerting for webhook failures

## 📝 Next Steps

1. **Set up webhook using Stripe CLI** (easiest for testing)
2. **Test with the test endpoints** to verify email functionality
3. **Make a real test purchase** to see the full flow
4. **Check your email** for confirmation messages
5. **Monitor logs** for any issues

Once everything is working, you can remove the test endpoints and rely on the webhook system for production.

