const { chromium } = require('@playwright/test');

(async () => {
  const baseUrl = process.env.SYNTH_BASE_URL || 'https://m4ktaba.com';
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    console.log(`🔍 Starting health check for: ${baseUrl}`);
    
    // Set timeouts
    page.setDefaultTimeout(20000);
    
    // Test multiple pages to ensure site is healthy
    const testPages = [
      { path: '/', name: 'Homepage' },
      { path: '/checkout', name: 'Checkout' },
      { path: '/billing', name: 'Billing' }
    ];

    let successfulTests = 0;
    const results = [];

    for (const testPage of testPages) {
      try {
        console.log(`🔍 Testing ${testPage.name}: ${baseUrl}${testPage.path}`);
        
        await page.goto(`${baseUrl}${testPage.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });

        // Wait for basic content
        await page.waitForTimeout(1000);

        // Check if page loaded successfully
        const title = await page.title();
        const url = page.url();
        
        // Look for any obvious errors
        const hasErrors = await page.$$eval(
          '[class*="error"], [role="alert"], .alert-error',
          elements => elements.length > 0
        );

        // Check for basic page structure
        const hasContent = await page.evaluate(() => {
          const bodyText = document.body.textContent;
          return bodyText && bodyText.length > 50;
        });

        const result = {
          page: testPage.name,
          success: !hasErrors && hasContent,
          title,
          url,
          hasErrors,
          hasContent
        };

        results.push(result);
        
        if (result.success) {
          console.log(`✅ ${testPage.name}: OK`);
          successfulTests++;
        } else {
          console.log(`⚠️  ${testPage.name}: Issues detected (errors: ${hasErrors}, content: ${hasContent})`);
        }

      } catch (error) {
        console.log(`❌ ${testPage.name}: Failed - ${error.message}`);
        results.push({
          page: testPage.name,
          success: false,
          error: error.message
        });
      }
    }

    // Overall assessment
    const successRate = (successfulTests / testPages.length) * 100;
    console.log(`📊 Health check results: ${successfulTests}/${testPages.length} pages passed (${successRate.toFixed(1)}%)`);

    // Detailed results
    console.log('📋 Detailed results:');
    results.forEach(result => {
      console.log(`  ${result.success ? '✅' : '❌'} ${result.page}: ${result.success ? 'OK' : result.error || 'Issues detected'}`);
    });

    // Consider the test successful if at least 50% of pages are working
    if (successRate >= 50) {
      console.log('✅ Health check passed - site is operational');
    } else {
      throw new Error(`Health check failed - only ${successRate.toFixed(1)}% of pages are working`);
    }

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    
    // Take screenshot on failure
    try {
      const screenshotPath = `health-check-failure-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Failure screenshot saved as ${screenshotPath}`);
    } catch (screenshotError) {
      console.error('❌ Failed to take screenshot:', screenshotError.message);
    }
    
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
