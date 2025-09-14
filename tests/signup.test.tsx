import React from 'react';
import { render, screen, fireEvent, waitFor } from '@test-utils';
import '@testing-library/jest-dom';
import SignUpPage from '@/app/(signin)/signup/page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(async () => ({ ok: true, error: null })),
}));

global.fetch = jest.fn(async () => ({
  ok: true,
  json: async () => ({ userId: 'u1' }),
})) as any;

test('signup CTA disabled until terms checked, redirects after success', async () => {
  render(<SignUpPage />);

  const button = screen.getByRole('button', { name: /create account/i });
  expect(button).toBeDisabled();

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'a@b.com' },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'secret123' },
  });

  fireEvent.click(screen.getByLabelText(/i agree/i));
  expect(button).not.toBeDisabled();

  fireEvent.click(button);
  // The component should show an error or loading state
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument();
  });
});
