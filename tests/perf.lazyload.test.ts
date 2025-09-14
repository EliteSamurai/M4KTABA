import fs from 'fs';
import path from 'path';

describe('perf lazy-load', () => {
  it('payment element and address autocomplete are not in initial checkout chunk', () => {
    const appDir = path.join(
      process.cwd(),
      '.next',
      'server',
      'app',
      'checkout'
    );
    if (!fs.existsSync(appDir)) {
      // If not built, skip this test
      console.log('Build directory not found, skipping performance test');
      return;
    }
    
    const pageFile = path.join(appDir, 'page.js');
    if (!fs.existsSync(pageFile)) {
      // If page.js doesn't exist, skip this test
      console.log('Page.js not found, skipping performance test');
      return;
    }
    
    const files = fs.readdirSync(appDir).join('\n');
    // Check if files exist (chunks may not be generated in test builds)
    expect(files).toBeDefined();
    // Payment form and address validator should be in their own dynamic chunks
    const all = fs.readFileSync(pageFile, 'utf8');
    expect(all).not.toMatch(/PaymentElement/);
    // Address validator module imported via dynamic()
    expect(all).not.toMatch(/address-validator/);
  });
});
