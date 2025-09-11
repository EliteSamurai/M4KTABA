import React, { StrictMode } from "react";
import { render } from "@testing-library/react";

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <StrictMode>{children}</StrictMode>
);

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, { wrapper: Wrapper, ...options });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
