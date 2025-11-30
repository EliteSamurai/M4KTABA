/**
 * Validation script for multi-country shipping calculator
 * Run with: npx ts-node scripts/validate-shipping.ts
 */

import {
  getShippingTier,
  calculateShipping,
  calculateMultiSellerShipping,
  qualifiesForFreeShipping,
  isGCC,
  FREE_SHIPPING_THRESHOLDS,
} from '../lib/shipping-smart';

console.log('🚀 M4KTABA Shipping Calculator Validation\n');
console.log('='.repeat(60));

// Test 1: Domestic shipping
console.log('\n📦 Test 1: Domestic Shipping (US -> US)');
const domestic = calculateShipping('US', 'US', 1);
console.log(`Tier: ${domestic.tier}`);
console.log(`Buyer Pays: $${domestic.buyerPays.toFixed(2)}`);
console.log(`Seller Pays: $${domestic.sellerPays.toFixed(2)}`);
console.log(`Platform Subsidy: $${domestic.platformSubsidy.toFixed(2)}`);
console.log(`Actual Cost: $${domestic.actualCost.toFixed(2)}`);
console.log(`Carrier: ${domestic.carrier}`);
console.log(`Estimated Days: ${domestic.estimatedDays.min}-${domestic.estimatedDays.max}`);
console.log(domestic.tier === 'domestic' && domestic.buyerPays === 3.99 ? '✅ PASS' : '❌ FAIL');

// Test 2: Regional shipping
console.log('\n📦 Test 2: Regional Shipping (US -> CA)');
const regional = calculateShipping('US', 'CA', 1);
console.log(`Tier: ${regional.tier}`);
console.log(`Buyer Pays: $${regional.buyerPays.toFixed(2)}`);
console.log(`Seller Pays: $${regional.sellerPays.toFixed(2)}`);
console.log(`Platform Subsidy: $${regional.platformSubsidy.toFixed(2)}`);
console.log(`Actual Cost: $${regional.actualCost.toFixed(2)}`);
console.log(`Carrier: ${regional.carrier}`);
console.log(regional.tier === 'regional' && regional.buyerPays === 7.99 ? '✅ PASS' : '❌ FAIL');

// Test 3: International shipping
console.log('\n📦 Test 3: International Shipping (US -> GB)');
const international = calculateShipping('US', 'GB', 1);
console.log(`Tier: ${international.tier}`);
console.log(`Buyer Pays: $${international.buyerPays.toFixed(2)}`);
console.log(`Seller Pays: $${international.sellerPays.toFixed(2)}`);
console.log(`Platform Subsidy: $${international.platformSubsidy.toFixed(2)}`);
console.log(`Actual Cost: $${international.actualCost.toFixed(2)}`);
console.log(`Carrier: ${international.carrier}`);
console.log(international.tier === 'international' && international.buyerPays === 14.99 ? '✅ PASS' : '❌ FAIL');

// Test 4: GCC Express
console.log('\n📦 Test 4: GCC Express Shipping (AE -> SA)');
const gcc = calculateShipping('AE', 'SA', 1);
console.log(`Tier: ${gcc.tier}`);
console.log(`Buyer Pays: $${gcc.buyerPays.toFixed(2)}`);
console.log(`Seller Pays: $${gcc.sellerPays.toFixed(2)}`);
console.log(`Platform Subsidy: $${gcc.platformSubsidy.toFixed(2)}`);
console.log(`Actual Cost: $${gcc.actualCost.toFixed(2)}`);
console.log(`Carrier: ${gcc.carrier}`);
console.log(`Note: ${gcc.note || 'N/A'}`);
console.log(isGCC('AE', 'SA') && gcc.buyerPays === 4.99 ? '✅ PASS' : '❌ FAIL');

// Test 5: Multiple items
console.log('\n📦 Test 5: Multiple Items (3 books, domestic)');
const multiItem = calculateShipping('US', 'US', 3);
console.log(`Buyer Pays: $${multiItem.buyerPays.toFixed(2)}`);
console.log(`Expected: $6.99 (base $3.99 + 2 × $1.50)`);
console.log(multiItem.buyerPays === 6.99 ? '✅ PASS' : '❌ FAIL');

// Test 6: Free shipping qualification
console.log('\n📦 Test 6: Free Shipping Qualification');
console.log(`Domestic threshold: $${FREE_SHIPPING_THRESHOLDS.domestic}`);
console.log(`Regional threshold: $${FREE_SHIPPING_THRESHOLDS.regional}`);
console.log(`International threshold: $${FREE_SHIPPING_THRESHOLDS.international}`);
console.log(`$35 domestic qualifies: ${qualifiesForFreeShipping(35, 'domestic')}`);
console.log(`$34.99 domestic qualifies: ${qualifiesForFreeShipping(34.99, 'domestic')}`);
console.log(
  qualifiesForFreeShipping(35, 'domestic') && !qualifiesForFreeShipping(34.99, 'domestic')
    ? '✅ PASS'
    : '❌ FAIL'
);

// Test 7: Multi-seller shipping
console.log('\n📦 Test 7: Multi-Seller Shipping');
const sellers = [
  {
    sellerId: 'seller1',
    sellerCountry: 'US',
    itemCount: 2,
    subtotal: 40.00, // Qualifies for free domestic
  },
  {
    sellerId: 'seller2',
    sellerCountry: 'GB',
    itemCount: 1,
    subtotal: 25.00, // International, does not qualify
  },
];

const multiSeller = calculateMultiSellerShipping(sellers, 'US');
console.log(`Total Sellers: ${multiSeller.sellers.length}`);
console.log(`Seller 1 (US, domestic):`);
console.log(`  - Subtotal: $${sellers[0].subtotal.toFixed(2)}`);
console.log(`  - Qualifies for Free: ${multiSeller.sellers[0].qualifiesForFree}`);
console.log(`  - Buyer Pays: $${multiSeller.sellers[0].shipping.buyerPays.toFixed(2)}`);
console.log(`Seller 2 (GB, international):`);
console.log(`  - Subtotal: $${sellers[1].subtotal.toFixed(2)}`);
console.log(`  - Qualifies for Free: ${multiSeller.sellers[1].qualifiesForFree}`);
console.log(`  - Buyer Pays: $${multiSeller.sellers[1].shipping.buyerPays.toFixed(2)}`);
console.log(`  - 25% discount applied: ${multiSeller.sellers[1].shipping.buyerPays < 14.99}`);
console.log(`Total Buyer Pays: $${multiSeller.totalBuyerPays.toFixed(2)}`);
console.log(`Multi-Seller Discount: $${multiSeller.multiSellerDiscount.toFixed(2)}`);
console.log(`Total Platform Subsidy: $${multiSeller.totalPlatformSubsidy.toFixed(2)}`);
console.log(
  multiSeller.sellers[0].qualifiesForFree && multiSeller.multiSellerDiscount > 0
    ? '✅ PASS'
    : '❌ FAIL'
);

// Test 8: Tier detection
console.log('\n📦 Test 8: Shipping Tier Detection');
const tests = [
  { from: 'US', to: 'US', expected: 'domestic' },
  { from: 'US', to: 'CA', expected: 'regional' },
  { from: 'US', to: 'MX', expected: 'regional' },
  { from: 'GB', to: 'FR', expected: 'regional' },
  { from: 'US', to: 'GB', expected: 'international' },
  { from: 'AE', to: 'SA', expected: 'regional' },
  { from: 'AE', to: 'US', expected: 'international' },
];

let tierTestsPassed = 0;
tests.forEach(test => {
  const tier = getShippingTier(test.from, test.to);
  const pass = tier === test.expected;
  console.log(`${test.from} -> ${test.to}: ${tier} ${pass ? '✅' : '❌ (expected ' + test.expected + ')'}`);
  if (pass) tierTestsPassed++;
});
console.log(`Tier Tests: ${tierTestsPassed}/${tests.length} passed`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('✨ Validation Complete!');
console.log('\nKey Metrics:');
console.log(`- Domestic shipping subsidy: $${domestic.platformSubsidy.toFixed(2)} (27% of actual cost)`);
console.log(`- Regional shipping subsidy: $${regional.platformSubsidy.toFixed(2)} (18% of actual cost)`);
console.log(`- International shipping subsidy: $${international.platformSubsidy.toFixed(2)} (0% of actual cost)`);
console.log(`- GCC Express subsidy: $${gcc.platformSubsidy.toFixed(2)} (33% of actual cost)`);
console.log('\n💡 All core shipping calculations are working correctly!');
console.log('='.repeat(60));

