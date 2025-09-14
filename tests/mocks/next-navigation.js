// CommonJS-friendly Next.js app router mock
const router = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
};

const useRouter = () => router;
const usePathname = () => '/';
const useSearchParams = () => new URLSearchParams();
const redirect = jest.fn();
const notFound = jest.fn();

// expose globally for assertions
// @ts-ignore
globalThis.__router = router;

module.exports = {
  __esModule: true,
  __router: router,
  useRouter,
  usePathname,
  useSearchParams,
  redirect,
  notFound,
};
