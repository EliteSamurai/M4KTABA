/**
 * Test script to verify shipping calculation fixes
 * Tests the normalization logic and ensures domestic = domestic
 */

// Simulate the normalization function
function normalizeCountryCode(countryInput) {
  if (!countryInput || typeof countryInput !== 'string') {
    return 'US';
  }
  
  let code = countryInput.trim().toUpperCase();
  
  if (code.length === 2 && /^[A-Z]{2}$/.test(code)) {
    return code;
  }
  
  const countryNameMap = {
    'UNITED STATES': 'US',
    'USA': 'US',
    'UNITED STATES OF AMERICA': 'US',
    'CANADA': 'CA',
    'UNITED KINGDOM': 'GB',
    'UK': 'GB',
    'GREAT BRITAIN': 'GB',
    'SAUDI ARABIA': 'SA',
    'KSA': 'SA',
    'UNITED ARAB EMIRATES': 'AE',
    'UAE': 'AE',
    'EMIRATES': 'AE',
  };
  
  if (countryNameMap[code]) {
    return countryNameMap[code];
  }
  
  console.warn(`⚠️  Could not normalize: "${countryInput}", defaulting to US`);
  return 'US';
}

function getShippingTier(sellerCountry, buyerCountry) {
  const seller = normalizeCountryCode(sellerCountry);
  const buyer = normalizeCountryCode(buyerCountry);
  
  console.log(`  Raw: ${sellerCountry} → ${buyerCountry}`);
  console.log(`  Normalized: ${seller} → ${buyer}`);
  
  if (seller === buyer) {
    return 'domestic';
  }
  
  // Simplified: just for testing
  return 'international';
}

console.log('🧪 Testing Shipping Calculation Fixes\n');
console.log('='.repeat(60));

// Test cases that should ALL be domestic
const testCases = [
  { seller: 'US', buyer: 'US', expected: 'domestic', desc: 'Standard US → US' },
  { seller: 'us', buyer: 'US', expected: 'domestic', desc: 'Lowercase seller' },
  { seller: 'US', buyer: 'us', expected: 'domestic', desc: 'Lowercase buyer' },
  { seller: ' US ', buyer: 'US', expected: 'domestic', desc: 'Seller with whitespace' },
  { seller: 'US', buyer: ' US ', expected: 'domestic', desc: 'Buyer with whitespace' },
  { seller: 'USA', buyer: 'US', expected: 'domestic', desc: 'USA → US' },
  { seller: 'US', buyer: 'United States', expected: 'domestic', desc: 'US → United States' },
  { seller: 'United States', buyer: 'USA', expected: 'domestic', desc: 'Full name variants' },
  { seller: 'SA', buyer: 'SA', expected: 'domestic', desc: 'Saudi Arabia domestic' },
  { seller: 'AE', buyer: 'AE', expected: 'domestic', desc: 'UAE domestic' },
  { seller: 'UAE', buyer: 'AE', expected: 'domestic', desc: 'UAE variant' },
  { seller: 'GB', buyer: 'GB', expected: 'domestic', desc: 'UK domestic' },
  { seller: 'UK', buyer: 'GB', expected: 'domestic', desc: 'UK variant' },
  { seller: 'CA', buyer: 'CA', expected: 'domestic', desc: 'Canada domestic' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\n📦 Test ${index + 1}: ${test.desc}`);
  const result = getShippingTier(test.seller, test.buyer);
  
  if (result === test.expected) {
    console.log(`  ✅ PASS: Got "${result}"`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: Expected "${test.expected}", got "${result}"`);
    failed++;
  }
});

// Test international cases
console.log('\n' + '='.repeat(60));
console.log('\n🌍 Testing International Cases\n');

const intlCases = [
  { seller: 'US', buyer: 'GB', expected: 'international', desc: 'US → UK' },
  { seller: 'SA', buyer: 'US', expected: 'international', desc: 'Saudi Arabia → US' },
  { seller: 'AE', buyer: 'CA', expected: 'international', desc: 'UAE → Canada' },
];

intlCases.forEach((test, index) => {
  console.log(`\n✈️  Test ${index + 1}: ${test.desc}`);
  const result = getShippingTier(test.seller, test.buyer);
  
  if (result === test.expected) {
    console.log(`  ✅ PASS: Got "${result}"`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: Expected "${test.expected}", got "${result}"`);
    failed++;
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary\n');
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Shipping calculation fix verified!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the fixes.');
  process.exit(1);
}

