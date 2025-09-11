type ErrorContext = Record<string, unknown>;

const isProd =
  typeof process !== "undefined" && process.env.NODE_ENV === "production";

export function reportError(error: unknown, context?: ErrorContext) {
  if (!isProd) {
    if ((process as any).env?.SENTRY_DEBUG === "1") {
      // eslint-disable-next-line no-console
      console.error("[error]", error, context);
    }
    return;
  }
  try {
    (window as any)?.Sentry?.captureException?.(error, { extra: context || {} });
  } catch (_e) {
    // swallow
  }
}


