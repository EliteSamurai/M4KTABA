// tests/mocks/stripe-react.js
const React = require('react');

const Elements = ({ children }) =>
  React.createElement('div', { 'data-testid': 'mock-elements' }, children);

const useStripe = () => ({
  confirmPayment: jest.fn().mockResolvedValue({}),
});

const useElements = () => ({
  getElement: jest.fn(),
});

module.exports = { Elements, useStripe, useElements };
module.exports.Elements = Elements;
module.exports.useStripe = useStripe;
module.exports.useElements = useElements;
module.exports.default = Elements;
