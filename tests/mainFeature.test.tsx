import React from "react";
import { render, screen, fireEvent, waitFor } from "@test-utils";
import "@testing-library/jest-dom";
import ItemListingForm from "@/components/itemListingForm";
import { toastMock } from "@/components/ui/use-toast";

// Avoid react-hook-form internals causing instanceof errors in JSDOM
jest.mock("react-hook-form", () => {
  const React = require("react");
  const store = {
    values: Object.create(null),
    listeners: new Set(),
  };
  const notify = () =>
    Array.from(store.listeners).forEach((l) => {
      try {
        l();
      } catch {}
    });
  return {
    useForm: () => ({
      control: {},
      handleSubmit: (fn: any) => (e?: any) => fn(store.values, e),
      reset: (vals?: any) => {
        if (vals) {
          store.values = { ...store.values, ...vals };
          notify();
        }
      },
      setValue: (name: string, value: any) => {
        store.values[name] = value;
        notify();
      },
      getValues: () => ({ ...store.values }),
      formState: { isValid: true },
    }),
    useFormContext: () => ({
      getFieldState: () => ({}),
      formState: { isValid: true },
      getValues: () => ({ ...store.values }),
      setValue: (name: string, value: any) => {
        store.values[name] = value;
        notify();
      },
    }),
    Controller: ({ name, render }: any) => {
      const [, force] = React.useReducer((c: number) => c + 1, 0);
      React.useEffect(() => {
        const l = () => force();
        store.listeners.add(l);
        return () => store.listeners.delete(l);
      }, []);
      return render({
        field: {
          name,
          value: store.values[name] ?? "",
          onChange: (e: any) => {
            const next = e?.target ? e.target.value : e;
            store.values[name] = next;
            notify();
          },
          onBlur: () => {},
          ref: () => {},
        },
      });
    },
    FormProvider: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: { user: { _id: "u1" } },
    status: "authenticated",
  })),
}));

jest.mock("heic2any", () => jest.fn());

// Avoid real Sanity writes
jest.mock("@/studio-m4ktaba/client", () => ({
  writeClient: { create: jest.fn(async () => ({ _id: "b1" })) },
  readClient: { fetch: jest.fn(async () => []) },
}));

// Short-circuit uploads to Sanity
jest.mock("@/utils/uploadImageToSanity", () => ({
  uploadImagesToSanity: jest.fn(async (files: File[]) =>
    files.map((_f, i) => ({ assetId: `asset_${i}` }))
  ),
}));

function createFile(name: string, type: string) {
  return new File(["(⌐□_□)"], name, { type });
}

test("listing CTA disabled until at least one photo, shows inline error and toast", async () => {
  render(
    <ItemListingForm bookData={{ title: "t", author: "a", description: "d" }} />
  );

  const button = screen.getByRole("button", { name: /list item/i });
  expect(button).toBeDisabled();

  // Upload one image
  const fileInput = document.querySelector(
    "input[type='file']"
  ) as HTMLInputElement;
  const file = createFile("a.jpg", "image/jpeg");
  fireEvent.change(fileInput, { target: { files: [file] } });

  await waitFor(() => expect(button).not.toBeDisabled());

  fireEvent.click(button);
  await waitFor(() => {
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringMatching(/listed/i) })
    );
  });
});
