/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { url: 'http://localhost/' },
  setupFiles: [
    '<rootDir>/tests/setup/global-polyfills.js',
    '<rootDir>/tests/setup/preload-mocks.js',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/after-env.js',
    '<rootDir>/tests/setup/setup-tests.js',
  ],
  testTimeout: 20000,

  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(png|jpe?g|gif|webp|avif)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '\\.svg$': '<rootDir>/tests/__mocks__/svgMock.js',
    '^next/image$': '<rootDir>/tests/__mocks__/nextImageMock.js',
    '^next/navigation$': '<rootDir>/tests/mocks/next-navigation.js',
    '^next/headers$': '<rootDir>/tests/mocks/next-headers.js',
    '^@test-utils$': '<rootDir>/tests/helpers/test-utils.tsx',
    '^next-auth-mock$': '<rootDir>/tests/helpers/next-auth-mock',
    '^tests/helpers/next-auth-mock$': '<rootDir>/tests/helpers/next-auth-mock',
    '^@/tests/helpers/next-auth-mock$':
      '<rootDir>/tests/helpers/next-auth-mock',
    '^@tests/helpers/next-auth-mock$': '<rootDir>/tests/helpers/next-auth-mock',
    '^@/components/ui/use-toast$': '<rootDir>/tests/__mocks__/useToastMock.js',
    '^@/hooks/use-toast$': '<rootDir>/tests/__mocks__/useToastMock.js',
    // Specific mocks must come before the generic alias
    '^@/lib/stripe$': '<rootDir>/tests/mocks/stripe-server.js',
    '^lib/stripe$': '<rootDir>/tests/mocks/stripe-server.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^@radix-ui/react-toast$': '<rootDir>/tests/mocks/radix-toast.js',
    '^@stripe/react-stripe-js$': '<rootDir>/tests/mocks/stripe-react.js',
    '^@stripe/stripe-js$': '<rootDir>/tests/mocks/stripe-js.js',
    '^lib/stripe$': '<rootDir>/tests/mocks/stripe-server.js',
    '^next-auth/react$': '<rootDir>/tests/mocks/next-auth-react.js',
    '^tests/(.*)$': '<rootDir>/tests/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  modulePathIgnorePatterns: ['<rootDir>/studio-m4ktaba/'],

  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest'],
  },
  transformIgnorePatterns: ['/node_modules/'],
  // Skip Playwright a11y test in Jest
  testPathIgnorePatterns: [
    '<rootDir>/tests/a11y\\.checkout\\.axe\\.test\\.ts$',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/global-setup.ts',
    '<rootDir>/tests/global-teardown.ts',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/jest.setup.js',
    '!**/next.config.js',
    '!**/tailwind.config.js',
    '!**/postcss.config.js',
    '!**/playwright.config.ts',
    '!**/lighthouserc.json',
    '!**/.prettierrc',
    '!**/.prettierignore',
    '!**/.lintstagedrc.js',
    '!**/.github/**',
    '!**/tests/**',
    '!**/scripts/**',
    '!**/studio-m4ktaba/**',
  ],

  coverageThreshold: {
    global: {
      branches: 1,
      functions: 1,
      lines: 1,
      statements: 1,
    },
  },

  // Test configuration
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/unit/**/*.{js,jsx,ts,tsx}',
  ],

  // Verbose output
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
};
