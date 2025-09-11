const push = jest.fn();
const replace = jest.fn();
const refresh = jest.fn();
const prefetch = jest.fn();
const back = jest.fn();
const forward = jest.fn();

const router = { push, replace, refresh, prefetch, back, forward };

const useRouter = () => router;
const usePathname = () => '/';
const useSearchParams = () => new URLSearchParams();

module.exports = {
  __esModule: true,
  __router: router,
  useRouter,
  usePathname,
  useSearchParams,
  redirect: jest.fn(),
};
