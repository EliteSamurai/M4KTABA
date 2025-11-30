# Multi-Country Shipping Strategy

## Overview

M4KTABA operates as a global, multi-seller marketplace where sellers ship from their own locations. Our shipping strategy is designed to be **fair**, **transparent**, and **affordable** for both buyers and sellers across all countries.

### Core Principles

1. **Distance-Based Pricing**: Shipping cost is based on the distance between seller and buyer
2. **No Platform Fees**: We don't charge any platform fees on products or shipping
3. **Subsidized Shipping**: We subsidize shipping costs to keep them low for buyers
4. **Multi-Seller Discounts**: 25% discount on additional sellers in the same order
5. **Free Shipping Thresholds**: Spend thresholds unlock free shipping

---

## Shipping Tiers

We use three shipping tiers based on the **seller's country** and **buyer's country**:

### 1. 🏠 Domestic Shipping

**Definition**: Buyer and seller are in the **same country**

| Component | Amount |
|-----------|--------|
| Buyer Pays | $3.99 |
| Seller Pays | $0.00 |
| Platform Subsidy | $1.50 |
| **Actual Cost** | **$5.49** |

**Delivery**: 3-7 days  
**Carrier**: USPS Media Mail (US), Aramex/Local Post (Middle East), Royal Mail (UK), Local post elsewhere

**Free Shipping**: Orders $35+

---

### 2. 📦 Regional Shipping

**Definition**: Buyer and seller are in the **same region** (e.g., GCC, EU, North America)

| Component | Amount |
|-----------|--------|
| Buyer Pays | $7.99 |
| Seller Pays | $1.00 |
| Platform Subsidy | $2.00 |
| **Actual Cost** | **$10.99** |

**Delivery**: 5-10 days  
**Carrier**: DHL / Aramex

**Free Shipping**: Orders $50+

#### Special: GCC Express 🌟

For shipments between Gulf Cooperation Council countries (UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain):

| Component | Amount |
|-----------|--------|
| Buyer Pays | $4.99 |
| Seller Pays | $0.00 |
| Platform Subsidy | $2.50 |
| **Actual Cost** | **$7.49** |

**Delivery**: 2-4 days  
**Carrier**: Aramex Express

---

### 3. ✈️ International Shipping

**Definition**: Buyer and seller are in **different regions**

| Component | Amount |
|-----------|--------|
| Buyer Pays | $14.99 |
| Seller Pays | $4.00 |
| Platform Subsidy | $0.00 |
| **Actual Cost** | **$18.99** |

**Delivery**: 10-21 days  
**Carrier**: DHL International / FedEx

**Free Shipping**: Orders $75+

---

## Regional Definitions

### Middle East
UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain, Jordan, Lebanon, Egypt, Iraq, Yemen

### Gulf Cooperation Council (GCC)
UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain

### North America
United States, Canada, Mexico

### Europe
UK, Germany, France, Italy, Spain, Netherlands, Belgium, Austria, Switzerland, Sweden, Norway, Denmark, Finland, Ireland, Portugal, Greece, Poland, Czech Republic, Hungary, Romania, Bulgaria, Croatia, Slovenia, Slovakia, Estonia, Latvia, Lithuania, Luxembourg, Malta, Cyprus

### South Asia
Pakistan, India, Bangladesh, Sri Lanka, Nepal, Afghanistan, Maldives, Bhutan

### East Asia
Japan, China, South Korea, Taiwan, Hong Kong, Singapore, Malaysia, Thailand, Vietnam, Philippines, Indonesia

### Oceania
Australia, New Zealand, Fiji, Papua New Guinea

### Africa
South Africa, Nigeria, Kenya, Ghana, Tanzania, Uganda, Ethiopia, Morocco, Algeria, Tunisia

### Latin America
Brazil, Argentina, Chile, Colombia, Peru, Venezuela, Ecuador, Bolivia, Paraguay, Uruguay

---

## Multi-Item Shipping

### Additional Items

For each additional book in a shipment to the same buyer from the same seller:

- **Per-Item Fee**: +$1.50 (buyer pays)
- **Actual Cost Increase**: +$2.25 (we subsidize $0.75)

**Example**: 3 books from one seller (domestic)
- Base shipping: $3.99
- Additional 2 books: 2 × $1.50 = $3.00
- **Total buyer pays**: $6.99

---

## Multi-Seller Orders

When a buyer purchases from multiple sellers:

### Pricing

1. **First seller**: Full shipping cost
2. **Each additional seller**: 25% discount

**Example**: 2 sellers, both domestic
- Seller 1: $3.99
- Seller 2: $3.99 × 0.75 = $2.99
- **Total**: $6.98 (saved $1.00)

### Shipment Handling

- Each seller ships **independently** from their location
- Buyers receive **separate packages** with individual tracking
- Each shipment may have different delivery times based on the seller's tier

---

## Free Shipping

### Thresholds (Per Seller)

| Tier | Free Shipping Threshold |
|------|-------------------------|
| 🏠 Domestic | $35+ |
| 📦 Regional | $50+ |
| ✈️ International | $75+ |

### How It Works

Free shipping is calculated **per seller**. If a buyer's order from a single seller meets the threshold, shipping from that seller is free.

**Example**:
- Seller A (domestic): $40 in books → FREE shipping
- Seller B (domestic): $20 in books → $3.99 shipping
- **Total shipping**: $3.99

---

## Cost Transparency

### Platform Subsidy

We absorb a portion of shipping costs to keep prices low:

| Tier | Subsidy | % of Actual Cost |
|------|---------|------------------|
| Domestic | $1.50 | 27% |
| Regional | $2.00 | 18% |
| GCC Express | $2.50 | 33% |
| International | $0.00 | 0% |

### Why We Subsidize

1. **Competitive Pricing**: Keeps M4KTABA affordable
2. **Seller Protection**: Sellers never lose money on shipping
3. **Buyer Satisfaction**: Lower costs encourage purchases
4. **Growth**: Affordable shipping drives marketplace adoption

---

## Seller Payouts

Sellers receive:

1. **Full product price** (no platform fees!)
2. **Shipping contribution** (for regional/international)
   - Regional: $1.00 per order
   - International: $4.00 per order

The seller's shipping contribution helps cover their actual costs (packaging, carrier fees, time).

---

## Implementation

### File Structure

```
lib/
  shipping-smart.ts       # Core shipping calculator
  multi-seller-cart.ts    # Multi-seller cart logic
types/
  shipping-types.ts       # TypeScript interfaces
app/
  api/
    create-payment-intent/ # Payment with shipping
    cart/validate/        # Cart validation with shipping
components/
  MultiSellerCheckout.tsx # Multi-seller UI
  ProductCard.jsx        # Shows shipping estimates
  cart-summary.tsx       # Cart with shipping breakdown
copy/
  checkout.ts            # Shipping copy/messaging
```

### Usage

```typescript
import { calculateShipping, getShippingTier } from '@/lib/shipping-smart';

// Calculate shipping for a single seller
const shipping = calculateShipping(
  'US',  // seller country
  'CA',  // buyer country
  2      // item count
);

console.log(shipping);
// {
//   tier: 'regional',
//   buyerPays: 9.49,
//   sellerPays: 1.00,
//   platformSubsidy: 2.00,
//   actualCost: 12.49,
//   estimatedDays: { min: 5, max: 10 },
//   carrier: 'DHL / Aramex'
// }
```

### Multi-Seller Calculation

```typescript
import { calculateMultiSellerShipping } from '@/lib/shipping-smart';

const sellers = [
  {
    sellerId: 'seller1',
    sellerCountry: 'US',
    itemCount: 2,
    subtotal: 45.00
  },
  {
    sellerId: 'seller2',
    sellerCountry: 'GB',
    itemCount: 1,
    subtotal: 25.00
  }
];

const shipping = calculateMultiSellerShipping(sellers, 'CA');

console.log(shipping);
// {
//   totalBuyerPays: 14.24,  // $3.99 (first) + $10.49 * 0.75 (second with discount)
//   totalSellerPays: 1.00,
//   totalPlatformSubsidy: 3.50,
//   totalActualCost: 18.74,
//   multiSellerDiscount: 2.62,
//   sellers: [ /* per-seller breakdown */ ]
// }
```

---

## User Experience

### Product Pages

Each product card shows:
- **Shipping badge**: 🏠 Domestic / 📦 Regional / ✈️ International
- **Shipping cost**: "+$X.XX"
- **Seller location**: Country code (e.g., "US")
- **Delivery estimate**: "3-7 days"

### Checkout

Cart summary displays:
- **Per-seller breakdown**: Subtotal, shipping, tier
- **Multi-seller discount**: If applicable
- **Free shipping badges**: When thresholds met
- **Total transparency**: Subtotal + shipping = total (no hidden fees)

### Order Confirmation

Email includes:
- **Separate tracking** for each seller
- **Estimated delivery** per shipment
- **Carrier info** for each package

---

## FAQ

### Why is shipping different for each seller?

Because sellers ship from their own locations! A seller in your country has cheaper/faster shipping than one overseas.

### Why do some books cost more to ship?

It depends on where the seller is located relative to you. We show shipping costs upfront on every product.

### Can I combine shipping from multiple sellers?

No, each seller ships independently. However, you get a 25% discount on shipping from additional sellers!

### Do you charge platform fees on shipping?

No! In fact, we **subsidize** shipping costs to keep them lower for you.

### What if I return an item?

Buyers cover return shipping. We recommend USPS/local carriers for cost-effective returns.

---

## Maintenance

### Updating Shipping Rates

1. Modify `DEFAULT_SHIPPING_CONFIG` in `lib/shipping-smart.ts`
2. Update this documentation
3. Run tests: `pnpm test`
4. Deploy changes

### Adding New Regions

1. Add country codes to `SHIPPING_REGIONS` in `lib/shipping-smart.ts`
2. Update carrier logic in `getCarrierInfo()`
3. Update documentation
4. Test with sample orders

### Monitoring

Track these metrics:
- Average shipping cost per tier
- Free shipping conversion rate
- Multi-seller order frequency
- Platform shipping subsidy total
- Seller shipping contribution

---

## Roadmap

### Potential Improvements

1. **Dynamic Pricing**: Real-time carrier rate APIs (EasyPost, Shippo)
2. **Carbon Neutral**: Offset shipping emissions
3. **Express Options**: Premium shipping upgrades
4. **Local Pickup**: In-person pickup for nearby sellers
5. **Bulk Discounts**: Lower rates for high-volume buyers

---

## Support

For questions or issues:
- **Documentation**: This file
- **Code**: `lib/shipping-smart.ts`
- **Support**: contact@m4ktaba.com

---

**Last Updated**: 2025-11-30  
**Version**: 1.0.0  
**Author**: M4KTABA Engineering Team

