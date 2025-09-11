// tests/setup/after-env.js
// Extra matchers
require("@testing-library/jest-dom");

// Keep this file minimal; global polyfills are loaded in tests/setup/global-polyfills.js

// Note: Mocks are provided via moduleNameMapper in jest.config.js

// Ensure `jest` is available as a global in ESM mode
(async () => {
  try {
    const { jest: jestGlobals } = await import("@jest/globals");
    globalThis.jest = jestGlobals;
  } catch {}
})();
