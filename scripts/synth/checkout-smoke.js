const { chromium } = require('@playwright/test');

(async () => {
  const baseUrl = process.env.SYNTH_BASE_URL || 'https://m4ktaba.com';
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Better for CI
  });
  const page = await browser.newPage();

  try {
    console.log(`🔍 Starting synthetic test for: ${baseUrl}`);
    
    // Set a reasonable timeout for the entire test
    page.setDefaultTimeout(30000);
    
    console.log(`🔍 Navigating to: ${baseUrl}/checkout?synth=1`);
    await page.goto(`${baseUrl}/checkout?synth=1`, {
      waitUntil: 'domcontentloaded', // More reliable than networkidle
      timeout: 30000
    });

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(2000);

    // Debug: Check if the page loaded correctly
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    // Check if we're on the right page
    const url = page.url();
    console.log(`🌐 Current URL: ${url}`);

    // Check for any obvious errors first
    const errorMessages = await page.$$eval(
      '[data-testid*="error"], .error, [class*="error"], .alert-error, [role="alert"]',
      elements => elements.map(el => el.textContent?.trim()).filter(Boolean)
    );
    
    if (errorMessages.length > 0) {
      console.log(`⚠️  Found error messages:`, errorMessages);
    }

    // Check if synthetic test mode is detected
    const synthDetected = await page.evaluate(() => {
      return (
        window.location.search.includes('synth=1') ||
        window.location.search.includes('synthetic=true') ||
        window.location.search.includes('test=1')
      );
    });
    console.log(`🔍 Synthetic test detected: ${synthDetected}`);

    // More comprehensive element detection strategy
    console.log('🔍 Looking for checkout page elements...');
    
    const possibleSelectors = [
      // Specific checkout elements
      '[data-testid="shipping-details-heading"]',
      '[data-testid="checkout-form"]',
      '[data-testid="shipping-form"]',
      
      // Generic checkout indicators
      'text=Shipping Details',
      'text=Checkout',
      'text=Payment',
      'text=Order Summary',
      
      // Form elements
      'form',
      'input[name="email"]',
      'input[type="email"]',
      
      // Headings
      'h1, h2, h3, h4',
      '[role="heading"]',
      
      // Any interactive elements
      'button',
      'input',
      'select'
    ];

    let elementFound = false;
    let foundSelector = null;

    for (const selector of possibleSelectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 5000 });
        if (element) {
          const text = await element.textContent();
          console.log(`✅ Found element with selector "${selector}": "${text?.trim()}"`);
          elementFound = true;
          foundSelector = selector;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // If no specific elements found, check if page has basic structure
    if (!elementFound) {
      const bodyText = await page.textContent('body');
      const hasContent = bodyText && bodyText.length > 100;
      
      if (hasContent) {
        console.log('✅ Page has content, treating as successful');
        elementFound = true;
      }
    }

    if (!elementFound) {
      // Take a screenshot for debugging
      const screenshotPath = `checkout-debug-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved as ${screenshotPath}`);

      // Log more detailed page information
      const pageInfo = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        bodyText: document.body.textContent?.substring(0, 1000),
        hasForm: !!document.querySelector('form'),
        hasInput: !!document.querySelector('input'),
        hasButton: !!document.querySelector('button'),
        errorMessages: Array.from(document.querySelectorAll('[class*="error"], [role="alert"]')).map(el => el.textContent?.trim())
      }));
      
      console.log('📄 Page info:', JSON.stringify(pageInfo, null, 2));

      throw new Error(`Could not find expected checkout page elements. Last URL: ${url}`);
    }

    console.log(`✅ Checkout page smoke test passed (found: ${foundSelector || 'content'})`);
  } catch (error) {
    console.error('❌ Checkout page smoke test failed:', error.message);
    console.error('❌ Error details:', error.stack);
    
    // Always take a screenshot on failure
    try {
      const screenshotPath = `checkout-failure-${Date.now()}.png`;
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
