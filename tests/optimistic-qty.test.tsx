import React from 'react';
import { render, screen, fireEvent, waitFor } from '@test-utils';
import { CartProvider } from '@/contexts/CartContext';
jest.mock('next/navigation', () => require('./__mocks__/nextNavigationMock'));
const mockToastSpy = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  __esModule: true,
  useToast: () => ({ toast: mockToastSpy }),
}));

describe('Optimistic qty updates', () => {
  beforeEach(() => {
    // Seed localStorage cart with one item
    localStorage.setItem(
      'cart',
      JSON.stringify([{ id: '1', title: 'Test', price: 10, quantity: 2 }])
    );
  });

  afterEach(() => {
    localStorage.clear();
    (global as any).fetch = undefined as any;
  });

  test('UI updates instantly and reverts on 500 with toast', async () => {
    (global as any).fetch = jest.fn(async (url: RequestInfo | URL) => {
      const href = String(url);
      if (href.includes('/api/cart/qty')) {
        return { ok: false, status: 500, text: async () => 'err' } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    const { CartSheet } = require('@/components/CartSheet');
    render(
      <CartProvider>
        <CartSheet />
      </CartProvider>
    );

    // Open the cart
    fireEvent.click(screen.getByRole('button', { name: /open cart/i }));

    // Increase qty optimistically
    const plus = await screen.findByRole('button', {
      name: /increase quantity/i,
    });
    fireEvent.click(plus);

    // UI reflects increment (allow React to commit)
    await waitFor(() => expect(screen.getByText(/×\s*3/i)).toBeInTheDocument());

    // Revert should occur shortly after failed POST
    await waitFor(
      () => expect(screen.getByText(/×\s*2/i)).toBeInTheDocument(),
      { timeout: 1000 }
    );

    // Toast invoked (UI toaster is mocked to no-op)
    expect(mockToastSpy).toHaveBeenCalled();
  });
});
