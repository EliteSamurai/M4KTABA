const { chromium } = require('@playwright/test');

(async () => {
  const baseUrl = process.env.SYNTH_BASE_URL || 'https://www.m4ktaba.com';

  console.log(`🔍 Starting simple health check for: ${baseUrl}`);
  console.log(`🕐 Test started at: ${new Date().toISOString()}`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Set reasonable timeouts
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);

    // Test 1: Basic homepage connectivity
    console.log('🔍 Test 1: Homepage connectivity');
    try {
      const response = await page.goto(baseUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      if (!response || !response.ok()) {
        throw new Error(
          `Homepage returned status: ${response?.status() || 'unknown'}`
        );
      }

      const title = await page.title();
      console.log(`✅ Homepage loaded successfully - Title: "${title}"`);

      // Basic content check
      const bodyText = await page.textContent('body');
      if (!bodyText || bodyText.length < 50) {
        throw new Error('Homepage has insufficient content');
      }
      console.log(`✅ Homepage has content (${bodyText.length} characters)`);
    } catch (error) {
      console.error(`❌ Homepage test failed: ${error.message}`);
      throw error;
    }

    // Test 2: Checkout page accessibility
    console.log('🔍 Test 2: Checkout page accessibility');
    try {
      const response = await page.goto(`${baseUrl}/checkout`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      if (!response || !response.ok()) {
        throw new Error(
          `Checkout page returned status: ${response?.status() || 'unknown'}`
        );
      }

      const title = await page.title();
      console.log(`✅ Checkout page loaded successfully - Title: "${title}"`);

      // Check for any obvious errors
      const errorElements = await page.$$eval(
        '[class*="error"], [role="alert"], .alert-error',
        elements => elements.map(el => el.textContent?.trim()).filter(Boolean)
      );

      if (errorElements.length > 0) {
        console.log(
          `⚠️  Found error messages on checkout page: ${errorElements.join(', ')}`
        );
      } else {
        console.log(`✅ No error messages found on checkout page`);
      }
    } catch (error) {
      console.error(`❌ Checkout page test failed: ${error.message}`);
      throw error;
    }

    // Test 3: Basic JavaScript functionality
    console.log('🔍 Test 3: Basic JavaScript functionality');
    try {
      const jsWorking = await page.evaluate(() => {
        return (
          typeof window !== 'undefined' &&
          typeof document !== 'undefined' &&
          typeof console !== 'undefined'
        );
      });

      if (!jsWorking) {
        throw new Error('JavaScript is not working properly');
      }

      console.log(`✅ JavaScript is working properly`);
    } catch (error) {
      console.error(`❌ JavaScript test failed: ${error.message}`);
      throw error;
    }

    console.log('🎉 All health checks passed! Site is operational.');
  } catch (error) {
    console.error('❌ Health check failed:', error.message);

    // Take screenshot for debugging
    try {
      const page = await browser.newPage();
      await page.goto(baseUrl, { timeout: 10000 });
      const screenshotPath = `health-check-failure-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved as ${screenshotPath}`);
    } catch (screenshotError) {
      console.error('❌ Failed to take screenshot:', screenshotError.message);
    }

    process.exit(1);
  } finally {
    await browser.close();
  }
})();
