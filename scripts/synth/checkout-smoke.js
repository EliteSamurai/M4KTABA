const { chromium } = require('@playwright/test');

(async () => {
  const baseUrl = process.env.SYNTH_BASE_URL || 'https://m4ktaba.com';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`🔍 Navigating to: ${baseUrl}/checkout?synth=1`);
    await page.goto(`${baseUrl}/checkout?synth=1`, {
      waitUntil: 'networkidle',
    });

    // Debug: Check if the page loaded correctly
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    // Check if we're on the right page
    const url = page.url();
    console.log(`🌐 Current URL: ${url}`);

    // Check if page has any error messages
    const errorElements = await page.$$(
      '[data-testid*="error"], .error, [class*="error"]'
    );
    if (errorElements.length > 0) {
      console.log(`⚠️  Found ${errorElements.length} error elements on page`);
    }

    // Check if synthetic test mode is detected
    const synthDetected = await page.evaluate(() => {
      return (
        window.location.search.includes('synth=1') ||
        window.location.search.includes('synthetic=true')
      );
    });
    console.log(`🔍 Synthetic test detected: ${synthDetected}`);

    // Try to find the element with multiple strategies
    console.log('🔍 Looking for shipping-details-heading element...');
    let elementFound = false;

    try {
      await page.waitForSelector('[data-testid="shipping-details-heading"]', {
        timeout: 15000,
      });
      console.log('✅ Found shipping-details-heading by data-testid');
      elementFound = true;
    } catch (e) {
      console.log('⚠️  data-testid not found, trying text content...');
      try {
        await page.waitForSelector('text=Shipping Details', {
          timeout: 10000,
        });
        console.log('✅ Found Shipping Details by text content');
        elementFound = true;
      } catch (e2) {
        console.log(
          '⚠️  Text content not found, trying alternative selectors...'
        );
        try {
          await page.waitForSelector('h2, h3, [role="heading"]', {
            timeout: 5000,
          });
          console.log('✅ Found heading element');
          elementFound = true;
        } catch (e3) {
          console.log('❌ No heading elements found');
        }
      }
    }

    if (!elementFound) {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'checkout-debug.png' });
      console.log('📸 Screenshot saved as checkout-debug.png');

      // Log page content for debugging
      const pageContent = await page.textContent('body');
      console.log('📄 Page content preview:', pageContent?.substring(0, 500));

      throw new Error('Could not find shipping details heading element');
    }

    console.log('✅ Checkout page smoke test passed');
  } catch (error) {
    console.error('❌ Checkout page smoke test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
