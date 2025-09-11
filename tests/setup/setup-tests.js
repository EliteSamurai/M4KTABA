// tests/setup/setup-tests.js
const React = require("react");
global.React = React; // some compiled JSX expects global React

// helpful matchers
require("@testing-library/jest-dom");

// crypto for libs that expect it
if (!globalThis.crypto) {
  globalThis.crypto = require("crypto").webcrypto;
}
