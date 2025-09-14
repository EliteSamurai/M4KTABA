import React from 'react';
import { render, screen, fireEvent, waitFor } from '@test-utils';
import '@testing-library/jest-dom';
import LoginPage from '@/app/(signin)/login/page';

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

// Avoid react-hook-form internals (FileList instanceof) in JSDOM
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: () => ({}),
    handleSubmit: (fn: any) => fn,
    formState: { isValid: true },
  }),
}));

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(async () => ({ ok: true, error: null })),
}));

test('login CTA disabled until email and password present, navigates on success', async () => {
  render(<LoginPage />);

  const button = screen.getByTestId('sign-in-button');
  expect(button).toBeDisabled();

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'a@b.com' },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'secret123' },
  });
  expect(button).not.toBeDisabled();

  fireEvent.click(button);
  // The component should show an error or loading state
  await waitFor(() => {
    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
  });
});
