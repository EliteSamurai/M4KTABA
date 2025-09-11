import React from "react";
import { render, screen, fireEvent } from "@test-utils";
// Mock react-hook-form to avoid instanceof issues in test env
jest.mock("react-hook-form", () => {
  const React = require("react");
  const store = { values: {}, listeners: new Set() };
  const notify = () => Array.from(store.listeners).forEach((l) => l());
  return {
    useForm: () => ({
      control: {},
      handleSubmit: (fn) => (e?: any) => fn(store.values, e),
      reset: (vals?: any) => { if (vals && typeof vals === "object") { store.values = { ...store.values, ...vals }; notify(); } },
      setValue: (n: string, v: any) => { store.values[n] = v; notify(); },
      getValues: () => ({ ...store.values }),
      formState: { isValid: true },
    }),
    useWatch: ({ name }: any) => store.values[name] ?? "",
    useFormContext: () => ({ getFieldState: () => ({}), formState: {} }),
    Controller: ({ name, render }: any) => {
      const [, force] = React.useReducer((c: number) => c + 1, 0);
      React.useEffect(() => { const l = () => force(); store.listeners.add(l); return () => store.listeners.delete(l); }, []);
      return render({ field: { name, value: store.values[name] ?? "", onChange: (e: any) => { store.values[name] = e?.target ? e.target.value : e; notify(); }, onBlur: () => {}, ref: () => {} } });
    },
    FormProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});
jest.mock("next/navigation", () => require("./__mocks__/nextNavigationMock"));

describe("a11y: field errors link via aria-describedby", () => {
  test("zip shows error and is linked", async () => {
    // Provide a cart so the form renders
    const navMod = require("next/navigation");
    navMod.useSearchParams = () =>
      new URLSearchParams(
        `cart=${encodeURIComponent(
          JSON.stringify([{ id: "1", title: "T", price: 1, quantity: 1 }])
        )}`
      );

    const { CheckoutContent } = require("@/app/checkout/page");
    const { container } = render(<CheckoutContent />);

    // Leave ZIP empty and attempt submit to force validation error
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "A" } });
    fireEvent.change(screen.getByLabelText(/street/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^city/i), { target: { value: "C" } });
    fireEvent.change(screen.getByLabelText(/^state/i), { target: { value: "S" } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: "US" } });

    // Touch ZIP field to trigger validation error display
    const zipInput = screen.getByLabelText(/zip|postal/i);
    fireEvent.focus(zipInput);
    fireEvent.blur(zipInput);
    // Also submit the form to ensure errors surface
    const btn = await screen.findByRole("button", { name: /validate|continue/i });
    fireEvent.click(btn);

    const error = await screen.findByRole("alert");
    expect(error).toBeInTheDocument();

    const zip = screen.getByLabelText(/zip|postal/i);
    const describedby = zip.getAttribute("aria-describedby");
    expect(describedby).toBeTruthy();
  });
});


