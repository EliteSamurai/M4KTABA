// Mock next-auth
const mockSession = {
  user: {
    id: "user123",
    email: "test@example.com",
    name: "Test User",
  },
};

export const mockUnauthenticatedSession = {
  data: null,
  status: "unauthenticated",
};

export const mockAuthenticatedSession = {
  data: mockSession,
  status: "authenticated",
};

export const mockNextAuth = (isAuthenticated = false) => {
  const session = isAuthenticated
    ? mockAuthenticatedSession
    : mockUnauthenticatedSession;
  return {
    useSession: jest.fn(() => session),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(() => Promise.resolve(session.data)),
  };
};
