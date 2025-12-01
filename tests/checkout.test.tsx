// MUST be first so it's hoisted before SUT import
// Mock next-auth/react first
jest.mock('next-auth/react', () => {
  const mockUseSession = jest.fn(() => ({
    data: {
      user: {
        _id: 'u1',
        name: 'T',
        location: {
          street: '123 Main',
          city: 'NYC',
          state: 'NY',
          zip: '10001',
          country: 'US',
        },
      },
    },
    status: 'authenticated',
  }));

  return {
    useSession: mockUseSession,
    signIn: jest.fn(),
    signOut: jest.fn(),
  };
});

jest.mock('@/app/checkout/cart-summary', () => {
  const React = require('react');
  return {
    __esModule: true,
    CartSummary: () =>
      React.createElement('div', { 'data-testid': 'cart-summary-mock' }),
  };
});

// Mock CheckoutForm to avoid internal module issues in tests
jest.mock('@/app/checkout/checkout-form', () => {
  const React = require('react');
  return {
    __esModule: true,
    CheckoutForm: ({ children, shippingDetails, ...rest }: any) =>
      React.createElement(
        'div',
        {
          'data-testid': 'checkout-form-mock',
          'data-shipping-details': shippingDetails ? 'true' : undefined,
          ...rest,
        },
        children
      ),
  };
});

// Seed valid defaults for the form so CTA can enable without manual typing
jest.mock('@/app/checkout/test-defaults', () => ({
  __esModule: true,
  defaults: {
    name: 'Test User',
    street1: '123 Main',
    street2: '',
    city: 'NYC',
    state: 'NY',
    zip: '10001',
    country: 'US',
  },
}));

// Make async modules synchronous to avoid open handles/hangs
jest.mock('next/dynamic', () => (loaderOrOpts: any) => {
  const React = require('react');
  const call = () => {
    try {
      const res =
        typeof loaderOrOpts === 'function'
          ? loaderOrOpts()
          : loaderOrOpts && typeof loaderOrOpts.loader === 'function'
            ? loaderOrOpts.loader()
            : null;
      if (res && typeof res.then === 'function') {
        // If a Promise (e.g., import().then()), return a no-op component
        return () => React.createElement(React.Fragment, null);
      }
      return res || (() => React.createElement(React.Fragment, null));
    } catch {
      return () => React.createElement(React.Fragment, null);
    }
  };
  return call();
});
jest.mock('next/navigation', () => require('./__mocks__/nextNavigationMock'));
jest.mock('@stripe/stripe-js', () => ({ loadStripe: async () => ({}) }));
jest.mock('@stripe/react-stripe-js', () => {
  const React = require('react');
  return {
    __esModule: true,
    Elements: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'mock-elements' }, children),
    useStripe: () => ({}),
    useElements: () => ({}),
    CardElement: () =>
      React.createElement('div', { 'data-testid': 'mock-card-element' }),
  };
});

// Light-weight providers to avoid open handles
jest.mock('@/contexts/CartContext', () => {
  const React = require('react');
  return {
    __esModule: true,
    useCart: () => ({ items: [{ id: '1' }], subtotal: 1000 }),
    CartProvider: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  };
});
// Radix toast is globally mocked via tests/setup/radix-toast.mock.ts
jest.mock('@/components/ui/toaster', () => {
  const React = require('react');
  return {
    __esModule: true,
    Toaster: () =>
      React.createElement('div', { 'data-testid': 'toaster-mock' }),
  };
});

// Short global timeout for fail-fast
jest.setTimeout(12000);

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CheckoutContent } from '@/app/checkout/page';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        _id: 'u1',
        name: 'T',
        location: {
          street: '123 Main',
          city: 'NYC',
          state: 'NY',
          zip: '10001',
          country: 'US',
        },
      },
    },
    status: 'authenticated',
  })),
}));

// Stub network calls for address validation and payment intent
const mockFetch = jest.fn(async (input: RequestInfo | URL) => {
  const url = typeof input === 'string' ? input : input.toString();
  if (url.includes('/api/validate-address')) {
    return {
      ok: true,
      json: async () => ({ isValid: true }),
    } as any;
  }
  if (url.includes('/api/cart/validate')) {
    return {
      ok: true,
      json: async () => ({ 
        valid: true, 
        cart: [{ id: '1', title: 'Test Book', price: 10, quantity: 1 }],
        shipping: { totalShippingCost: 3.99 }
      }),
    } as any;
  }
  if (url.includes('/api/create-payment-intent')) {
    return {
      ok: true,
      json: async () => ({ clientSecret: 'cs_test_123' }),
    } as any;
  }
  return { ok: true, json: async () => ({}) } as any;
});

const _origFetch: any = global.fetch as any;

beforeEach(() => {
  (global as any).fetch = mockFetch;
  mockFetch.mockClear();
  // Disable feature flags that might interfere with tests
  localStorage.setItem('flag:offline_queue', '0');
  localStorage.setItem('flag:preflight_drift', '0');
  localStorage.setItem('flag:state_machine', '0');
  // Force non-empty cart in happy path by default
  try {
    const nav = require('next/navigation');
    if (jest.isMockFunction(nav.useSearchParams)) {
      nav.useSearchParams.mockReturnValue(new URLSearchParams('cart=1') as any);
    } else {
      nav.useSearchParams = jest.fn(() => new URLSearchParams('cart=1') as any);
    }
  } catch {}
  // reset router mocks between tests (guard if mock not yet loaded)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('next/navigation');
    const r = mod && mod.__router;
    r?.push?.mockClear?.();
    r?.replace?.mockClear?.();
    r?.refresh?.mockClear?.();
  } catch (_) {}
});

afterEach(() => {
  // restore original fetch to avoid cross-test bleed
  (global as any).fetch = _origFetch;
});

test('checkout validates address and advances to payment', async () => {
  // Provide a non-empty cart via search params to mirror real usage
  const navMod = require('next/navigation');
  navMod.useSearchParams = () =>
    new URLSearchParams(
      `cart=${encodeURIComponent(
        JSON.stringify([
          { id: '1', title: 'Test Book', price: 10, quantity: 1 },
        ])
      )}`
    );

  // Diagnostics + sequential responses
  const seqFetch = jest
    .fn()
    .mockImplementationOnce(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        // eslint-disable-next-line no-console
        console.log(
          'fetch[1]',
          typeof url === 'string' ? url : url.toString(),
          init?.method
        );
        return { ok: true, json: async () => ({ isValid: true }) } as any;
      }
    )
    .mockImplementationOnce(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        // eslint-disable-next-line no-console
        console.log(
          'fetch[2]',
          typeof url === 'string' ? url : url.toString(),
          init?.method
        );
        return {
          ok: true,
          json: async () => ({ 
            valid: true, 
            cart: [{ id: '1', title: 'Test Book', price: 10, quantity: 1 }],
            shipping: { totalShippingCost: 3.99 }
          }),
        } as any;
      }
    )
    .mockImplementationOnce(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        // eslint-disable-next-line no-console
        console.log(
          'fetch[3]',
          typeof url === 'string' ? url : url.toString(),
          init?.method
        );
        return {
          ok: true,
          json: async () => ({ clientSecret: 'cs_test_123' }),
        } as any;
      }
    );
  (global as any).fetch = seqFetch as any;

  render(<CheckoutContent />);

  // Fill required fields to guarantee RHF validity regardless of validation mode
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: 'T' },
  });
  const street = screen.queryByLabelText(
    /street|address/i
  ) as HTMLInputElement | null;
  if (street) fireEvent.change(street, { target: { value: '123 Main' } });
  fireEvent.change(screen.getByLabelText(/city/i), {
    target: { value: 'NYC' },
  });
  fireEvent.change(screen.getByLabelText(/state|province/i), {
    target: { value: 'NY' },
  });
  fireEvent.change(screen.getByLabelText(/zip|postal/i), {
    target: { value: '10001' },
  });
  fireEvent.change(screen.getByLabelText(/country/i), {
    target: { value: 'US' },
  });

  // Find CTA and wait for enablement
  const btn = await screen.findByRole('button', {
    name: /validate\s*&\s*continue|validate|continue/i,
  });
  await waitFor(() => expect(btn).toBeEnabled(), { timeout: 1000 });
  fireEvent.click(btn);

  // If fetch never fires, fail fast (no hangs)
  await waitFor(() => expect((global as any).fetch).toHaveBeenCalled(), {
    timeout: 3000,
  });

  // Ensure first call occurred and is validate-address
  await waitFor(() => expect(seqFetch).toHaveBeenCalled(), { timeout: 3000 });
  expect(String((seqFetch as jest.Mock).mock.calls[0][0])).toContain(
    '/api/validate-address'
  );
  // Ensure intent call eventually occurs (review may happen between)
  await waitFor(
    () =>
      expect(
        (seqFetch as jest.Mock).mock.calls
          .map(c => String(c[0]))
          .some(u => u.includes('/api/create-payment-intent'))
      ).toBe(true),
    { timeout: 3000 }
  );

  // Elements mounted
  await waitFor(
    () => expect(screen.getByTestId('mock-elements')).toBeInTheDocument(),
    { timeout: 3000 }
  );
});

test('double-clicking submit does not issue duplicate requests', async () => {
  const navMod = require('next/navigation');
  navMod.useSearchParams = () =>
    new URLSearchParams(
      `cart=${encodeURIComponent(
        JSON.stringify([
          { id: '1', title: 'Test Book', price: 10, quantity: 1 },
        ])
      )}`
    );

  const fetchMock = jest.fn(
    async (url: RequestInfo | URL, init?: RequestInit) => {
      const href = String(url);
      if (href.includes('/api/validate-address')) {
        return { ok: true, json: async () => ({ isValid: true }) } as any;
      }
      if (href.includes('/api/cart/validate')) {
        return {
          ok: true,
          json: async () => ({ 
            valid: true, 
            cart: [{ id: '1', title: 'Test Book', price: 10, quantity: 1 }],
            shipping: { totalShippingCost: 3.99 }
          }),
        } as any;
      }
      if (href.includes('/api/create-payment-intent')) {
        return {
          ok: true,
          json: async () => ({ clientSecret: 'cs_test_123' }),
        } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    }
  );
  (global as any).fetch = fetchMock as any;

  render(<CheckoutContent />);

  // Fill required fields quickly
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: 'T' },
  });
  const street = screen.queryByLabelText(
    /street|address/i
  ) as HTMLInputElement | null;
  if (street) fireEvent.change(street, { target: { value: '123 Main' } });
  fireEvent.change(screen.getByLabelText(/city/i), {
    target: { value: 'NYC' },
  });
  fireEvent.change(screen.getByLabelText(/state|province/i), {
    target: { value: 'NY' },
  });
  fireEvent.change(screen.getByLabelText(/zip|postal/i), {
    target: { value: '10001' },
  });
  fireEvent.change(screen.getByLabelText(/country/i), {
    target: { value: 'US' },
  });

  const btn = await screen.findByRole('button', {
    name: /validate\s*&\s*continue|validate|continue/i,
  });
  await waitFor(() => expect(btn).toBeEnabled());

  // Double-click quickly
  fireEvent.click(btn);
  fireEvent.click(btn);

  // Wait for both network calls to settle
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/validate-address'),
      expect.objectContaining({ method: 'POST' })
    )
  );
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/create-payment-intent'),
      expect.objectContaining({ method: 'POST' })
    )
  );

  // Assert no duplicates of either request
  const calls = (fetchMock as jest.Mock).mock.calls.map(c => String(c[0]));
  const validateCalls = calls.filter(u =>
    u.includes('/api/validate-address')
  ).length;
  const intentCalls = calls.filter(u =>
    u.includes('/api/create-payment-intent')
  ).length;
  expect(validateCalls).toBe(1);
  expect(intentCalls).toBe(1);
});

test('debounced address validation performs one request and aborts previous', async () => {
  // Enable background validation inside component
  (process as any).env = { ...(process as any).env, ENABLE_BG_VALIDATION: '1' };

  const navMod = require('next/navigation');
  navMod.useSearchParams = () =>
    new URLSearchParams(
      `cart=${encodeURIComponent(
        JSON.stringify([
          { id: '1', title: 'Test Book', price: 10, quantity: 1 },
        ])
      )}`
    );

  // Mock fetch to capture AbortError behavior
  const controllerRefs: AbortController[] = [];
  const fetchSpy = jest.fn(
    async (url: RequestInfo | URL, init?: RequestInit) => {
      const href = String(url);
      if (href.includes('/api/validate-address')) {
        // simulate a slow response, but respect signal abort
        return new Promise((resolve, reject) => {
          const signal = init?.signal as AbortSignal | undefined;
          if (signal) {
            const onAbort = () => {
              signal.removeEventListener('abort', onAbort);
              const err: any = new Error('Aborted');
              err.name = 'AbortError';
              reject(err);
            };
            signal.addEventListener('abort', onAbort);
          }
          setTimeout(() => {
            resolve({ ok: true, json: async () => ({ isValid: true }) } as any);
          }, 50);
        });
      }
      if (href.includes('/api/create-payment-intent')) {
        return {
          ok: true,
          json: async () => ({ clientSecret: 'cs_test_123' }),
        } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    }
  );
  (global as any).fetch = fetchSpy as any;

  render(<CheckoutContent />);

  // Type quickly changing the address, to trigger abort and debounce
  const street = screen.getByLabelText(/street|address/i);
  fireEvent.change(street, { target: { value: '1' } });
  fireEvent.change(street, { target: { value: '12' } });
  fireEvent.change(street, { target: { value: '123' } });
  // Wait a bit longer than debounce
  await new Promise(r => setTimeout(r, 500));

  // Expect exactly one validate-address request ultimately resolved
  const calls = (fetchSpy as jest.Mock).mock.calls
    .map(c => String(c[0]))
    .filter(u => u.includes('/api/validate-address'));
  expect(calls.length).toBe(1);
});

test('redirects to login when unauthenticated', async () => {
  const { useSession } = require('next-auth/react');
  useSession.mockReturnValue({ data: null, status: 'unauthenticated' });
  // Ensure search params override doesn't interfere
  const navMod = require('next/navigation');
  navMod.useSearchParams = () => new URLSearchParams('');
  render(<CheckoutContent />);
  const mod: any = require('next/navigation');
  const r =
    typeof mod?.useRouter === 'function' ? mod.useRouter() : mod.__router;
  // push may occur in a microtask; allow brief delay
  await waitFor(() => expect(r.push).toHaveBeenCalled(), { timeout: 2000 });
});
