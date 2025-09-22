// Mock next-auth/react before any imports
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 'test-user', _id: 'test-user' } },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getCsrfToken: jest.fn().mockResolvedValue('test-csrf'),
}));

// Mock use-toast
const mockToast = jest.fn();
jest.doMock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: mockToast,
    dismiss: jest.fn(),
    toasts: [],
  })),
  toast: mockToast,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@test-utils';
import '@testing-library/jest-dom';
import UnifiedSellingFlow from '@/components/UnifiedSellingFlow';
import { useToast } from '@/hooks/use-toast';

// Avoid react-hook-form internals causing instanceof errors in JSDOM
jest.mock('react-hook-form', () => {
  const React = require('react');
  const store = {
    values: Object.create(null),
    listeners: new Set(),
  };
  const notify = () =>
    Array.from(store.listeners).forEach(l => {
      try {
        l();
      } catch {}
    });
  return {
    useForm: () => ({
      control: {},
      handleSubmit: (fn: any) => (e?: any) => fn(store.values, e),
      reset: (vals?: any) => {
        if (vals) {
          store.values = { ...store.values, ...vals };
          notify();
        }
      },
      setValue: (name: string, value: any) => {
        store.values[name] = value;
        notify();
      },
      getValues: () => ({ ...store.values }),
      watch: (name?: string) => (name ? store.values[name] : store.values),
      formState: { isValid: true },
    }),
    useFormContext: () => ({
      getFieldState: () => ({}),
      formState: { isValid: true },
      getValues: () => ({ ...store.values }),
      watch: (name?: string) => (name ? store.values[name] : store.values),
      setValue: (name: string, value: any) => {
        store.values[name] = value;
        notify();
      },
    }),
    Controller: ({ name, render }: any) => {
      const [, force] = React.useReducer((c: number) => c + 1, 0);
      React.useEffect(() => {
        const l = () => force();
        store.listeners.add(l);
        return () => store.listeners.delete(l);
      }, []);
      return render({
        field: {
          name,
          value: store.values[name] ?? '',
          onChange: (e: any) => {
            const next = e?.target ? e.target.value : e;
            store.values[name] = next;
            notify();
          },
          onBlur: () => {},
          ref: () => {},
        },
      });
    },
    FormProvider: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { _id: 'u1' } },
    status: 'authenticated',
  })),
}));

jest.mock('heic2any', () => jest.fn());

// Avoid real Sanity writes
jest.mock('@/studio-m4ktaba/client', () => ({
  writeClient: { create: jest.fn(async () => ({ _id: 'b1' })) },
  readClient: { fetch: jest.fn(async () => []) },
}));

// Short-circuit uploads to Sanity
jest.mock('@/utils/uploadImageToSanity', () => ({
  uploadImagesToSanity: jest.fn(async (files: File[]) =>
    files.map((_f, i) => ({ assetId: `asset_${i}` }))
  ),
}));

function createFile(name: string, type: string) {
  return new File(['(⌐□_□)'], name, { type });
}

test('unified selling flow renders correctly and shows basic information section', async () => {
  render(
    <UnifiedSellingFlow
      initialData={{ title: 't', author: 'a', description: 'd' }}
    />
  );

  // Check that the component renders with the basic information section
  expect(screen.getByText('List Your Book')).toBeInTheDocument();
  expect(screen.getByText('Book Information')).toBeInTheDocument();
  expect(
    screen.getByText('Tell us about the book you want to sell')
  ).toBeInTheDocument();

  // Check that form fields are present
  expect(screen.getByLabelText('Book Title *')).toBeInTheDocument();
  expect(screen.getByLabelText('Author *')).toBeInTheDocument();
  expect(screen.getByLabelText('Description *')).toBeInTheDocument();

  // Check that navigation buttons are present
  expect(
    screen.getByRole('button', { name: /save draft/i })
  ).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /next/i })).toHaveLength(2); // There are 2 Next buttons

  // Check that the progress indicator shows section 1 of 4
  expect(screen.getByText('Section 1 of 4')).toBeInTheDocument();
});
