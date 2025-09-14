import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('a11y checkout', () => {
  test('no serious/critical violations on /checkout', async ({ page }) => {
    await page.goto('http://localhost:3000/checkout');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const seriousOrWorse = accessibilityScanResults.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrWorse).toEqual([]);
  });
});
