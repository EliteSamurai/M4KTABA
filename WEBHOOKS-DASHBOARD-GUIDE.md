# Webhooks, Dashboard & Real-Time Features Guide

## 🎯 Overview

This guide covers the webhook system, seller dashboard, currency selector, email notifications, and Apple Pay/Google Pay integration added to M4KTABA marketplace.

---

## 🔔 Webhook System

### Overview
Real-time order processing with automatic notifications for:
- Payment success/failure
- Refunds
- Disputes
- Order status changes

### Stripe Webhooks

**Endpoint**: `/api/webhooks/stripe`

**Handled Events**:
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund processed
- `charge.dispute.created` - Dispute filed

**Setup**:
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

**Example Payload** (payment success):
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_123",
      "amount": 5999,
      "currency": "usd",
      "metadata": {
        "orderId": "m4k-001",
        "buyerId": "user_123"
      }
    }
  }
}
```

### PayPal Webhooks

**Endpoint**: `/api/webhooks/paypal`

**Handled Events**:
- `PAYMENT.CAPTURE.COMPLETED` - Payment captured
- `PAYMENT.CAPTURE.DENIED` - Payment denied
- `PAYMENT.CAPTURE.REFUNDED` - Refund processed
- `CUSTOMER.DISPUTE.CREATED` - Dispute created

**Setup**:
1. Go to PayPal Developer Dashboard → Webhooks
2. Add webhook: `https://yourdomain.com/api/webhooks/paypal`
3. Subscribe to events
4. Copy webhook ID to `PAYPAL_WEBHOOK_ID`

**Webhook Verification**:
Webhook signatures are automatically verified to ensure authenticity.

---

## 📊 Seller Dashboard

### Access
**URL**: `/dashboard/seller`

**Authentication**: Required (sellers only)

### Features

#### 1. Sales Metrics
- **Total Sales**: Lifetime revenue
- **Total Orders**: Order count
- **Average Order Value**: Mean purchase size
- **Pending Payouts**: Available balance

#### 2. Transaction History
- Unified view of Stripe + PayPal transactions
- Payment method indicators
- Fee breakdown (Platform: $0, Processor fees shown)
- Net earnings calculation
- Status badges (completed, pending, refunded)

#### 3. Analytics

**Sales Trend Chart**:
- Daily sales over selected period
- Line graph visualization
- Time range selector (7d, 30d, 90d, all)

**Payment Method Distribution**:
- Pie chart showing Stripe vs PayPal usage
- Percentages and totals

**Sales by Currency**:
- Bar chart of international sales
- Multi-currency breakdown

**Order Status Distribution**:
- Completed, pending, refunded counts
- Visual status indicators

#### 4. Fee Transparency

Shows clear breakdown:
- Platform Fee: **$0.00 (0%)** ✅
- Payment Processor Fees: ~2.9% + $0.30
- **Net Earnings**: What seller actually receives

**Example**:
```
Order Total:        $100.00
Platform Fee:         $0.00  (0%)
Processor Fee:        $3.20  (2.9% + $0.30)
────────────────────────────
You Receive:         $96.80  (96.8%)
```

### API Endpoint

**GET `/api/seller/dashboard`**

**Query Parameters**:
- `userId`: Seller user ID (required)
- `timeRange`: `7d` | `30d` | `90d` | `all`

**Response**:
```typescript
{
  transactions: Transaction[],
  metrics: {
    totalSales: number,
    totalOrders: number,
    averageOrderValue: number,
    pendingPayouts: number,
    completedOrders: number,
    refundedOrders: number
  }
}
```

---

## 💱 Currency Selector

### Component: `CurrencySelector`

**Location**: Can be added to navbar or header

**Usage**:
```tsx
import { CurrencySelector } from '@/components/CurrencySelector';

export function Navbar() {
  return (
    <nav>
      {/* other nav items */}
      <CurrencySelector />
    </nav>
  );
}
```

### Supported Currencies

- **Popular**: USD, EUR, GBP, AED, TRY, PKR
- **All**: 20+ currencies including AUD, CAD, JPY, CHF, SEK, NOK, DKK, PLN, CZK, MXN, BRL, INR, CNY

### Features
- **Persistent**: Saves selection to localStorage
- **Auto-conversion**: Prices update based on selected currency
- **Locale-aware**: Uses proper formatting for each currency

### Price Display

**Hook**: `useCurrency()`
```tsx
import { useCurrency } from '@/components/CurrencySelector';

function ProductPrice({ amount }: { amount: number }) {
  const currency = useCurrency();
  // Use currency to display price
}
```

**Component**: `<PriceDisplay />`
```tsx
import { PriceDisplay } from '@/components/CurrencySelector';

function Product() {
  return (
    <div>
      <PriceDisplay amount={59.99} className="text-2xl font-bold" />
    </div>
  );
}
```

### Currency Conversion

**Synchronous** (client-side):
```typescript
import { convertAndFormatSync } from '@/lib/currency';

const price = convertAndFormatSync(59.99, 'EUR');
// Result: "55,19 €"
```

**Asynchronous** (with live rates):
```typescript
import { convertAndFormat } from '@/lib/currency';

const price = await convertAndFormat(59.99, 'EUR');
// Result: "55,19 €"
```

---

## 📧 Email Notifications

### System Overview
Powered by Resend API, sends transactional emails for:
- Order confirmations
- Payment failures
- Refunds
- New orders (to sellers)

### Email Functions

#### 1. Order Confirmation (Buyer)

```typescript
import { sendOrderConfirmationEmail } from '@/lib/email';

await sendOrderConfirmationEmail('buyer@example.com', {
  orderId: 'm4k-001',
  items: [
    { title: 'Book Title', quantity: 1, price: 59.99 }
  ],
  totalAmount: 59.99,
  currency: 'USD',
  shippingAddress: '123 Main St, City, State, ZIP'
});
```

**Email Includes**:
- Order number
- Items list
- Total amount
- Shipping address
- No platform fees message 💚
- Next steps

#### 2. New Order Notification (Seller)

```typescript
import { sendNewOrderNotificationToSeller } from '@/lib/email';

await sendNewOrderNotificationToSeller('seller@example.com', {
  orderId: 'm4k-001',
  buyerName: 'John Doe',
  items: [...],
  totalAmount: 59.99,
  currency: 'USD',
  netAmount: 56.79  // After processor fees
});
```

**Email Includes**:
- Order details
- **Earnings breakdown**:
  - Order total
  - Platform fee: $0.00 ✅
  - Processor fee
  - Net amount to seller
- Link to dashboard
- Next steps for fulfillment

#### 3. Refund Confirmation

```typescript
import { sendRefundConfirmationEmail } from '@/lib/email';

await sendRefundConfirmationEmail('buyer@example.com', {
  orderId: 'm4k-001',
  refundAmount: 59.99,
  currency: 'USD',
  refundReason: 'Customer request'
});
```

#### 4. Payment Failed

```typescript
import { sendPaymentFailedEmail } from '@/lib/email';

await sendPaymentFailedEmail('buyer@example.com', {
  orderId: 'm4k-001',
  failureReason: 'Insufficient funds'
});
```

### Environment Setup

```bash
# .env.local
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=M4KTABA <noreply@m4ktaba.com>
```

**Get API Key**:
1. Sign up at https://resend.com
2. Verify your domain
3. Generate API key
4. Add to environment variables

---

## 💳 Apple Pay & Google Pay

### Overview
Automatically enabled via Stripe's `automatic_payment_methods`.

### How It Works
- **Apple Pay**: Shows on Safari/iOS when available
- **Google Pay**: Shows on Chrome/Android when available
- **No extra code needed**: Stripe Elements handles detection

### Configuration

Already enabled in payment intent creation:

```typescript
// lib/stripe.ts
{
  automatic_payment_methods: {
    enabled: true,
    allow_redirects: 'always',
  }
}
```

### User Experience
1. User goes to checkout
2. If on supported device/browser:
   - Apple Pay button appears (iOS/macOS Safari)
   - Google Pay button appears (Android Chrome)
3. One-click payment
4. Automatic confirmation

### Testing

**Apple Pay** (development):
- Use Safari on macOS
- Add test card to Wallet
- Test in Stripe test mode

**Google Pay** (development):
- Use Chrome on Android
- Add test card to Google Pay
- Test in Stripe test mode

### Benefits
- **Higher conversion**: One-click payments
- **Mobile-optimized**: Native payment experience
- **Secure**: Tokenized payments
- **No extra fees**: Standard Stripe rates apply

---

## 🔄 Webhook Integration Flow

### Complete Flow Diagram

```
┌─────────────┐
│   Payment   │
│  Processor  │
│ (Stripe/PP) │
└──────┬──────┘
       │
       │ Webhook Event
       ▼
┌──────────────────┐
│  Webhook Handler │
│  (Verification)  │
└──────┬───────────┘
       │
       ├─── Update Order Status
       │
       ├─── Send Email (Buyer)
       │
       ├─── Notify Seller (Email)
       │
       ├─── Update Dashboard Data
       │
       └─── Trigger Analytics
```

### Implementation in Webhooks

```typescript
// app/api/webhooks/stripe/route.ts

async function handlePaymentIntentSucceeded(paymentIntent) {
  // 1. Update order status
  await updateOrderStatus(orderId, 'paid', { /* metadata */ });
  
  // 2. Send confirmation email to buyer
  await sendOrderConfirmationEmail(buyerEmail, orderId, details);
  
  // 3. Notify seller(s)
  for (const sellerId of sellerIds) {
    await notifySeller(sellerId, 'new_order', { orderId });
  }
  
  // 4. Track metrics
  counter('order_completed').inc();
}
```

---

## 📱 Mobile Responsiveness

All features are fully responsive:

### Dashboard
- **Desktop**: Full chart visualizations
- **Tablet**: Stacked charts, side-by-side metrics
- **Mobile**: Vertical layout, compact charts

### Currency Selector
- **Desktop**: Dropdown with full currency names
- **Mobile**: Compact dropdown, currency codes

### Emails
- **All Devices**: HTML emails with responsive design
- Mobile-friendly tables and buttons

---

## 🧪 Testing

### Webhook Testing

**Stripe CLI**:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```

**PayPal Sandbox**:
1. Use sandbox credentials
2. Complete test transactions
3. Webhooks fire to your endpoint
4. Check webhook dashboard for deliveries

### Email Testing

**Development**:
```typescript
// Send test email
await sendOrderConfirmationEmail('test@example.com', {
  orderId: 'test-001',
  // ... test data
});
```

**Resend Dashboard**:
- View sent emails
- Check delivery status
- Preview email content

---

## 🚀 Deployment Checklist

### Webhooks
- [ ] Set up Stripe webhook endpoint (production)
- [ ] Set up PayPal webhook endpoint (production)
- [ ] Add `STRIPE_WEBHOOK_SECRET` to environment
- [ ] Add `PAYPAL_WEBHOOK_ID` to environment
- [ ] Test webhook delivery
- [ ] Monitor webhook logs

### Email
- [ ] Verify domain in Resend
- [ ] Add `RESEND_API_KEY` to environment
- [ ] Set `FROM_EMAIL` to verified address
- [ ] Test all email templates
- [ ] Set up email monitoring

### Dashboard
- [ ] Deploy seller dashboard
- [ ] Test with real transaction data
- [ ] Verify metrics calculations
- [ ] Check chart rendering
- [ ] Test mobile layout

### Currency
- [ ] Add currency selector to navbar
- [ ] Test currency conversion
- [ ] Verify locale formatting
- [ ] Check persistence (localStorage)

### Apple Pay / Google Pay
- [ ] Verify Stripe configuration
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Check payment flow
- [ ] Verify order completion

---

## 📊 Metrics & Monitoring

### Key Metrics

**Webhooks**:
- `webhook_stripe_received` - Stripe webhooks received
- `webhook_stripe_processed` - Successfully processed
- `webhook_stripe_error` - Processing errors
- `webhook_paypal_received` - PayPal webhooks received
- `webhook_paypal_processed` - Successfully processed
- `webhook_paypal_error` - Processing errors

**Orders**:
- `order_completed` - Successful orders
- `order_failed` - Failed payments
- `order_refunded` - Refunds processed
- `dispute_created` - Disputes filed

**Seller Dashboard**:
- Page views
- Time on page
- Actions taken (filter, export, etc.)

### Monitoring

**Webhook Health**:
```typescript
// Check webhook processing rate
const successRate = webhook_processed / webhook_received;

// Alert if < 95%
if (successRate < 0.95) {
  notifyAdmin('Webhook processing degraded');
}
```

**Email Delivery**:
- Monitor via Resend dashboard
- Track bounces and failures
- Set up alerts for delivery issues

---

## 🔐 Security

### Webhook Verification
- **Stripe**: Signature verification via `stripe-signature` header
- **PayPal**: Webhook ID and transmission signature
- **All**: HTTPS required

### Email Security
- SPF/DKIM records configured
- No sensitive data in emails
- Secure links (HTTPS)

### Dashboard Security
- Authentication required
- User can only view own data
- CORS configured
- Rate limiting on API

---

## 📚 Additional Resources

- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [PayPal Webhooks Docs](https://developer.paypal.com/api/rest/webhooks/)
- [Resend API Docs](https://resend.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Last Updated**: November 9, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready

