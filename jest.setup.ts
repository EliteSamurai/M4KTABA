import '@testing-library/jest-dom';

// Mock next-auth
const mockSession = {
  user: {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
  },
};

const mockUnauthenticatedSession = {
  data: null,
  status: 'unauthenticated',
};

const mockAuthenticatedSession = {
  data: mockSession,
  status: 'authenticated',
};

jest.mock('next-auth/react', () => {
  let session: unknown = mockUnauthenticatedSession;

  return {
    useSession: jest.fn(() => session),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(() => Promise.resolve((session as any).data)),
    setSession: ({
      authenticated = false,
      user = mockSession.user,
    }: {
      authenticated?: boolean;
      user?: unknown;
    }) => {
      session = authenticated
        ? { data: { user }, status: 'authenticated' }
        : mockUnauthenticatedSession;
    },
  };
});

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock useCart hook
jest.mock('@/contexts/CartContext', () => ({
  ...jest.requireActual('@/contexts/CartContext'),
  useCart: jest.fn(() => ({
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    cart: [],
    totalPrice: 0,
  })),
}));

// Mock heic2any
jest.mock('heic2any', () => jest.fn());

// Helper to set session state for tests
export const __setSession = (isAuthenticated: boolean) => {
  const session = isAuthenticated
    ? mockAuthenticatedSession
    : mockUnauthenticatedSession;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useSession } = require('next-auth/react');
  useSession.mockImplementation(() => session);
};
