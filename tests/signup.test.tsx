import React from "react";
import { render, screen, fireEvent, waitFor } from "@test-utils";
import "@testing-library/jest-dom";
import SignUpPage from "@/app/(signin)/signup/page";
const router = ((): any => {
  try {
    const mod: any = require("next/navigation");
    return typeof mod?.useRouter === "function"
      ? mod.useRouter()
      : (globalThis as any).__router;
  } catch {
    return (globalThis as any).__router;
  }
})();

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(async () => ({ ok: true })),
}));

global.fetch = jest.fn(async () => ({
  ok: true,
  json: async () => ({ userId: "u1" }),
})) as any;

test("signup CTA disabled until terms checked, redirects after success", async () => {
  render(<SignUpPage />);

  const button = screen.getByRole("button", { name: /create account/i });
  expect(button).toBeDisabled();

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "a@b.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "secret123" },
  });

  fireEvent.click(screen.getByLabelText(/i agree/i));
  expect(button).not.toBeDisabled();

  fireEvent.click(button);
  await waitFor(() => expect(router.push).toHaveBeenCalled());
});
