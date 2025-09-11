// tests/setup/global-polyfills.js
// Early polyfills before any test file executes

// No-op ResizeObserver for UI libs (e.g., Radix) under JSDOM
try {
  if (typeof globalThis.ResizeObserver !== "function") {
    // eslint-disable-next-line no-global-assign
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
} catch {}

// Ensure TextEncoder/TextDecoder exist as globals for libraries that expect them
try {
  const { TextEncoder, TextDecoder } = require("node:util");
  if (typeof globalThis.TextEncoder !== "function")
    globalThis.TextEncoder = TextEncoder;
  if (typeof globalThis.TextDecoder !== "function")
    globalThis.TextDecoder = TextDecoder;
} catch {}

// Ensure Web Streams exist before any fetch polyfill loads
try {
  const {
    ReadableStream,
    WritableStream,
    TransformStream,
  } = require("node:stream/web");
  if (typeof globalThis.ReadableStream !== "function")
    globalThis.ReadableStream = ReadableStream;
  if (typeof globalThis.WritableStream !== "function")
    globalThis.WritableStream = WritableStream;
  if (typeof globalThis.TransformStream !== "function")
    globalThis.TransformStream = TransformStream;
} catch {}

// Minimal FileList to prevent instanceof checks in libs
try {
  if (typeof globalThis.FileList !== "function") {
    // eslint-disable-next-line no-global-assign
    globalThis.FileList = class FileList {};
  }
  // Some libs read from window.FileList specifically
  if (typeof window !== "undefined" && typeof window.FileList !== "function") {
    // eslint-disable-next-line no-undef
    window.FileList = globalThis.FileList;
  }
} catch {}

// Ensure AbortController/AbortSignal exist for instanceof checks
try {
  if (typeof globalThis.AbortSignal !== "function") {
    // eslint-disable-next-line no-global-assign
    globalThis.AbortSignal = class AbortSignal {};
  }
  if (typeof globalThis.AbortController !== "function") {
    // eslint-disable-next-line no-global-assign
    globalThis.AbortController = class AbortController {
      constructor() {
        // @ts-ignore
        this.signal = new globalThis.AbortSignal();
      }
      abort() {}
    };
  }
} catch {}

// Ensure Web Fetch APIs exist (prefer undici if missing) - synchronous require
try {
  const needs =
    typeof globalThis.fetch !== "function" ||
    typeof globalThis.Request !== "function" ||
    typeof globalThis.Response !== "function" ||
    typeof globalThis.Headers !== "function" ||
    typeof globalThis.FormData !== "function" ||
    typeof globalThis.Blob !== "function" ||
    typeof globalThis.File !== "function";
  if (needs) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      fetch,
      Headers,
      Request,
      Response,
      FormData,
      File,
      Blob,
    } = require("undici");
    Object.assign(globalThis, {
      fetch,
      Headers,
      Request,
      Response,
      FormData,
      File,
      Blob,
    });
  }
} catch {}

// Stable URL for tests that rely on location
if (!globalThis.location) {
  Object.defineProperty(globalThis, "location", {
    value: new URL("http://localhost/"),
    writable: true,
  });
}

// Override HTMLFormElement.requestSubmit for JSDOM (always)
try {
  if (typeof globalThis.HTMLFormElement !== "undefined") {
    // eslint-disable-next-line no-extend-native
    globalThis.HTMLFormElement.prototype.requestSubmit = function (submitter) {
      if (submitter && typeof submitter.click === "function") {
        submitter.click();
        return;
      }
      const button = this.querySelector(
        'button[type="submit"], input[type="submit"]'
      );
      if (button && typeof button.click === "function") {
        button.click();
        return;
      }
      const evt = new Event("submit", { bubbles: true, cancelable: true });
      this.dispatchEvent(evt);
    };
  }
} catch {}

// Polyfill URL.createObjectURL / revokeObjectURL
try {
  if (typeof globalThis.URL === "function") {
    if (typeof globalThis.URL.createObjectURL !== "function") {
      globalThis.URL.createObjectURL = function () {
        return "blob:jest-mock://object-url";
      };
    }
    if (typeof globalThis.URL.revokeObjectURL !== "function") {
      globalThis.URL.revokeObjectURL = function () {};
    }
  }
} catch {}
