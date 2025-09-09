import React from "react";
import { render, screen, fireEvent, waitFor } from "@test-utils";
jest.mock("next/navigation", () => require("./__mocks__/nextNavigationMock"));
// Avoid react-hook-form internals for this DOM-focused test
jest.mock("react-hook-form", () => {
  const React = require("react");
  const store = {
    values: {
      name: "",
      street1: "",
      street2: "",
      city: "",
      zip: "",
      state: "",
      country: "",
    },
    listeners: new Set(),
  };

  function notify() {
    for (const l of Array.from(store.listeners)) {
      try {
        l();
      } catch {}
    }
  }

  return {
    useForm: () => ({
      control: {},
      handleSubmit: (fn) => fn,
      reset: (vals) => {
        if (vals && typeof vals === "object") {
          store.values = { ...store.values, ...vals };
          notify();
        }
      },
      setValue: (name, value) => {
        store.values[name] = value;
        notify();
      },
      getValues: () => ({ ...store.values }),
      formState: { isValid: true },
    }),
    useWatch: ({ name }) => store.values[name] ?? "",
    useFormContext: () => ({
      getFieldState: () => ({}),
      formState: {},
      getValues: () => ({ ...store.values }),
      setValue: (name, value) => {
        store.values[name] = value;
        notify();
      },
    }),
    Controller: ({ name, render }) => {
      const [, force] = React.useReducer((c) => c + 1, 0);
      React.useEffect(() => {
        const l = () => force();
        store.listeners.add(l);
        return () => store.listeners.delete(l);
      }, []);
      return render({
        field: {
          name,
          value: store.values[name] ?? "",
          onChange: (e) => {
            const next = e && e.target ? e.target.value : e;
            store.values[name] = next;
            notify();
          },
          onBlur: () => {},
          ref: () => {},
        },
      });
    },
    FormProvider: ({ children }) =>
      React.createElement(React.Fragment, null, children),
  };
});
// Make suggestions deterministic and immediate for this test
jest.mock("@/lib/addressAutocomplete", () => {
  const actual = jest.requireActual("@/lib/addressAutocomplete");
  return {
    ...actual,
    fetchAddressSuggestions: jest.fn(async (q) => [
      { id: `s-${q}-1`, text: `${q} Street` },
      { id: `s-${q}-2`, text: `${q} Avenue` },
    ]),
  };
});

describe("address autocomplete (flag)", () => {
  beforeEach(() => {
    localStorage.setItem("flag:address_autocomplete", "1");
    const nav = require("next/navigation");
    nav.useSearchParams = () =>
      new URLSearchParams(
        `cart=${encodeURIComponent(
          JSON.stringify([{ id: "1", title: "T", price: 1, quantity: 1 }])
        )}`
      );
  });
  afterEach(() => localStorage.clear());

  test("typing shows suggestions and applying fills street1", async () => {
    const { CheckoutContent } = require("@/app/checkout/page");
    const { container } = render(<CheckoutContent />);
    const street = (await waitFor(() =>
      container.querySelector('input[data-autocomplete="1"]')
    )) as HTMLInputElement;
    fireEvent.change(street, { target: { value: "123" } });
    const sugg = await screen.findByRole("button", { name: /123 street/i });
    fireEvent.click(sugg);
    await waitFor(() =>
      expect((street as HTMLInputElement).value).toMatch(/123/i)
    );
  });
});
