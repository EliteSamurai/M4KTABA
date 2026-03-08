// @ts-nocheck
import { chromium } from 'playwright';

(async () => {
  const baseUrl = process.env.SYNTH_BASE_URL || 'https://www.m4ktaba.com';
  const email = process.env.SYNTH_CHECKOUT_EMAIL;
  const password = process.env.SYNTH_CHECKOUT_PASSWORD;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${baseUrl}/checkout`, { waitUntil: 'domcontentloaded' });

    // Unauthenticated behavior should redirect to login with callbackUrl=/checkout
    await page.waitForURL('**/login**', { timeout: 15000 });
    const redirectedUrl = page.url();
    if (!redirectedUrl.includes('callbackUrl=%2Fcheckout')) {
      throw new Error(
        `Expected callbackUrl=/checkout in login redirect, got: ${redirectedUrl}`
      );
    }
    console.log('✅ Guest checkout redirect test passed');

    // Optional authenticated path for full checkout page render validation
    if (email && password) {
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('[data-testid="sign-in-button"]');

      // The login callback should send the user back to checkout
      await page.waitForURL('**/checkout**', { timeout: 20000 });
      await page.waitForSelector('[data-testid="shipping-details-heading"]', {
        timeout: 20000,
      });
      await page.waitForSelector('text=Payment Details', { timeout: 20000 });
      console.log('✅ Authenticated checkout render test passed');
    } else {
      console.log(
        'ℹ️ Skipped authenticated checkout render test. Set SYNTH_CHECKOUT_EMAIL and SYNTH_CHECKOUT_PASSWORD to enable it.'
      );
    }
  } catch (error) {
    console.error('❌ Checkout page smoke test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
