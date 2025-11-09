# 🔍 Observability & Monitoring Guide

## Overview

Comprehensive observability stack for M4KTABA marketplace with automated alerts, business metrics tracking, and real-time monitoring.

---

## 🚨 Alert Rules

### Critical Alerts

#### 1. Payment Success Rate Drop (>3% in 1h)
**Alert ID**: `payment_success_rate_drop`  
**Severity**: Critical  
**Threshold**: 3% drop  
**Window**: 1 hour  
**Channels**: Slack, PagerDuty  

**What it means**: Payment success rate dropped significantly, indicating payment processor issues or configuration problems.

**Action**:
1. Check Stripe/PayPal dashboard for outages
2. Review recent code deployments
3. Check error logs for payment failures
4. Verify API credentials are valid

#### 2. Multiple Payout Failures (≥5 sellers in 1h)
**Alert ID**: `payout_failures_multiple_sellers`  
**Severity**: Critical  
**Threshold**: 5 sellers  
**Window**: 1 hour  
**Channels**: Slack, PagerDuty, Email  

**What it means**: Automated payout system is failing for multiple sellers.

**Action**:
1. Check Stripe Connect account status
2. Verify PayPal API credentials
3. Check seller account configurations
4. Review payout processing logs
5. Manually retry failed payouts if needed

#### 3. Payout Cron Job Errors
**Alert ID**: `payout_cron_errors`  
**Severity**: Critical  
**Threshold**: >0 errors  
**Window**: 1 hour  
**Channels**: Slack, PagerDuty  

**What it means**: Automated payout cron job encountered errors.

**Action**:
1. Check cron job logs
2. Verify database connectivity
3. Check API rate limits
4. Restart cron job if necessary

### High Severity Alerts

#### 4. High Webhook Failure Rate (>1% in 5m)
**Alert ID**: `webhook_failure_rate_high`  
**Severity**: High  
**Threshold**: 1%  
**Window**: 5 minutes  
**Channels**: Slack, Email  

**What it means**: Webhook processing is failing at elevated rate.

**Action**:
1. Check webhook signature verification
2. Review webhook handler logs
3. Verify webhook endpoints are accessible
4. Check for webhook timeout issues

#### 5. High Refund Rate (>5% in 24h)
**Alert ID**: `high_refund_rate`  
**Severity**: High  
**Threshold**: 5%  
**Window**: 24 hours  
**Channels**: Slack, Email  

**What it means**: Refund rate is abnormally high, may indicate quality issues or fraud.

**Action**:
1. Review recent refund requests
2. Check for patterns (specific sellers, products, regions)
3. Investigate potential fraud
4. Contact affected sellers

#### 6. High Dispute Volume Per Seller
**Alert ID**: `high_dispute_volume_per_seller`  
**Severity**: High  
**Threshold**: 3 disputes  
**Window**: 7 days  
**Channels**: Slack, Email  

**What it means**: Specific seller has elevated dispute rate.

**Action**:
1. Review seller's recent transactions
2. Contact seller about quality issues
3. Consider account review/suspension
4. Investigate common dispute reasons

---

## 📊 Business Metrics

### GMV (Gross Merchandise Value)

**Track by**:
- Region (US, EU, MENA, APAC)
- Currency (USD, EUR, GBP, AED, etc.)
- Time period (daily, weekly, monthly)

**API Endpoint**:
```bash
GET /api/observability/metrics?window=24h
```

**Response**:
```json
{
  "gmvTotal": 125000.00,
  "gmvByRegion": {
    "US": 75000.00,
    "EU": 35000.00,
    "MENA": 15000.00
  },
  "gmvByCurrency": {
    "USD": 85000.00,
    "EUR": 30000.00,
    "GBP": 10000.00
  }
}
```

**Tracking Code**:
```typescript
import { trackGMV } from '@/lib/observability/metrics';

// After successful order
trackGMV(orderAmount, 'USD', 'US');
```

### Conversion by Payment Method

**Metrics**:
- Stripe conversion rate
- PayPal conversion rate
- Overall conversion rate

**Tracking Code**:
```typescript
import { trackConversion } from '@/lib/observability/metrics';

// On checkout attempt
trackConversion('stripe', true);  // succeeded
trackConversion('paypal', false); // failed
```

**Dashboard Query**:
```typescript
import { getDashboardMetrics } from '@/lib/observability/metrics';

const metrics = await getDashboardMetrics('24h');
console.log(metrics.conversionByMethod);
// { stripe: 97.5, paypal: 95.2 }
```

### Average Payout Latency

**What it measures**: Time from order completion to payout processing.

**Tracking Code**:
```typescript
import { trackPayoutLatency } from '@/lib/observability/metrics';

const orderTime = order.createdAt.getTime();
const payoutTime = payout.processedAt.getTime();
const latencyMs = payoutTime - orderTime;

trackPayoutLatency(latencyMs, sellerId);
```

**Get Average**:
```typescript
import { getAveragePayoutLatency } from '@/lib/observability/metrics';

const avgLatency = getAveragePayoutLatency('7d');
console.log(`Average payout latency: ${avgLatency / 1000 / 60 / 60} hours`);
```

### Liquidity Metrics

**Track**:
- Available balance (ready to payout)
- Pending balance (in holding period)
- Liquidity ratio (available / total)

**Tracking Code**:
```typescript
import { trackLiquidity } from '@/lib/observability/metrics';

trackLiquidity(
  availableBalance,  // $5,000
  pendingBalance,    // $2,000
  sellerId
);
// Liquidity ratio: 5000 / 7000 = 71.4%
```

**Alert**: Triggers if liquidity ratio < 10% (low available funds).

---

## 🔧 Integration Guide

### 1. Initialize Observability System

**In your app startup** (`app/layout.tsx` or `middleware.ts`):

```typescript
import { initializeObservability } from '@/lib/observability/monitor';

// Initialize on server startup
if (typeof window === 'undefined') {
  initializeObservability();
}
```

### 2. Track Metrics in Code

**Payment Processing**:
```typescript
import { trackPaymentProcessing } from '@/lib/observability/monitor';

const result = await trackPaymentProcessing(async () => {
  return await stripe.paymentIntents.create({...});
});
```

**GMV Tracking**:
```typescript
import { trackGMV } from '@/lib/observability/metrics';

// In order confirmation handler
await trackGMV(order.total, order.currency, order.region);
```

**Webhook Tracking**:
```typescript
import { trackWebhook } from '@/lib/observability/metrics';

// In webhook handler
try {
  await processWebhook(event);
  trackWebhook('stripe', event.type, true);
} catch (error) {
  trackWebhook('stripe', event.type, false);
  throw error;
}
```

**Refund Tracking**:
```typescript
import { trackRefund } from '@/lib/observability/metrics';

// When processing refund
await trackRefund(refundAmount, orderId);
```

**Payout Tracking**:
```typescript
import { trackPayoutFailure } from '@/lib/observability/metrics';

// On payout failure
trackPayoutFailure(sellerId, 'insufficient_funds');
```

**Dispute Tracking**:
```typescript
import { trackDispute } from '@/lib/observability/metrics';

// When dispute created
trackDispute(sellerId, disputeAmount, 'chargeback');
```

### 3. Update Webhook Handlers

**Stripe Webhook** (`app/api/webhooks/stripe/route.ts`):
```typescript
import { trackWebhook } from '@/lib/observability/metrics';

export async function POST(req: NextRequest) {
  // ... signature verification ...

  try {
    // Process webhook
    await handleWebhook(event);
    trackWebhook('stripe', event.type, true);
  } catch (error) {
    trackWebhook('stripe', event.type, false);
    throw error;
  }
}
```

**PayPal Webhook** (`app/api/webhooks/paypal/route.ts`):
```typescript
import { trackWebhook } from '@/lib/observability/metrics';

export async function POST(req: NextRequest) {
  // ... verification ...

  try {
    await handlePayPalWebhook(event);
    trackWebhook('paypal', event.event_type, true);
  } catch (error) {
    trackWebhook('paypal', event.event_type, false);
    throw error;
  }
}
```

### 4. Update Payout Cron

**Payout Script** (`scripts/cron/process-payouts.ts`):
```typescript
import { batchProcessPayouts } from '@/lib/automated-payouts';
import { trackPayoutCronError } from '@/lib/observability/monitor';

try {
  await batchProcessPayouts();
} catch (error) {
  trackPayoutCronError(error as Error);
  throw error;
}
```

---

## 📈 Dashboard & Visualization

### Health Check Endpoint

**Endpoint**: `GET /api/observability/health`

**Response**:
```json
{
  "status": "healthy",
  "checks": {
    "payments": true,
    "webhooks": true,
    "payouts": true,
    "database": true
  },
  "metrics": {
    "paymentSuccessRate": 97.8,
    "webhookFailureRate": 0.3,
    "payoutFailures": 2
  },
  "timestamp": "2025-11-09T12:00:00Z"
}
```

**Status Codes**:
- `200`: Healthy or degraded
- `503`: Unhealthy

### Metrics Dashboard

**Endpoint**: `GET /api/observability/metrics?window=24h`

**Response**:
```json
{
  "window": "24h",
  "metrics": {
    "paymentSuccessRate": 97.5,
    "paymentVolume": 1250,
    "averageOrderValue": 85.50,
    "gmvTotal": 106875.00,
    "gmvByRegion": {...},
    "gmvByCurrency": {...},
    "conversionByMethod": {
      "stripe": 97.8,
      "paypal": 95.6
    },
    "refundRate": 2.3,
    "refundCount": 29,
    "averagePayoutLatency": 86400000,
    "payoutFailures": 3,
    "liquidityRatio": 0.68,
    "availableBalance": 45000.00,
    "pendingBalance": 21000.00,
    "webhookFailureRate": 0.4,
    "disputeCount": 5
  },
  "timestamp": "2025-11-09T12:00:00Z"
}
```

### Alerts Endpoint

**Endpoint**: `GET /api/observability/alerts`

**Response**:
```json
{
  "count": 10,
  "alerts": [
    {
      "id": "payment_success_rate_drop",
      "name": "Payment Success Rate Drop",
      "description": "Payment success rate dropped by more than 3% in 1 hour",
      "severity": "critical",
      "metric": "payment_success_rate_drop",
      "threshold": 3,
      "window": "1h",
      "enabled": true
    },
    // ... more alerts
  ]
}
```

---

## 🔔 Notification Channels

### Slack

**Setup**:
1. Create Slack incoming webhook
2. Add to environment: `SLACK_WEBHOOK_URL=https://hooks.slack.com/...`
3. Alerts will post to configured channel

**Message Format**:
```
🚨 Payment Success Rate Drop
Severity: CRITICAL
Current value: 94.2
Threshold: 97.0 (3% drop)
Window: 1h
```

### Email

**Setup**:
1. Configure Resend API (already set up)
2. Set alert email: `ALERT_EMAIL=alerts@m4ktaba.com`
3. Alerts will send via Resend

### PagerDuty

**Setup**:
1. Create PagerDuty integration
2. Get routing key
3. Add to environment:
   ```bash
   PAGERDUTY_API_KEY=your_api_key
   PAGERDUTY_ROUTING_KEY=your_routing_key
   ```

---

## 📊 Grafana / Datadog Integration

### Export Metrics

**Datadog**:
```typescript
// In metrics.ts flush()
async flush(): Promise<void> {
  const apiKey = process.env.DATADOG_API_KEY;
  
  for (const [name, points] of this.metrics.entries()) {
    await fetch('https://api.datadoghq.com/api/v1/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': apiKey,
      },
      body: JSON.stringify({
        series: [{
          metric: `m4ktaba.${name}`,
          points: points.map(p => [p.timestamp / 1000, p.value]),
          tags: Object.entries(p.labels || {}).map(([k, v]) => `${k}:${v}`),
        }],
      }),
    });
  }
}
```

**CloudWatch**:
```typescript
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cw = new CloudWatch({ region: 'us-east-1' });

async flush(): Promise<void> {
  for (const [name, points] of this.metrics.entries()) {
    await cw.putMetricData({
      Namespace: 'M4KTABA',
      MetricData: points.map(p => ({
        MetricName: name,
        Value: p.value,
        Timestamp: new Date(p.timestamp),
        Dimensions: Object.entries(p.labels || {}).map(([k, v]) => ({
          Name: k,
          Value: v,
        })),
      })),
    });
  }
}
```

---

## 🧪 Testing Alerts

### Manual Alert Testing

```bash
# Test Slack notification
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test alert from M4KTABA"}'

# Test email
curl -X POST http://localhost:3000/api/test/alert \
  -H 'Content-Type: application/json' \
  -d '{"alertId":"payment_success_rate_drop","value":5}'
```

### Simulate Alert Conditions

```typescript
// Simulate payment failures
import { trackConversion } from '@/lib/observability/metrics';

for (let i = 0; i < 100; i++) {
  trackConversion('stripe', i < 90); // 90% success rate
}

// Check if alert would trigger
import { calculatePaymentSuccessRate } from '@/lib/observability/metrics';
const rate = calculatePaymentSuccessRate('1h');
console.log(`Success rate: ${rate}%`); // 90%
```

---

## 📋 Monitoring Checklist

### Daily
- [ ] Check health endpoint status
- [ ] Review overnight alerts
- [ ] Check payment success rate (should be >95%)
- [ ] Verify payout cron ran successfully
- [ ] Review dispute count

### Weekly
- [ ] Review GMV trends by region
- [ ] Analyze conversion rates by payment method
- [ ] Check average payout latency
- [ ] Review refund rate trends
- [ ] Audit liquidity ratio

### Monthly
- [ ] Full alert rule review
- [ ] Update alert thresholds if needed
- [ ] Review seller dispute patterns
- [ ] Analyze seasonal trends
- [ ] Update documentation

---

## 🚀 Production Deployment

### Environment Variables

```bash
# Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=alerts@m4ktaba.com
PAGERDUTY_API_KEY=your_api_key
PAGERDUTY_ROUTING_KEY=your_routing_key

# Metrics Export (optional)
DATADOG_API_KEY=your_datadog_key
CLOUDWATCH_REGION=us-east-1
```

### Cron Jobs

```bash
# Monitor metrics (every minute)
* * * * * curl http://localhost:3000/api/observability/health

# Generate daily reports
0 9 * * * node scripts/reports/daily-metrics.js
```

### Infrastructure

**Load Balancer Health Check**:
- Endpoint: `/api/observability/health`
- Interval: 30 seconds
- Timeout: 5 seconds
- Unhealthy threshold: 2 failures

**Auto-scaling Triggers**:
- Payment processing latency >5s
- Webhook queue size >100
- Error rate >1%

---

## 📖 Best Practices

1. **Alert Fatigue Prevention**:
   - Set thresholds appropriately
   - Use severity levels correctly
   - Don't alert on expected fluctuations

2. **Metric Naming**:
   - Use consistent naming (snake_case)
   - Include units (e.g., `_ms`, `_count`, `_rate`)
   - Use labels for dimensions

3. **Response Procedures**:
   - Document runbooks for each alert
   - Define escalation paths
   - Practice incident response

4. **Dashboard Design**:
   - Group related metrics
   - Show trends over time
   - Include targets/thresholds

5. **Testing**:
   - Test alerts before production
   - Verify notification channels
   - Practice incident scenarios

---

## 🔍 Troubleshooting

### Alerts Not Firing

1. Check monitor is running:
   ```typescript
   import { monitor } from '@/lib/observability/monitor';
   console.log(monitor.isRunning); // should be true
   ```

2. Verify metrics are being collected:
   ```typescript
   import { metrics } from '@/lib/observability/metrics';
   console.log(metrics.get('checkout_attempts', '1h').length);
   ```

3. Check alert configuration:
   ```typescript
   import { getEnabledAlerts } from '@/lib/observability/alerts';
   console.log(getEnabledAlerts());
   ```

### Metrics Not Collecting

1. Check initialization:
   ```bash
   grep "Observability system initialized" logs.txt
   ```

2. Verify tracking calls:
   ```typescript
   // Add debug logs
   metrics.record('test_metric', 123);
   console.log(metrics.get('test_metric'));
   ```

3. Check flush interval:
   ```typescript
   metrics.flush(); // Manual flush
   ```

---

**Last Updated**: November 9, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready

