const { chromium } = require('@playwright/test');

(async () => {
  const baseUrl = process.env.SYNTH_BASE_URL || 'https://m4ktaba.com';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${baseUrl}/checkout?synthetic=true`);
    // Basic smoke: page renders
    await page.waitForSelector('text=Shipping Details', { timeout: 10000 });
    console.log('✅ Checkout page smoke test passed');
  } catch (error) {
    console.error('❌ Checkout page smoke test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
