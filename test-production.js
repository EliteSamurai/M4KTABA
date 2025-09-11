#!/usr/bin/env node

/**
 * Quick Production Testing Script for M4KTABA
 * Run with: node test-production.js
 */

const BASE_URL = 'https://m4ktaba-oljjxcu5p-elitesamurais-projects.vercel.app';

const tests = [
  {
    name: 'Homepage',
    url: '/',
    expectedStatus: 200,
    checkContent: 'M4KTABA',
  },
  {
    name: 'All Books Page',
    url: '/all',
    expectedStatus: 200,
    checkContent: 'M4KTABA',
  },
  {
    name: 'Blog Page',
    url: '/blog',
    expectedStatus: 200,
    checkContent: 'M4KTABA',
  },
  {
    name: 'Health API',
    url: '/api/health',
    expectedStatus: 200,
    checkContent: '{"ok":true}',
  },
  {
    name: 'Books API',
    url: '/api/get-all-books',
    expectedStatus: 200,
    checkContent: 'books',
  },
  {
    name: 'Sell Page',
    url: '/sell',
    expectedStatus: 200,
    checkContent: 'M4KTABA',
  },
];

async function runTest(test) {
  try {
    const response = await fetch(`${BASE_URL}${test.url}`);
    const text = await response.text();

    const statusOk = response.status === test.expectedStatus;
    const contentOk = test.checkContent
      ? text.includes(test.checkContent)
      : true;

    const status = statusOk && contentOk ? '✅' : '❌';
    const statusText = statusOk
      ? `${response.status}`
      : `${response.status} (expected ${test.expectedStatus})`;

    console.log(`${status} ${test.name}: ${statusText}`);

    if (!statusOk || !contentOk) {
      console.log(`   URL: ${BASE_URL}${test.url}`);
      if (!contentOk) {
        console.log(
          `   Content check failed: looking for "${test.checkContent}"`
        );
      }
    }

    return statusOk && contentOk;
  } catch (error) {
    console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Testing M4KTABA Production Deployment\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const success = await runTest(test);
    if (success) passed++;

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed! Your app is ready for production.');
  } else {
    console.log('⚠️  Some tests failed. Check the issues above.');
  }
}

// Run the tests
runAllTests().catch(console.error);
