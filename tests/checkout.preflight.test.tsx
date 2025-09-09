import React from "react";
import { render, screen, fireEvent, waitFor } from "@test-utils";
jest.mock("next/dynamic", () => (loaderOrOpts: any) => {
  const React = require("react");
  const call = () => {
    try {
      const res =
        typeof loaderOrOpts === "function"
          ? loaderOrOpts()
          : loaderOrOpts && typeof loaderOrOpts.loader === "function"
          ? loaderOrOpts.loader()
          : null;
      if (res && typeof res.then === "function") {
        return () => React.createElement(React.Fragment, null);
      }
      return res || (() => React.createElement(React.Fragment, null));
    } catch {
      return () => React.createElement(React.Fragment, null);
    }
  };
  return call();
});
jest.mock("next-auth/react", () => {
  const actual = jest.requireActual("next-auth/react");
  return {
    ...actual,
    useSession: jest.fn(() => ({
      data: { user: { _id: "u1", name: "T" } },
      status: "authenticated",
    })),
  };
});
jest.mock("next/navigation", () => require("./__mocks__/nextNavigationMock"));

describe("checkout preflight drift", () => {
  beforeEach(() => {
    // Enable preflight in test
    (process as any).env.ENABLE_PREFLIGHT_REVIEW = "1";
    // Also enable via feature flag storage to be explicit
    localStorage.setItem("flag:preflight_drift", "1");
    // Seed a cart in localStorage and pass via query when navigating
    localStorage.setItem(
      "cart",
      JSON.stringify([{ id: "1", title: "Test Book", price: 10, quantity: 3 }])
    );
  });

  afterEach(() => {
    localStorage.clear();
    (global as any).fetch = undefined as any;
  });

  test("drift → banner → accept → intent created", async () => {
    const seq: Array<string> = [];
    // Provide a non-empty cart via search params
    const navMod = require("next/navigation");
    navMod.useSearchParams = () =>
      new URLSearchParams(
        `cart=${encodeURIComponent(
          JSON.stringify([
            { id: "1", title: "Test Book", price: 10, quantity: 3 },
          ])
        )}`
      );
    (global as any).fetch = jest.fn(async (url: RequestInfo | URL, init?: any) => {
      const href = String(url);
      seq.push(href);
      if (href.includes("/api/validate-address")) {
        return { ok: true, json: async () => ({ isValid: true }) } as any;
      }
      if (href.includes("/api/cart/review")) {
        return {
          ok: true,
          json: async () => ({
            hasDrift: true,
            reviewed: [{ id: "1", title: "Test Book", price: 11, quantity: 2 }],
            changes: [
              { id: "1", title: "Test Book", field: "price", oldValue: 10, newValue: 11 },
              { id: "1", title: "Test Book", field: "quantity", oldValue: 3, newValue: 2 },
            ],
          }),
        } as any;
      }
      if (href.includes("/api/create-payment-intent")) {
        return { ok: true, json: async () => ({ clientSecret: "cs_test" }) } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    const { CheckoutContent } = require("@/app/checkout/page");
    render(<CheckoutContent />);

    // Fill minimal fields
    fireEvent.change(screen.getByLabelText(/full name|name/i), { target: { value: "A" } });
    const street = screen.getByLabelText(/street|address/i);
    fireEvent.change(street, { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^city/i), { target: { value: "C" } });
    fireEvent.change(screen.getByLabelText(/^state/i), { target: { value: "S" } });
    fireEvent.change(screen.getByLabelText(/zip|postal/i), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: "US" } });

    const btn = await screen.findByRole("button", { name: /validate|continue|address/i });
    await waitFor(() => expect(btn).toBeEnabled());
    fireEvent.click(btn);

    // Fill minimal fields
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "A" } });
    fireEvent.change(screen.getByLabelText(/street/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^city/i), { target: { value: "C" } });
    fireEvent.change(screen.getByLabelText(/^state/i), { target: { value: "S" } });
    fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: "US" } });

    const btn2 = await screen.findByRole("button", { name: /validate|continue|address/i });
    fireEvent.click(btn2);

    // Ensure review endpoint called
    await waitFor(() => {
      expect(seq.some((u) => u.includes("/api/cart/review"))).toBe(true);
    });

    // Banner appears (drift summary)
    const bannerTitle = await screen.findByText(/we updated your cart/i);
    expect(bannerTitle).toBeInTheDocument();

    // Accept updates
    fireEvent.click(screen.getByRole("button", { name: /accept updates/i }));

    // Intent is created afterwards
    await waitFor(() => {
      expect(seq.some((u) => u.includes("/api/create-payment-intent"))).toBe(true);
    });
  });
});


