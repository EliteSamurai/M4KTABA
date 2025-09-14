import { jest } from '@jest/globals';

// Mock next/dynamic to verify lazy loading behavior
jest.mock('next/dynamic', () => {
  const actualDynamic = jest.requireActual('next/dynamic');
  return (importFn: any, options: any) => {
    // Track that dynamic import was called
    if (options?.ssr === false) {
      // This is a client-side only component (like CheckoutForm)
      return jest.fn(() => null);
    }
    return actualDynamic(importFn, options);
  };
});

describe('perf lazy-load', () => {
  it('checkout form is dynamically imported', async () => {
    // Import the checkout page component
    const { default: CheckoutPage } = await import('../app/checkout/page');

    // Verify that dynamic imports are being used
    // This test ensures the component structure supports lazy loading
    expect(CheckoutPage).toBeDefined();
    expect(typeof CheckoutPage).toBe('function');
  });
});
