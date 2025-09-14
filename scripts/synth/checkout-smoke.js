const { chromium } = require('@playwright/test');

(async () => {
  const baseUrl = process.env.SYNTH_BASE_URL || 'https://m4ktaba.com';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`🔍 Navigating to: ${baseUrl}/checkout?synth=1`);
    await page.goto(`${baseUrl}/checkout?synth=1`);
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Debug: Check if the page loaded correctly
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check if we're on the right page
    const url = page.url();
    console.log(`🌐 Current URL: ${url}`);
    
    // Try to find the element
    console.log('🔍 Looking for shipping-details-heading element...');
    try {
      await page.waitForSelector('[data-testid="shipping-details-heading"]', {
        timeout: 10000,
      });
      console.log('✅ Found shipping-details-heading by data-testid');
    } catch (e) {
      console.log('⚠️  data-testid not found, trying text content...');
      // Fallback: look for "Shipping Details" text
      await page.waitForSelector('text=Shipping Details', {
        timeout: 5000,
      });
      console.log('✅ Found Shipping Details by text content');
    }
    console.log('✅ Checkout page smoke test passed');
  } catch (error) {
    console.error('❌ Checkout page smoke test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
