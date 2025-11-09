# 🚀 Marketplace Scaling Guide

## Overview

This guide covers the advanced marketplace scaling features that transform M4KTABA into a fully-featured multi-seller global marketplace with automated operations.

---

## 🛒 Multi-Seller Cart & Checkout

### Features

**Multi-Seller Cart System**:
- Automatic grouping of items by seller
- Per-seller subtotals and shipping
- Independent seller fulfillment
- Transparent fee breakdown for each seller

**Split Payment Processing**:
- Automatic payment distribution
- Individual seller tracking
- No platform fees (0%)
- Processor fees calculated per seller

### Usage

```typescript
import {
  createMultiSellerCart,
  groupItemsBySeller,
  calculateSellerPayments,
} from '@/lib/multi-seller-cart';

// Create multi-seller cart
const multiCart = createMultiSellerCart(cartItems);

// Get seller groups
const sellerGroups = groupItemsBySeller(cartItems);

// Calculate payments for each seller
const payments = calculateSellerPayments(multiCart);
```

### Component

```tsx
import { MultiSellerCheckout } from '@/components/MultiSellerCheckout';

<MultiSellerCheckout
  cart={cartItems}
  shippingAddress={{ country: 'US', region: 'CA' }}
  currency="USD"
/>
```

### Key Functions

**`groupItemsBySeller(items)`**
- Groups cart items by seller ID
- Returns array of `SellerGroup` objects
- Each group contains: items, subtotal, shipping, tax, total

**`createMultiSellerCart(items)`**
- Creates complete multi-seller cart summary
- Calculates totals across all sellers
- Returns `MultiSellerCart` object

**`calculateSellerPayments(multiCart)`**
- Calculates payment split for each seller
- Includes processor fee calculations
- Returns array of `SellerPayment` objects

---

## 🔍 Global Product Discovery

### Advanced Search

**Features**:
- Full-text search across titles, descriptions, authors
- Relevance scoring algorithm
- Auto-complete suggestions
- Search history tracking

**Search API**: `GET /api/products/search`

**Query Parameters**:
```
q              - Search term
minPrice       - Minimum price filter
maxPrice       - Maximum price filter
categories     - Comma-separated category IDs
sellerId       - Filter by seller
sellerCountry  - Filter by seller country
inStock        - Only in-stock items (true/false)
freeShipping   - Free shipping only (true/false)
language       - Content language
currency       - Display currency
minRating      - Minimum rating (1-5)
sortBy         - Sort order (relevance, price_asc, price_desc, newest, popular, rating)
page           - Page number
limit          - Results per page
```

**Example Request**:
```bash
GET /api/products/search?q=islamic&categories=books,ebooks&minPrice=10&maxPrice=100&sortBy=relevance&page=1&limit=20
```

**Response**:
```typescript
{
  results: ProductSearchResult[],
  total: number,
  page: number,
  totalPages: number,
  facets: {
    categories: [{ name: string, count: number }],
    priceRanges: [{ range: string, count: number }],
    sellers: [{ name: string, count: number }],
    languages: [{ code: string, count: number }]
  }
}
```

### Filters & Facets

**Dynamic Facets**:
- Categories with counts
- Price ranges ($0-$25, $25-$50, $50-$100, $100+)
- Top sellers
- Languages (if multilingual)

**Client-Side Usage**:
```typescript
import {
  applyFilters,
  sortResults,
  generateFacets,
} from '@/lib/product-discovery';

// Apply filters
const filtered = applyFilters(products, {
  minPrice: 10,
  maxPrice: 100,
  categories: ['books'],
  inStock: true,
});

// Sort results
const sorted = sortResults(filtered, 'price_asc');

// Generate facets for UI
const facets = generateFacets(products);
```

### Relevance Scoring

**Algorithm**:
```
Score = 0
+ 100 if exact title match
+ 50  if title starts with term
+ 25  if title contains term
+ 10  if description contains term
+ (rating * 10)           // 0-50 points
+ (reviewCount / 5)       // 0-20 points
- 30  if out of stock
```

### Search Suggestions

```typescript
import { buildSearchSuggestions } from '@/lib/product-discovery';

const suggestions = buildSearchSuggestions(
  'isl',              // Current search term
  recentSearches,     // User's recent searches
  popularProducts,    // Trending products
  categories          // All categories
);
```

### Search History

```typescript
import { saveSearchHistory, getSearchHistory } from '@/lib/product-discovery';

// Save search
saveSearchHistory('islamic books', userId);

// Get history
const history = getSearchHistory(userId);
```

---

## 🌍 Localization Support

### Product Translations

**Structure**:
```typescript
interface Product {
  title: string;
  titleTranslations?: {
    en: string;
    ar: string;
    ur: string;
    tr: string;
    fr: string;
  };
  description: string;
  descriptionTranslations?: {
    // Same as above
  };
}
```

**Usage**:
```typescript
import { getTranslatedField } from '@/lib/product-discovery';

const title = getTranslatedField(
  product.title,
  product.titleTranslations,
  'ar',  // User's locale
  'Untitled'  // Fallback
);
```

### Currency Conversion

```typescript
import { convertProductPrice } from '@/lib/product-discovery';

// Convert product price to user's currency
const priceInEUR = await convertProductPrice(product, 'EUR');
```

### Locale Detection

```typescript
import { getDefaultCurrency } from '@/lib/i18n/config';

// Get default currency for user's locale
const currency = getDefaultCurrency('ar'); // Returns 'AED'
```

---

## 💰 VAT/Tax Calculator

### Regional Tax Support

**Supported Regions**:
- **European Union**: VAT (19-25%)
- **United States**: Sales tax by state (0-10%)
- **Canada**: GST/HST (5-15%)
- **Middle East**: UAE (5%), Saudi Arabia (15%)
- **Asia-Pacific**: Australia (10%), Singapore (8%), etc.
- **Turkey**: VAT (18%)

### Tax Calculation

```typescript
import { calculateTax } from '@/lib/tax-calculator';

const tax = calculateTax(
  100,      // Subtotal
  10,       // Shipping
  'GB',     // Country
  undefined // Region (for US/Canada)
);

// Result:
{
  taxableAmount: 110,    // Subtotal + Shipping (if applicable)
  taxRate: 20,           // 20%
  taxAmount: 22,         // £22
  taxType: 'VAT',
  country: 'GB'
}
```

### Multi-Seller Tax

```typescript
import { calculateMultiSellerTax } from '@/lib/tax-calculator';

const taxBreakdown = calculateMultiSellerTax(
  [
    { sellerId: 'seller1', subtotal: 100, shipping: 10 },
    { sellerId: 'seller2', subtotal: 50, shipping: 5 },
  ],
  'GB'  // Country
);

// Returns tax calculation for each seller
```

### Tax Rate Display

```typescript
import { getTaxRateDisplay, hasTax } from '@/lib/tax-calculator';

// Get formatted tax rate
const display = getTaxRateDisplay('GB'); // "VAT: 20%"

// Check if region has tax
const isTaxable = hasTax('US', 'CA'); // true
```

### Tax ID Validation

```typescript
import { validateTaxId } from '@/lib/tax-calculator';

// Validate VAT/Tax ID
const isValid = validateTaxId('GB123456789', 'GB'); // true/false
```

### Tax Exemptions

```typescript
import { checkTaxExemption } from '@/lib/tax-calculator';

// Check if buyer qualifies for exemption
const isExempt = checkTaxExemption(
  'US',              // Country
  'business',        // Exemption type
  true               // Has valid document
);
```

---

## 💸 Automated Payouts

### System Overview

**Features**:
- Automated payout scheduling
- Multiple payout methods (Stripe, PayPal, bank transfer)
- Ledger tracking and reconciliation
- Retry logic for failed payouts
- Batch processing

### Payout Schedules

```typescript
import { getNextPayoutDate } from '@/lib/automated-payouts';

const schedule = {
  frequency: 'weekly',  // daily, weekly, biweekly, monthly
  dayOfWeek: 1,         // Monday
  minimumAmount: 50,     // Minimum $50 to payout
  autoPayoutEnabled: true,
};

const nextPayout = getNextPayoutDate(schedule);
```

### Balance Calculation

```typescript
import { calculateSellerBalance } from '@/lib/automated-payouts';

const balance = calculateSellerBalance(ledgerEntries);

// Result:
{
  sellerId: 'seller_123',
  availableBalance: 450.00,     // Ready to payout
  pendingBalance: 150.00,       // Held for 7 days
  totalEarnings: 2500.00,       // Lifetime
  totalPayouts: 1900.00,        // Paid out
  currency: 'USD',
  lastPayoutDate: Date,
  nextPayoutDate: Date
}
```

### Creating Payouts

```typescript
import { createPayout } from '@/lib/automated-payouts';

const payout = await createPayout(
  'seller_123',           // Seller ID
  450.00,                 // Amount
  'USD',                  // Currency
  ['tx_001', 'tx_002'],  // Transaction IDs
  'stripe'                // Method
);
```

### Processing Payouts

**Stripe**:
```typescript
import { processStripePayout } from '@/lib/automated-payouts';

const result = await processStripePayout(
  payout,
  'acct_stripe_123'  // Stripe Connect account ID
);
```

**PayPal**:
```typescript
import { processPayPalPayout } from '@/lib/automated-payouts';

const result = await processPayPalPayout(
  payout,
  'seller@example.com'  // PayPal email
);
```

### Ledger Tracking

**Entry Types**:
- `sale` - Product sale
- `refund` - Order refund
- `payout` - Payout to seller
- `fee` - Platform/processor fee
- `adjustment` - Manual adjustment

```typescript
import { recordLedgerEntry } from '@/lib/automated-payouts';

const entry = await recordLedgerEntry({
  sellerId: 'seller_123',
  type: 'sale',
  amount: 100.00,
  currency: 'USD',
  orderId: 'm4k-001',
  description: 'Order #m4k-001 sale',
  metadata: { /* additional data */ },
});
```

### Batch Processing

```typescript
import { batchProcessPayouts } from '@/lib/automated-payouts';

// Run as cron job
const result = await batchProcessPayouts();

// Result:
{
  processed: 15,
  succeeded: 14,
  failed: 1
}
```

### Reconciliation

```typescript
import { reconcilePayouts } from '@/lib/automated-payouts';

const report = await reconcilePayouts(
  'seller_123',
  startDate,
  endDate
);

// Result:
{
  matched: 48,
  unmatched: 2,
  discrepancies: [
    {
      type: 'missing_payout',
      description: 'Payout #123 not found in ledger',
      amount: 50.00
    }
  ]
}
```

### Retry Failed Payouts

```typescript
import { retryPayout } from '@/lib/automated-payouts';

const retried = await retryPayout(
  'payout_123',
  3  // Max retries
);
```

---

## 📊 Payout Dashboard

### Statistics

```typescript
import { getPayoutStatistics } from '@/lib/automated-payouts';

const stats = await getPayoutStatistics('seller_123', 'month');

// Result:
{
  totalPayouts: 8,
  totalAmount: 2400.00,
  averagePayoutAmount: 300.00,
  successRate: 97.5,            // 97.5% success
  averageProcessingTime: 24,    // 24 hours
  pendingCount: 1,
  pendingAmount: 150.00,
  failedCount: 1
}
```

---

## 🔄 Integration Flow

### Complete Order → Payout Flow

```
┌─────────────┐
│  Customer   │
│  Purchase   │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  Multi-Seller    │
│  Cart Created    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Tax Calculated  │
│  Per Seller      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Payment Split   │
│  & Processed     │
└──────┬───────────┘
       │
       ├─── Record Ledger Entry (each seller)
       │
       ├─── 7-Day Holding Period
       │
       ▼
┌──────────────────┐
│  Balance         │
│  Available       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Payout Schedule │
│  Triggered       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Payout          │
│  Processed       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Ledger Updated  │
│  Reconciled      │
└──────────────────┘
```

---

## 🎯 Best Practices

### Multi-Seller Cart
- Always validate cart items before checkout
- Group items by seller for transparent pricing
- Calculate shipping per seller independently
- Show clear seller attribution in UI

### Tax Calculation
- Calculate tax at checkout, not cart
- Update taxes if shipping address changes
- Handle tax exemptions properly
- Keep tax rates updated regularly

### Product Discovery
- Index products for fast search
- Cache search results (Redis)
- Implement pagination for large result sets
- Use relevance scoring for better UX

### Automated Payouts
- Hold funds for 7-14 days (fraud protection)
- Set reasonable minimum payout amounts ($25-$50)
- Implement retry logic with backoff
- Monitor payout success rates
- Reconcile ledgers regularly
- Send payout notifications to sellers

---

## 🧪 Testing

### Multi-Seller Cart

```typescript
import { validateMultiSellerCart } from '@/lib/multi-seller-cart';

const validation = await validateMultiSellerCart(cartItems);

if (!validation.valid) {
  console.error('Cart validation errors:', validation.errors);
}
```

### Tax Calculation

```typescript
// Test different regions
const testCases = [
  { country: 'GB', expected: 20 },
  { country: 'US', region: 'CA', expected: 7.25 },
  { country: 'AE', expected: 5 },
];

testCases.forEach(({ country, region, expected }) => {
  const tax = calculateTax(100, 10, country, region);
  assert(tax.taxRate === expected);
});
```

### Payout Processing

```bash
# Test Stripe payout (sandbox)
STRIPE_SECRET_KEY=sk_test_... npm run test:payouts

# Test PayPal payout (sandbox)
PAYPAL_CLIENT_ID=sandbox_... npm run test:payouts
```

---

## 🚀 Deployment

### Environment Variables

```bash
# Tax Configuration
TAX_CALCULATION_ENABLED=true
TAX_EXEMPTION_CHECK=true

# Payout Configuration
PAYOUT_ENABLED=true
PAYOUT_MINIMUM_AMOUNT=50
PAYOUT_HOLDING_DAYS=7
PAYOUT_RETRY_MAX=3

# Search Configuration
SEARCH_CACHE_TTL=3600
SEARCH_MAX_RESULTS=1000
```

### Cron Jobs

```yaml
# Batch process payouts (daily at 9 AM)
0 9 * * * /app/scripts/process-payouts.sh

# Reconcile ledgers (daily at 11 PM)
0 23 * * * /app/scripts/reconcile-ledgers.sh

# Update tax rates (weekly)
0 0 * * 0 /app/scripts/update-tax-rates.sh
```

### Database Migrations

```sql
-- Ledger entries table
CREATE TABLE ledger_entries (
  id VARCHAR(255) PRIMARY KEY,
  seller_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  order_id VARCHAR(255),
  payout_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_seller (seller_id),
  INDEX idx_order (order_id),
  INDEX idx_payout (payout_id)
);

-- Payouts table
CREATE TABLE payouts (
  id VARCHAR(255) PRIMARY KEY,
  seller_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL,
  method VARCHAR(50) NOT NULL,
  stripe_payout_id VARCHAR(255),
  paypal_batch_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scheduled_at TIMESTAMP,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  failure_reason TEXT,
  retry_count INT DEFAULT 0,
  INDEX idx_seller (seller_id),
  INDEX idx_status (status)
);
```

---

## 📈 Monitoring

### Key Metrics

**Cart & Checkout**:
- Multi-seller cart conversion rate
- Average sellers per order
- Cart abandonment by seller count

**Search & Discovery**:
- Search queries per day
- Average results per query
- Click-through rate from search
- Filter usage statistics

**Tax**:
- Orders by tax region
- Average tax amount
- Tax exemptions granted

**Payouts**:
- Payouts processed per day
- Average payout amount
- Success rate by method
- Average processing time
- Failed payout rate

---

## 📚 API Reference

### Multi-Seller Cart API

```typescript
// Group items by seller
groupItemsBySeller(items: CartItem[]): SellerGroup[]

// Create multi-seller cart
createMultiSellerCart(items: CartItem[]): MultiSellerCart

// Calculate seller payments
calculateSellerPayments(cart: MultiSellerCart): SellerPayment[]

// Validate cart
validateMultiSellerCart(items: CartItem[]): Promise<{valid: boolean, errors: string[]}>
```

### Tax Calculator API

```typescript
// Calculate tax
calculateTax(subtotal, shipping, country, region?): TaxCalculation

// Multi-seller tax
calculateMultiSellerTax(sellers, country, region?): SellerTaxBreakdown[]

// Get tax rate
getTaxRateDisplay(country, region?): string

// Validate tax ID
validateTaxId(taxId, country): boolean
```

### Product Discovery API

```typescript
// Build search query
buildSearchQuery(searchTerm, filters): string

// Apply filters
applyFilters(results, filters): ProductSearchResult[]

// Sort results
sortResults(results, sortBy): ProductSearchResult[]

// Generate facets
generateFacets(results): Facets
```

### Automated Payouts API

```typescript
// Calculate balance
calculateSellerBalance(entries): SellerBalance

// Create payout
createPayout(sellerId, amount, currency, transactions, method): Promise<PayoutRecord>

// Process payout
processStripePayout(payout, accountId): Promise<PayoutRecord>
processPayPalPayout(payout, email): Promise<PayoutRecord>

// Record ledger entry
recordLedgerEntry(entry): Promise<LedgerEntry>

// Batch processing
batchProcessPayouts(): Promise<{processed, succeeded, failed}>
```

---

**Last Updated**: November 9, 2025  
**Version**: 2.0  
**Status**: ✅ Production Ready

