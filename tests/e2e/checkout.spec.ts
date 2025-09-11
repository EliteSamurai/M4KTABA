import { test, expect } from '@playwright/test';

test.describe('Checkout Process', () => {
  test('should load checkout page', async ({ page }) => {
    await page.goto('/checkout');

    // Check if checkout form is visible
    await expect(page.locator('form')).toBeVisible();

    // Check for required fields
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
  });

  test('should validate checkout form', async ({ page }) => {
    await page.goto('/checkout');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check for validation messages
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should handle address validation', async ({ page }) => {
    await page.goto('/checkout');

    // Fill in address fields
    await page.fill('input[name="address"]', '123 Main St');
    await page.fill('input[name="city"]', 'New York');
    await page.fill('input[name="state"]', 'NY');
    await page.fill('input[name="zipCode"]', '10001');

    // Trigger address validation
    await page.blur('input[name="zipCode"]');

    // Check for validation feedback
    await expect(
      page.locator('[data-testid="address-validation"]')
    ).toBeVisible();
  });

  test('should show payment form', async ({ page }) => {
    await page.goto('/checkout');

    // Check for payment method selection
    await expect(page.locator('[data-testid="payment-method"]')).toBeVisible();

    // Check for Stripe elements
    await expect(
      page.locator('[data-testid="stripe-card-element"]')
    ).toBeVisible();
  });
});
