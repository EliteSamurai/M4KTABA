import React from "react";
import { render, screen, fireEvent, waitFor } from "@test-utils";
import "@testing-library/jest-dom";
import LoginPage from "@/app/(signin)/login/page";
// Grab the mocked router instance
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

// Avoid react-hook-form internals (FileList instanceof) in JSDOM
jest.mock("react-hook-form", () => ({
  useForm: () => ({
    register: () => ({}),
    handleSubmit: (fn: any) => fn,
    formState: { isValid: true },
  }),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(async () => ({ ok: true })),
}));

test("login CTA disabled until email and password present, navigates on success", async () => {
  render(<LoginPage />);

  const button = screen.getByTestId("sign-in-button");
  expect(button).toBeDisabled();

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "a@b.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "secret123" },
  });
  expect(button).not.toBeDisabled();

  fireEvent.click(button);
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
});
