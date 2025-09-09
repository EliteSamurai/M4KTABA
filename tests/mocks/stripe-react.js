// tests/mocks/stripe-react.js
import React from "react";

export const Elements = ({ children }) => (
  <div data-testid="mock-elements">{children}</div>
);

export const useStripe = () => ({
  confirmPayment: jest.fn().mockResolvedValue({}),
});

export const useElements = () => ({
  getElement: jest.fn(),
});

export default Elements;
