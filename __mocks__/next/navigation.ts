// Mock router implementation
const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

// Mock search params implementation
const searchParams = new URLSearchParams();

// Export mock functions
export const useRouter = jest.fn(() => router);
export const useSearchParams = jest.fn(() => searchParams);
export const useParams = jest.fn(() => ({}));
export const usePathname = jest.fn(() => "/");
export const redirect = jest.fn();
export const notFound = jest.fn();

// Helper to set router behavior for tests
export const __setRouter = (overrides: Partial<typeof router>) => {
  useRouter.mockImplementation(() => ({
    ...router,
    ...overrides,
  }));
};

// Helper to set search params for tests
export const __setSearchParams = (params: Record<string, string>) => {
  const newSearchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    newSearchParams.set(key, value);
  });
  useSearchParams.mockImplementation(() => newSearchParams);
};

// Helper to set params for tests
export const __setParams = (params: Record<string, string>) => {
  useParams.mockImplementation(() => params);
};

// Helper to set pathname for tests
export const __setPathname = (pathname: string) => {
  usePathname.mockImplementation(() => pathname);
};
